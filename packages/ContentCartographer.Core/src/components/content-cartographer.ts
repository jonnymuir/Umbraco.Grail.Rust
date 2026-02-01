import { LitElement, html, css } from 'lit';
import * as THREE from 'three';

/**
 * Content Cartographer — Minimal Lit Web Component
 * 
 * Bridges Rust WASM graph engine + three.js for 3D force-directed graph visualization.
 * Calls Umbraco API endpoints for real content data.
 */
export class ContentCartographer extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
    .wrapper {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }
    .main { display: flex; flex-direction: column; }
    .header {
      padding: 12px 16px;
      background: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      font-weight: 600;
      color: #111;
    }
    .canvas-container {
      flex: 1;
      background: #0f172a;
      position: relative;
      min-height: 500px;
    }
    canvas { display: block; width: 100%; height: 100%; }
    .controls {
      padding: 8px 12px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #666;
    }
    .sidebar {
      background: #f9fafb;
      border-left: 1px solid #e5e7eb;
      padding: 12px;
      overflow-y: auto;
      max-height: calc(500px + 50px);
      font-size: 13px;
    }
    .sidebar h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
    }
    .impact-metric {
      margin-bottom: 12px;
      padding: 8px;
      background: white;
      border-radius: 4px;
      border-left: 3px solid #4f46e5;
    }
    .impact-bar {
      width: 100%;
      height: 6px;
      background: #e5e7eb;
      border-radius: 2px;
      margin: 4px 0;
      overflow: hidden;
    }
    .impact-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #ef4444);
    }
    .error {
      color: #dc2626;
      padding: 12px;
      font-size: 12px;
      background: #fee;
      border: 1px solid #fca;
      border-radius: 4px;
    }
    .loading {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
  `;

  static properties = {
    nodeId: { type: String },
    baseUrl: { type: String },
    config: { type: Object },
  };

  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private renderer?: THREE.WebGLRenderer;
  private wasm?: any;
  private canvasContainer?: HTMLDivElement;
  private error: string = '';
  private impact: any = null;
  private loading: boolean = false;

  constructor() {
    super();
    this.nodeId = '1';
    this.baseUrl = '/api/cartographer';
    this.config = {};
  }

  async firstUpdated() {
    try {
      // Load WASM module by inserting script tag
      // The wasm-bindgen JS module auto-initializes and exports to window
      await this.loadWasm();
      console.log('✅ WASM loaded');

      this.initThree();
      await this.loadGraphData();
    } catch (err) {
      this.error = `Failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(this.error, err);
    }
  }

  private loadWasm(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/wasm/grail_core.js';
      script.type = 'text/javascript';
      script.onload = () => {
        // wasm-bindgen exports to window.grail_core or similar
        setTimeout(() => {
          this.wasm = (window as any).grail_core || (window as any).wasm_bindgen;
          if (!this.wasm || !this.wasm.CartographerWasm) {
            reject(new Error('WASM module not available after load'));
          } else {
            resolve();
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load WASM script'));
      document.head.appendChild(script);
    });
  }

  private async loadGraphData() {
    if (!this.wasm || !this.scene) return;

    this.loading = true;
    this.requestUpdate();

    try {
      console.log('📡 Fetching graph from', `${this.baseUrl}/graph`);
      
      const response = await fetch(`${this.baseUrl}/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: parseInt(this.nodeId) || 1,
          depth: 3,
          include_media: true,
          include_tags: true,
          include_unpublished: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('📦 API response:', result);

      if (!result.success) throw new Error(result.error || 'API error');

      const graph = result.data;
      console.log('📊 Graph loaded:', { nodes: graph.nodes?.length || 0, edges: graph.edges?.length || 0 });

      // Render graph using Rust engine
      this.renderGraph(graph);

      // Load impact analysis
      await this.loadImpact();
    } catch (err) {
      this.error = `Load failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(this.error, err);
      // Fall back to demo graph if API fails
      console.log('⚠️ Falling back to demo graph');
      this.renderDemoGraph();
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  private renderDemoGraph() {
    if (!this.wasm || !this.scene) return;

    try {
      const { CartographerWasm } = this.wasm;
      const engine = new CartographerWasm();

      // Demo graph: 10 nodes
      const nodes = [
        { id: '1', name: 'Homepage', node_type: 'content', level: 0, is_published: true },
        { id: '2', name: 'About', node_type: 'content', level: 1, is_published: true },
        { id: '3', name: 'Services', node_type: 'content', level: 1, is_published: true },
        { id: '4', name: 'Blog', node_type: 'content', level: 1, is_published: true },
        { id: '5', name: 'Logo', node_type: 'media', level: 0, is_published: true },
        { id: '6', name: 'Team', node_type: 'media', level: 1, is_published: true },
        { id: '7', name: 'Featured', node_type: 'tag', level: 0, is_published: true },
        { id: '8', name: 'Article', node_type: 'content', level: 2, is_published: true },
        { id: '9', name: 'Archive', node_type: 'content', level: 2, is_published: false },
        { id: '10', name: 'Contact', node_type: 'content', level: 1, is_published: true },
      ];

      const edges = [
        { source: '1', target: '2', relationship_type: 'child_of', strength: 1.0 },
        { source: '1', target: '3', relationship_type: 'child_of', strength: 1.0 },
        { source: '1', target: '4', relationship_type: 'child_of', strength: 1.0 },
        { source: '1', target: '5', relationship_type: 'uses_media', strength: 0.8 },
        { source: '1', target: '10', relationship_type: 'child_of', strength: 1.0 },
        { source: '2', target: '6', relationship_type: 'uses_media', strength: 0.7 },
        { source: '3', target: '7', relationship_type: 'tagged_with', strength: 0.5 },
        { source: '4', target: '8', relationship_type: 'child_of', strength: 1.0 },
        { source: '4', target: '9', relationship_type: 'child_of', strength: 1.0 },
        { source: '8', target: '7', relationship_type: 'tagged_with', strength: 0.5 },
      ];

      const graph = { nodes, edges };
      this.renderGraph(graph);
      console.log('✅ Demo graph rendered (Rust physics)');
    } catch (err) {
      this.error = `Demo render failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(this.error, err);
    }
  }

  private async loadImpact() {
    try {
      const response = await fetch(`${this.baseUrl}/impact?nodeId=${this.nodeId}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'API error');

      this.impact = result.data;
      console.log('📈 Impact:', this.impact.impact_score);
      this.requestUpdate();
    } catch (err) {
      console.warn('Impact load failed:', err);
    }
  }

  private renderGraph(graph: any) {
    if (!this.scene) return;

    try {
      const { CartographerWasm } = this.wasm;
      const engine = new CartographerWasm();

      engine.add_nodes(JSON.stringify(graph.nodes));
      engine.add_edges(JSON.stringify(graph.edges));

      const layoutJson = engine.calculate_layout(this.nodeId, 100);
      const layout = JSON.parse(layoutJson);

      // Clear scene
      this.scene.children.slice().forEach(child => {
        if (!(child instanceof THREE.Light)) this.scene!.remove(child);
      });

      // Render nodes
      layout.nodes.forEach((node: any) => {
        const typeColors: Record<string, number> = {
          media: 0x10b981,
          tag: 0xf59e0b,
          content: 0x4f46e5,
        };
        const color = node.id === this.nodeId ? 0xff6b6b : typeColors[node.node_type] || 0x4f46e5;

        const geometry = new THREE.SphereGeometry(5, 16, 16);
        const material = new THREE.MeshPhongMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(node.x * 1.5, node.y * 1.5, node.z);
        this.scene!.add(mesh);
      });

      // Render edges
      layout.edges.forEach((edge: any) => {
        const src = layout.nodes.find((n: any) => n.id === edge.source);
        const tgt = layout.nodes.find((n: any) => n.id === edge.target);
        if (!src || !tgt) return;

        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(src.x * 1.5, src.y * 1.5, src.z),
          new THREE.Vector3(tgt.x * 1.5, tgt.y * 1.5, tgt.z),
        ]);
        const material = new THREE.LineBasicMaterial({
          color: 0x6b7280,
          transparent: true,
          opacity: 0.3 * edge.strength,
        });
        this.scene!.add(new THREE.Line(geometry, material));
      });

      console.log('✅ Graph rendered (Rust physics)');
    } catch (err) {
      this.error = `Render failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(this.error, err);
    }
  }

  private initThree() {
    if (!this.canvasContainer) return;

    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    this.camera.position.z = 200;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.canvasContainer.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    this.scene.add(directionalLight);

    this.animate();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  render() {
    return html`
      <div class="wrapper">
        <div class="main">
          <div class="header">
            Content Cartographer (Node: ${this.nodeId}) ${this.wasm ? '✅' : '⏳'}
          </div>
          <div class="canvas-container" style="position: relative;"></div>
          ${this.error ? html`<div class="error">${this.error}</div>` : ''}
          <div class="controls">Powered by Rust petgraph + three.js</div>
        </div>
        <div class="sidebar">
          ${this.loading ? html`<div class="loading">Loading...</div>` : ''}
          ${this.impact
            ? html`
                <h3>Impact Analysis</h3>
                <div class="impact-metric">
                  <div style="font-weight: 600; margin-bottom: 4px;">Score</div>
                  <div class="impact-bar">
                    <div class="impact-fill" style="width: ${this.impact.impact_score * 100}%"></div>
                  </div>
                  <div style="color: #999; font-size: 11px;">${(this.impact.impact_score * 100).toFixed(1)}%</div>
                </div>
                ${this.impact.directly_dependent.length > 0
                  ? html`<div class="impact-metric">
                      <strong>${this.impact.directly_dependent.length}</strong> directly affected
                    </div>`
                  : ''}
                ${this.impact.indirectly_dependent.length > 0
                  ? html`<div class="impact-metric">
                      <strong>${this.impact.indirectly_dependent.length}</strong> indirectly affected
                    </div>`
                  : ''}
                ${this.impact.backlinks.length > 0
                  ? html`<div class="impact-metric">
                      <strong>${this.impact.backlinks.length}</strong> backlinks
                    </div>`
                  : ''}
              `
            : ''}
        </div>
      </div>
    `;
  }

  updated() {
    const canvasDiv = this.shadowRoot?.querySelector('.canvas-container') as HTMLDivElement;
    if (canvasDiv && !this.canvasContainer) {
      this.canvasContainer = canvasDiv;
      if (!this.renderer) {
        this.initThree();
      }
    }
  }
}

customElements.define('content-cartographer', ContentCartographer);
