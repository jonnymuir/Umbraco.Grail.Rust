// @ts-nocheck
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
				<div style="display:flex;gap:12px;margin-bottom:12px;">
					<input type="text" id="node-search" placeholder="Search nodes..." style="flex:1;padding:6px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;">
					<button id="reset-view" style="padding:6px 16px;background:#2d7ff9;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Reset View</button>
				</div>
				<div id="graph-stats" style="color:#666;margin-bottom:12px;font-size:14px;">
					Loading graph data...
				</div>
				<div id="graph-container" style="position:relative;min-height:500px;background:#fff;border-radius:4px;overflow:hidden;">
					<div id="graph-placeholder" style="position:absolute;top:16px;left:16px;z-index:10;background:rgba(255,255,255,0.9);padding:12px;border-radius:4px;max-width:300px;">Initializing visualization...</div>
				</div>
				<div style="margin-top:12px;font-size:12px;color:#666;">
					<strong>Controls:</strong> Left-click + drag to rotate | Right-click + drag to pan | Scroll to zoom | Click node to select
				</div>
			</div>
		`;
	}

	async loadGraphData() {
		const statsDiv = this.querySelector('#graph-stats');
		const placeholder = this.querySelector('#graph-placeholder');
		const searchInput = this.querySelector('#node-search');
		const resetBtn = this.querySelector('#reset-view');
		
		try {
			const wasmModule = await this.initWasm();
			const wasm = new wasmModule.CartographerWasm();

			// Get the current node ID from the Umbraco context
			const nodeId = this.host?.getContext?.()?.getEntityId?.() || 1;
			
			// Call the Cartographer API
			const response = await fetch('/api/cartographer/graph', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					node_id: nodeId,
					depth: 10,
					include_media: true
				})
			});

			if (!response.ok) {
				throw new Error(`API returned ${response.status}`);
			}

			const result = await response.json();
			
			if (result.success && result.data) {
				const { nodes, edges, statistics } = result.data;
				const nodeIdString = String(nodeId);
				
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

				// Run layout in WASM
				console.log('INPUT: Adding nodes to WASM:', wasmNodes);
				wasm.add_nodes(JSON.stringify(wasmNodes));
				console.log('INPUT: Adding edges to WASM:', wasmEdges);
				wasm.add_edges(JSON.stringify(wasmEdges));
				
				const startTime = performance.now();
				const layoutJson = wasm.calculate_layout(nodeIdString, 200);
				const computeTime = (performance.now() - startTime).toFixed(2);
				
				console.log('WASM OUTPUT (raw JSON):', layoutJson);
				console.log(`WASM computed layout in ${computeTime}ms`);
				
				const layout = JSON.parse(layoutJson);
				console.log('WASM OUTPUT (parsed):', layout);
				
				const layoutNodes = Array.isArray(layout?.nodes) ? layout.nodes : Array.isArray(layout) ? layout : [];
				console.log('LAYOUT NODES (extracted):', layoutNodes, 'Count:', layoutNodes.length);

				// Calculate PageRank for node sizing
				const pageRankJson = wasm.calculate_pagerank();
				const pageRankData = JSON.parse(pageRankJson);
				console.log('PageRank calculated:', pageRankData);

				// Detect communities for color coding
				const communitiesJson = wasm.detect_communities();
				const communitiesData = JSON.parse(communitiesJson);
				console.log('Communities detected:', communitiesData);

			// Create a map of original node data by ID for quick lookup
			const nodeDataMap = new Map();
			wasmNodes.forEach(node => {
				nodeDataMap.set(String(node.id), node);
			});

			// Merge PageRank, community data, and original node names into layout nodes
			layoutNodes.forEach(node => {
				const nodeIdStr = String(node.id);
				node.pagerank = pageRankData[nodeIdStr] || 0;
				node.community = communitiesData[nodeIdStr] || 0;
				
				// Get the original node data to retrieve the name
				const originalNode = nodeDataMap.get(nodeIdStr);
				if (originalNode) {
					node.name = originalNode.name;
				}			});

			// Update statistics
			statsDiv.innerHTML = `
				<strong>Graph Statistics:</strong><br>
				Nodes: ${statistics.nodeCount} | 
				Edges: ${statistics.edgeCount} | 
				Avg Connections: ${statistics.averageConnections.toFixed(2)} |
				WASM Layout: ${computeTime}ms
			`;

			placeholder.innerHTML = `
				<div style="font-size:12px;background:rgba(45,127,249,0.1);padding:8px;border-radius:4px;">						<strong>Rendering 3D graph...</strong><br>
						${layoutNodes.length} nodes with PageRank sizing and community colors
					</div>
				`;

				console.log('RENDERING: Calling renderThree with', layoutNodes.length, 'nodes and', edges.length, 'edges');
				await this.renderThree(layoutNodes, edges, wasmNodes);
				
				// Setup search functionality
				if (searchInput) {
					searchInput.addEventListener('input', (e) => {
						this.filterNodes(e.target.value);
					});
				}

				// Setup reset view button
				if (resetBtn && this._three?.camera && this._three?.controls) {
					resetBtn.addEventListener('click', () => {
						this._three.camera.position.set(0, 0, 300);
						this._three.controls.reset();
					});
				}

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
				// Use esm.sh CDN which handles dependencies properly
				const THREE = await import('https://esm.sh/three@0.160.0');
				const { OrbitControls } = await import('https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js');
				
				return { THREE, OrbitControls };
			})();
		}

		return UmbContentCartographerPropertyEditor._threeInitPromise;
	}

	async renderThree(layoutNodes, edges, allNodes = []) {
		const container = this.querySelector('#graph-container');
		const placeholder = this.querySelector('#graph-placeholder');
		if (!container) return;

		const { THREE, OrbitControls } = await this.initThree();
		const width = container.clientWidth || 600;
		const height = 500;

		// Community colors
		const communityColors = [
			0x2d7ff9, // Blue
			0xff6b6b, // Red
			0x51cf66, // Green
			0xffd43b, // Yellow
			0x845ef7, // Purple
			0xff8787, // Pink
			0x20c997, // Teal
			0xffa94d, // Orange
		];

		if (!this._three) {
			const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			renderer.setSize(width, height);
			renderer.setPixelRatio(window.devicePixelRatio || 1);
			renderer.domElement.style.width = '100%';
			renderer.domElement.style.height = `${height}px`;
			renderer.domElement.style.display = 'block';
			container.appendChild(renderer.domElement);

			const scene = new THREE.Scene();
			scene.background = new THREE.Color(0xf8f9fa);
			
			const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
			camera.position.set(0, 0, 300);
			
			// Add orbit controls for mouse interaction
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.05;
			controls.minDistance = 50;
			controls.maxDistance = 1000;
			controls.enablePan = true;

			const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
			scene.add(ambientLight);
			
			const directional = new THREE.DirectionalLight(0xffffff, 0.8);
			directional.position.set(50, 50, 100);
			scene.add(directional);

			this._three = { renderer, scene, camera, controls, objects: [], labels: [], nodeData: [] };

			const animate = () => {
				if (!this.isConnected) return;
				controls.update();
				renderer.render(scene, camera);
				requestAnimationFrame(animate);
			};
			requestAnimationFrame(animate);
		}

		const { scene, camera, objects, labels } = this._three;
		
		// Clear previous objects
		objects.forEach(obj => scene.remove(obj));
		objects.length = 0;
		labels.forEach(label => label.element?.remove());
		labels.length = 0;

		const nodeIndex = new Map();
		const sourceNodes = layoutNodes.length > 0 ? layoutNodes : allNodes;
		this._three.nodeData = sourceNodes;
		
		console.log('RENDER: Using', sourceNodes.length, 'nodes with PageRank and communities');

		// Create individual spheres for each node with PageRank sizing and community coloring
		sourceNodes.forEach((node, index) => {
			const x = Number(node.x ?? 0);
			const y = Number(node.y ?? 0);
			const z = Number(node.z ?? 0);
			
			// Size based on PageRank (0.01-0.5 range mapped to 2-12 size)
			const pagerank = node.pagerank || 0;
			const size = 2 + (pagerank * 50); // Scale up PageRank for visible differences
			
			// Color based on community
			const communityId = node.community || 0;
			const color = communityColors[communityId % communityColors.length];
			
			// Create sphere for each node
			const geometry = new THREE.SphereGeometry(size, 16, 16);
			const material = new THREE.MeshPhongMaterial({ 
				color: color,
				emissive: color,
				emissiveIntensity: 0.2,
				shininess: 30
			});
			const sphere = new THREE.Mesh(geometry, material);
			sphere.position.set(x, y, z);
			sphere.userData = { nodeId: node.id, nodeName: node.name, pagerank, community: communityId };
			
			scene.add(sphere);
			objects.push(sphere);
			
			nodeIndex.set(String(node.id), { x, y, z, mesh: sphere });
			
			// Create text label using canvas sprite
			this.createTextLabel(node.name || `Node ${node.id}`, x, y, z, scene, objects, THREE);
		});

		console.log('NODES: Created', objects.length / 2, 'spheres with labels'); // Divided by 2 because labels are also in objects

		// Create edges
		const edgePositions = [];
		edges.forEach(edge => {
			const source = nodeIndex.get(String(edge.source));
			const target = nodeIndex.get(String(edge.target));
			if (source && target) {
				edgePositions.push(source.x, source.y, source.z, target.x, target.y, target.z);
			}
		});

		if (edgePositions.length > 0) {
			const lineGeo = new THREE.BufferGeometry();
			lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
			const lineMat = new THREE.LineBasicMaterial({ 
				color: 0xcccccc, 
				opacity: 0.3, 
				transparent: true,
				linewidth: 1
			});
			const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
			
			scene.add(lineSegments);
			objects.push(lineSegments);
		}

		console.log('RENDER COMPLETE: Scene has', sourceNodes.length, 'nodes and', edges.length, 'edges');
		placeholder.innerHTML = `
			<div style="font-size:12px;background:rgba(45,127,249,0.9);color:#fff;padding:8px;border-radius:4px;">
				<strong>3D Graph Rendered</strong><br>
				${sourceNodes.length} nodes | ${edges.length} edges<br>
				Sized by PageRank | Colored by Community
			</div>
		`;
	}

	createTextLabel(text, x, y, z, scene, objects, THREE) {
		// Create canvas for text
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		canvas.width = 256;
		canvas.height = 64;
		
		context.fillStyle = 'rgba(255, 255, 255, 0.9)';
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		context.font = 'Bold 20px Arial';
		context.fillStyle = '#1b264f';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(text.substring(0, 20), canvas.width / 2, canvas.height / 2);
		
		const texture = new THREE.CanvasTexture(canvas);
		const spriteMaterial = new THREE.SpriteMaterial({ 
			map: texture,
			transparent: true,
			opacity: 0.9
		});
		const sprite = new THREE.Sprite(spriteMaterial);
		sprite.position.set(x, y + 15, z); // Position above the node
		sprite.scale.set(30, 7.5, 1);
		
		scene.add(sprite);
		objects.push(sprite);
	}

	filterNodes(searchTerm) {
		if (!this._three || !this._three.nodeData) return;
		
		const term = searchTerm.toLowerCase();
		this._three.objects.forEach(obj => {
			if (obj.userData?.nodeName) {
				const matches = obj.userData.nodeName.toLowerCase().includes(term);
				obj.visible = term === '' || matches;
			}
		});
	}
}

if (!customElements.get('umb-content-cartographer-property-editor')) {
	customElements.define('umb-content-cartographer-property-editor', UmbContentCartographerPropertyEditor);
}

export default [
	{
		type: 'propertyEditorUi',
		alias: 'Umb.PropertyEditorUi.ContentCartographer',
		name: 'Content Cartographer',
		js: () => import('/app_plugins/content-cartographer/extensions.js'),
		elementName: 'umb-content-cartographer-property-editor',
		meta: {
			label: 'Content Cartographer',
			propertyEditorSchemaAlias: 'Umbraco.ContentCartographer',
			icon: 'icon-nodes',
			group: 'common',
		},
	},
];
