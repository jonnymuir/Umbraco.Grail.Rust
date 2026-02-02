/**
 * Content Cartographer Property Editor Extension
 * Registers the property editor with Umbraco 17
 */

class UmbContentCartographerPropertyEditor extends HTMLElement {
	static _wasmInitPromise = null;
	static _threeInitPromise = null;

	connectedCallback() {
		this.render();
		this.loadGraphData();
	}

	render() {
		this.innerHTML = `
			<div style="border:1px solid #ddd;border-radius:6px;padding:16px;background:#fafafa;">
				<h3 style="margin:0 0 12px 0;color:#1b264f;">Content Cartographer</h3>
				<div id="graph-stats" style="color:#666;margin-bottom:12px;font-size:14px;">
					Loading graph data...
				</div>
				<div id="graph-container" style="min-height:200px;background:#fff;border-radius:4px;padding:16px;">
					<canvas id="graph-canvas" style="display:none;"></canvas>
					<div id="graph-placeholder">Initializing visualization...</div>
				</div>
			</div>
		`;
	}

	async loadGraphData() {
		const statsDiv = this.querySelector('#graph-stats');
		const placeholder = this.querySelector('#graph-placeholder');
		
		try {
			const wasmModule = await this.initWasm();
			const wasm = new wasmModule.CartographerWasm();

			// Get the current node ID from the Umbraco context
			// The host property contains the Umbraco context
			const nodeId = this.host?.getContext?.()?.getEntityId?.() || 1;
			
			// Call the Cartographer API
			const response = await fetch('/api/cartographer/graph', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					node_id: nodeId,
					depth: 2,
					include_media: false
				})
			});

			if (!response.ok) {
				throw new Error(`API returned ${response.status}`);
			}

			const result = await response.json();
			
			if (result.success && result.data) {
				const { nodes, edges, statistics } = result.data;
				const nodeIdString = String(nodeId);
				
				// Update statistics
				statsDiv.innerHTML = `
					<strong>Graph Statistics:</strong><br>
					📊 Nodes: ${statistics.nodeCount} | 
					🔗 Edges: ${statistics.edgeCount} | 
					📈 Avg Connections: ${statistics.averageConnections.toFixed(2)}
				`;
				
				// Normalize fields for WASM (expects snake_case)
				const wasmNodes = nodes.map(node => ({
					id: String(node.id ?? node.Id ?? ''),
					name: node.name ?? node.Name ?? '',
					node_type: node.node_type ?? node.nodeType ?? node.NodeType ?? 'content',
					level: node.level ?? node.Level ?? 0,
					is_published: node.is_published ?? node.isPublished ?? node.IsPublished ?? true,
					path: node.path ?? node.Path ?? ''
				}));
				const wasmEdges = edges.map(edge => ({
					source: String(edge.source ?? edge.Source ?? ''),
					target: String(edge.target ?? edge.Target ?? ''),
					relationship_type: edge.relationship_type ?? edge.relationshipType ?? edge.RelationshipType ?? 'child_of',
					strength: edge.strength ?? edge.Strength ?? 1
				}));

				// Run layout in WASM and render computed positions
				console.log('🔵 INPUT: Adding nodes to WASM:', wasmNodes);
				wasm.add_nodes(JSON.stringify(wasmNodes));
				console.log('🔵 INPUT: Adding edges to WASM:', wasmEdges);
				wasm.add_edges(JSON.stringify(wasmEdges));
				const layoutJson = wasm.calculate_layout(nodeIdString, 200);
				console.log('🟢 WASM OUTPUT (raw JSON):', layoutJson);
				const layout = JSON.parse(layoutJson);
				console.log('🟢 WASM OUTPUT (parsed):', layout);
				const layoutNodes = Array.isArray(layout?.nodes) ? layout.nodes : Array.isArray(layout) ? layout : [];
				console.log('🟢 LAYOUT NODES (extracted):', layoutNodes, 'Count:', layoutNodes.length);

				placeholder.innerHTML = `
					<div style="font-size:13px;">
						<strong>Layout (WASM computed):</strong>
						<ul style="margin:8px 0;padding-left:20px;">
							${layoutNodes.map(node => `
								<li style="margin:4px 0;">
									<strong>${node.name || node.label || 'Node'}</strong>
									<span style="color:#666;">ID: ${node.id}</span>
									<span style="color:#999;"> | x: ${Number(node.x ?? 0).toFixed(2)}, y: ${Number(node.y ?? 0).toFixed(2)}, z: ${Number(node.z ?? 0).toFixed(2)}</span>
								</li>
							`).join('')}
						</ul>
						<div style="margin-top:12px;padding:12px;background:#e3f2fd;border-radius:4px;font-size:12px;">
							<strong>✅ WASM OK:</strong> Layout computed. Use Three.js to render these positions in WebGL.
						</div>
					</div>
				`;

				console.log('🎨 RENDERING: Calling renderThree with', layoutNodes.length, 'nodes and', edges.length, 'edges');
				await this.renderThree(layoutNodes, edges);
				wasm.free?.();
			} else {
				placeholder.innerHTML = '<div style="color:#d32f2f;">Failed to load graph data</div>';
			}
			
		} catch (error) {
			console.error('Error loading graph:', error);
			statsDiv.innerHTML = '<span style="color:#d32f2f;">Error loading graph data</span>';
			placeholder.innerHTML = `
				<div style="color:#d32f2f;font-size:13px;">
					<strong>Error:</strong> ${error.message}<br>
					<span style="color:#666;font-size:12px;">Check browser console for details</span>
				</div>
			`;
		}
	}

	async initWasm() {
		if (!UmbContentCartographerPropertyEditor._wasmInitPromise) {
			UmbContentCartographerPropertyEditor._wasmInitPromise = (async () => {
				const module = await import('/app_plugins/content-cartographer/wasm/grail_core.js');
				await module.default();
				return module;
			})();
		}

		return UmbContentCartographerPropertyEditor._wasmInitPromise;
	}

	async initThree() {
		if (!UmbContentCartographerPropertyEditor._threeInitPromise) {
			UmbContentCartographerPropertyEditor._threeInitPromise = (async () => {
				const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
				return { THREE };
			})();
		}

		return UmbContentCartographerPropertyEditor._threeInitPromise;
	}

	async renderThree(layoutNodes, edges, fallbackNodes = []) {
		const container = this.querySelector('#graph-container');
		const placeholder = this.querySelector('#graph-placeholder');
		if (!container) return;

		const { THREE } = await this.initThree();
		const width = container.clientWidth || 600;
		const height = 320;

		if (!this._three) {
			const renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setSize(width, height);
			renderer.setPixelRatio(window.devicePixelRatio || 1);
			renderer.domElement.style.width = '100%';
			renderer.domElement.style.height = `${height}px`;
			renderer.domElement.style.borderRadius = '4px';
			renderer.domElement.style.display = 'block';
			renderer.domElement.style.background = '#ffffff';
			container.appendChild(renderer.domElement);

			const scene = new THREE.Scene();
			scene.background = new THREE.Color(0xffffff);
			const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
			camera.position.set(0, 0, 120);

			const ambient = new THREE.AmbientLight(0xffffff, 0.8);
			scene.add(ambient);
			const directional = new THREE.DirectionalLight(0xffffff, 0.6);
			directional.position.set(50, 50, 100);
			scene.add(directional);

			this._three = { renderer, scene, camera, objects: [] };

			const animate = () => {
				if (!this.isConnected) return;
				renderer.render(scene, camera);
				requestAnimationFrame(animate);
			};
			requestAnimationFrame(animate);
		}

		const { scene, objects } = this._three;
		objects.forEach(obj => scene.remove(obj));
		objects.length = 0;

		const positions = [];
		const nodeIndex = new Map();
		const sourceNodes = layoutNodes.length > 0 ? layoutNodes : fallbackNodes;
		console.log('🎨 RENDER: Using', sourceNodes.length > 0 ? 'layoutNodes' : 'fallbackNodes', '- Total:', sourceNodes.length);
		sourceNodes.forEach((node, index) => {
			const pos = node.position || node.pos || {};
			const x = Number(node.x ?? pos.x ?? 0);
			const y = Number(node.y ?? pos.y ?? 0);
			const z = Number(node.z ?? pos.z ?? 0);
			const hasPosition = layoutNodes.length > 0 || (node.x ?? pos.x) !== undefined;
			const angle = (index / Math.max(sourceNodes.length, 1)) * Math.PI * 2;
			const radius = 8 + sourceNodes.length * 0.6;
		const fx = hasPosition ? x : Math.cos(angle) * radius;
		const fy = hasPosition ? y : Math.sin(angle) * radius;
		const fz = hasPosition ? z : 0;
			if (index < 3) console.log(`🎨 Node ${index} (${node.id}): pos=(${x},${y},${z}) hasPos=${hasPosition} final=(${fx},${fy},${fz})`);
			positions.push(fx, fy, fz);
			nodeIndex.set(String(node.id), { x: fx, y: fy, z: fz });
		});

		console.log('🎨 GEOMETRY: Creating points with', positions.length / 3, 'vertices');
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		const material = new THREE.PointsMaterial({ color: 0x2d7ff9, size: 2.5 });
		const points = new THREE.Points(geometry, material);
		console.log('🎨 POINTS: Created points object:', points, 'Position count:', positions.length / 3);
		scene.add(points);
		objects.push(points);

		const edgePositions = [];
		edges.forEach(edge => {
			const source = nodeIndex.get(String(edge.source));
			const target = nodeIndex.get(String(edge.target));
			if (source && target) {
				edgePositions.push(source.x, source.y, source.z, target.x, target.y, target.z);
			}
		});

			console.log('🎨 EDGES: Processing', edges.length, 'edges, edge positions:', edgePositions.length / 6);
		if (edgePositions.length > 0) {
			const edgeGeometry = new THREE.BufferGeometry();
			edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
			const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x9aa7b2, linewidth: 1 });
			const lines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
			console.log('🎨 LINES: Created line segments:', lines);
			scene.add(lines);
			objects.push(lines);
		} else {
			console.warn('⚠️ No edge positions to render');
		}

		if (placeholder) {
			placeholder.style.display = 'none';
		}
	}
}

customElements.define('umb-content-cartographer-property-editor', UmbContentCartographerPropertyEditor);

export default [
	{
		type: 'propertyEditorSchema',
		alias: 'Umbraco.ContentCartographer',
		name: 'Content Cartographer',
		meta: {
			icon: 'icon-graph-line',
			group: 'pickers',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.ContentCartographer',
			settings: {
				properties: [
					{
						alias: 'showStats',
						label: 'Show Statistics',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Toggle'
					},
					{
						alias: 'autoFocus',
						label: 'Auto-Focus Mode',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Toggle'
					},
					{
						alias: 'nodeSize',
						label: 'Node Size',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextBox'
					}
				]
			}
		}
	},
	{
		type: 'propertyEditorUi',
		alias: 'Umb.PropertyEditorUi.ContentCartographer',
		name: 'Content Cartographer',
		elementName: 'umb-content-cartographer-property-editor',
		meta: {
			label: 'Content Cartographer',
			propertyEditorSchemaAlias: 'Umbraco.ContentCartographer',
			icon: 'icon-graph-line',
			group: 'pickers',
			description: '3D force-directed graph visualization of content relationships'
		}
	}
];
