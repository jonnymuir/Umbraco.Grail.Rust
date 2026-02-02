import { LitElement as f, css as y, html as n } from "lit";
import * as r from "three";
const l = class l extends f {
  constructor() {
    super(), this.error = "", this.impact = null, this.loading = !1, this.animate = () => {
      requestAnimationFrame(this.animate), this.renderer && this.scene && this.camera && this.renderer.render(this.scene, this.camera);
    }, this.nodeId = "1", this.baseUrl = "/api/cartographer", this.config = {};
  }
  async firstUpdated() {
    try {
      await this.loadWasm(), console.log("✅ WASM loaded"), this.initThree(), await this.loadGraphData();
    } catch (e) {
      this.error = `Failed: ${e instanceof Error ? e.message : String(e)}`, console.error(this.error, e);
    }
  }
  loadWasm() {
    return new Promise((e, t) => {
      const i = document.createElement("script");
      i.src = "/wasm/grail_core.js", i.type = "text/javascript", i.onload = () => {
        setTimeout(() => {
          this.wasm = window.grail_core || window.wasm_bindgen, !this.wasm || !this.wasm.CartographerWasm ? t(new Error("WASM module not available after load")) : e();
        }, 100);
      }, i.onerror = () => t(new Error("Failed to load WASM script")), document.head.appendChild(i);
    });
  }
  async loadGraphData() {
    var e, t;
    if (!(!this.wasm || !this.scene)) {
      this.loading = !0, this.requestUpdate();
      try {
        console.log("📡 Fetching graph from", `${this.baseUrl}/graph`);
        const i = await fetch(`${this.baseUrl}/graph`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            node_id: parseInt(this.nodeId) || 1,
            depth: 3,
            include_media: !0,
            include_tags: !0,
            include_unpublished: !1
          })
        });
        if (!i.ok) {
          const s = await i.text();
          throw new Error(`HTTP ${i.status}: ${s}`);
        }
        const a = await i.json();
        if (console.log("📦 API response:", a), !a.success) throw new Error(a.error || "API error");
        const o = a.data;
        console.log("📊 Graph loaded:", { nodes: ((e = o.nodes) == null ? void 0 : e.length) || 0, edges: ((t = o.edges) == null ? void 0 : t.length) || 0 }), this.renderGraph(o), await this.loadImpact();
      } catch (i) {
        this.error = `Load failed: ${i instanceof Error ? i.message : String(i)}`, console.error(this.error, i), console.log("⚠️ Falling back to demo graph"), this.renderDemoGraph();
      } finally {
        this.loading = !1, this.requestUpdate();
      }
    }
  }
  renderDemoGraph() {
    if (!(!this.wasm || !this.scene))
      try {
        const { CartographerWasm: e } = this.wasm, t = new e(), o = { nodes: [
          { id: "1", name: "Homepage", node_type: "content", level: 0, is_published: !0 },
          { id: "2", name: "About", node_type: "content", level: 1, is_published: !0 },
          { id: "3", name: "Services", node_type: "content", level: 1, is_published: !0 },
          { id: "4", name: "Blog", node_type: "content", level: 1, is_published: !0 },
          { id: "5", name: "Logo", node_type: "media", level: 0, is_published: !0 },
          { id: "6", name: "Team", node_type: "media", level: 1, is_published: !0 },
          { id: "7", name: "Featured", node_type: "tag", level: 0, is_published: !0 },
          { id: "8", name: "Article", node_type: "content", level: 2, is_published: !0 },
          { id: "9", name: "Archive", node_type: "content", level: 2, is_published: !1 },
          { id: "10", name: "Contact", node_type: "content", level: 1, is_published: !0 }
        ], edges: [
          { source: "1", target: "2", relationship_type: "child_of", strength: 1 },
          { source: "1", target: "3", relationship_type: "child_of", strength: 1 },
          { source: "1", target: "4", relationship_type: "child_of", strength: 1 },
          { source: "1", target: "5", relationship_type: "uses_media", strength: 0.8 },
          { source: "1", target: "10", relationship_type: "child_of", strength: 1 },
          { source: "2", target: "6", relationship_type: "uses_media", strength: 0.7 },
          { source: "3", target: "7", relationship_type: "tagged_with", strength: 0.5 },
          { source: "4", target: "8", relationship_type: "child_of", strength: 1 },
          { source: "4", target: "9", relationship_type: "child_of", strength: 1 },
          { source: "8", target: "7", relationship_type: "tagged_with", strength: 0.5 }
        ] };
        this.renderGraph(o), console.log("✅ Demo graph rendered (Rust physics)");
      } catch (e) {
        this.error = `Demo render failed: ${e instanceof Error ? e.message : String(e)}`, console.error(this.error, e);
      }
  }
  async loadImpact() {
    try {
      const e = await fetch(`${this.baseUrl}/impact?nodeId=${this.nodeId}`, {
        method: "POST"
      });
      if (!e.ok) throw new Error(`HTTP ${e.status}`);
      const t = await e.json();
      if (!t.success) throw new Error(t.error || "API error");
      this.impact = t.data, console.log("📈 Impact:", this.impact.impact_score), this.requestUpdate();
    } catch (e) {
      console.warn("Impact load failed:", e);
    }
  }
  renderGraph(e) {
    if (this.scene)
      try {
        const { CartographerWasm: t } = this.wasm, i = new t();
        i.add_nodes(JSON.stringify(e.nodes)), i.add_edges(JSON.stringify(e.edges));
        const a = i.calculate_layout(this.nodeId, 100), o = JSON.parse(a);
        this.scene.children.slice().forEach((s) => {
          s instanceof r.Light || this.scene.remove(s);
        }), o.nodes.forEach((s) => {
          const d = {
            media: 1096065,
            tag: 16096779,
            content: 5195493
          }, c = s.id === this.nodeId ? 16739179 : d[s.node_type] || 5195493, g = new r.SphereGeometry(5, 16, 16), m = new r.MeshPhongMaterial({ color: c }), h = new r.Mesh(g, m);
          h.position.set(s.x * 1.5, s.y * 1.5, s.z), this.scene.add(h);
        }), o.edges.forEach((s) => {
          const d = o.nodes.find((h) => h.id === s.source), c = o.nodes.find((h) => h.id === s.target);
          if (!d || !c) return;
          const g = new r.BufferGeometry().setFromPoints([
            new r.Vector3(d.x * 1.5, d.y * 1.5, d.z),
            new r.Vector3(c.x * 1.5, c.y * 1.5, c.z)
          ]), m = new r.LineBasicMaterial({
            color: 7041664,
            transparent: !0,
            opacity: 0.3 * s.strength
          });
          this.scene.add(new r.Line(g, m));
        }), console.log("✅ Graph rendered (Rust physics)");
      } catch (t) {
        this.error = `Render failed: ${t instanceof Error ? t.message : String(t)}`, console.error(this.error, t);
      }
  }
  initThree() {
    if (!this.canvasContainer) return;
    const e = this.canvasContainer.clientWidth, t = this.canvasContainer.clientHeight;
    this.scene = new r.Scene(), this.scene.background = new r.Color(988970), this.camera = new r.PerspectiveCamera(75, e / t, 0.1, 1e4), this.camera.position.z = 200, this.renderer = new r.WebGLRenderer({ antialias: !0 }), this.renderer.setSize(e, t), this.renderer.setPixelRatio(window.devicePixelRatio), this.canvasContainer.appendChild(this.renderer.domElement);
    const i = new r.AmbientLight(16777215, 0.6);
    this.scene.add(i);
    const a = new r.DirectionalLight(16777215, 0.8);
    a.position.set(100, 100, 100), this.scene.add(a), this.animate();
  }
  render() {
    return n`
      <div class="wrapper">
        <div class="main">
          <div class="header">
            Content Cartographer (Node: ${this.nodeId}) ${this.wasm ? "✅" : "⏳"}
          </div>
          <div class="canvas-container" style="position: relative;"></div>
          ${this.error ? n`<div class="error">${this.error}</div>` : ""}
          <div class="controls">Powered by Rust petgraph + three.js</div>
        </div>
        <div class="sidebar">
          ${this.loading ? n`<div class="loading">Loading...</div>` : ""}
          ${this.impact ? n`
                <h3>Impact Analysis</h3>
                <div class="impact-metric">
                  <div style="font-weight: 600; margin-bottom: 4px;">Score</div>
                  <div class="impact-bar">
                    <div class="impact-fill" style="width: ${this.impact.impact_score * 100}%"></div>
                  </div>
                  <div style="color: #999; font-size: 11px;">${(this.impact.impact_score * 100).toFixed(1)}%</div>
                </div>
                ${this.impact.directly_dependent.length > 0 ? n`<div class="impact-metric">
                      <strong>${this.impact.directly_dependent.length}</strong> directly affected
                    </div>` : ""}
                ${this.impact.indirectly_dependent.length > 0 ? n`<div class="impact-metric">
                      <strong>${this.impact.indirectly_dependent.length}</strong> indirectly affected
                    </div>` : ""}
                ${this.impact.backlinks.length > 0 ? n`<div class="impact-metric">
                      <strong>${this.impact.backlinks.length}</strong> backlinks
                    </div>` : ""}
              ` : ""}
        </div>
      </div>
    `;
  }
  updated() {
    var t;
    const e = (t = this.shadowRoot) == null ? void 0 : t.querySelector(".canvas-container");
    e && !this.canvasContainer && (this.canvasContainer = e, this.renderer || this.initThree());
  }
};
l.styles = y`
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
  `, l.properties = {
  nodeId: { type: String },
  baseUrl: { type: String },
  config: { type: Object }
};
let u = l;
customElements.define("content-cartographer", u);
async function b() {
  try {
    return await import("/wasm/grail_core.js");
  } catch (p) {
    throw console.error("Failed to initialize Cartographer WASM module:", p), p;
  }
}
const v = {
  showDepth: 3,
  visualizationMode: "force-directed",
  highlightRelationships: ["depends_on", "uses_media", "tagged_with", "references"],
  enableImpactAnalysis: !0,
  enableExport: !0,
  physics: { temperature: 100, cooling: 0.1, iterations: 100 }
}, _ = "1.0.0", x = "@umbraco-grail/content-cartographer";
export {
  u as ContentCartographer,
  v as DEFAULT_CONFIG,
  x as PACKAGE_NAME,
  _ as VERSION,
  b as initializeCartographer
};
