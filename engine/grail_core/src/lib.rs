use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json;
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::visit::EdgeRef;
use petgraph::Direction;
use std::collections::HashMap;

// ============================================================================
// Data Structures for Graph Representation
// ============================================================================

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "serde")]
pub struct GraphNode {
    pub id: String,
    pub name: String,
    pub node_type: String, // "content", "media", "tag", etc.
    pub level: i32,        // Document level in hierarchy
    pub is_published: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "serde")]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
    pub relationship_type: String, // "depends_on", "uses_media", "tagged_with", "references"
    pub strength: f32, // Weight of the relationship
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "serde")]
pub struct PhysicsNode {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub vx: f32,
    pub vy: f32,
    pub vz: f32,
    pub fixed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "serde")]
pub struct GraphLayout {
    pub nodes: Vec<PhysicsNode>,
    pub edges: Vec<GraphEdge>,
    pub iterations: i32,
    pub center_node_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "serde")]
pub struct ImpactAnalysis {
    pub node_id: String,
    pub directly_dependent: Vec<String>,
    pub indirectly_dependent: Vec<String>,
    pub media_references: Vec<String>,
    pub tags: Vec<String>,
    pub backlinks: Vec<String>,
    pub impact_score: f32,
}

// ============================================================================
// Force-Directed Graph Layout Engine
// ============================================================================

pub struct CartographyEngine {
    graph: DiGraph<GraphNode, GraphEdge>,
    node_map: HashMap<String, NodeIndex>,
}

impl CartographyEngine {
    pub fn new() -> Self {
        CartographyEngine {
            graph: DiGraph::new(),
            node_map: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, node: GraphNode) {
        let idx = self.graph.add_node(node.clone());
        self.node_map.insert(node.id.clone(), idx);
    }

    pub fn add_edge(&mut self, edge: GraphEdge) {
        if let (Some(&source_idx), Some(&target_idx)) = (
            self.node_map.get(&edge.source),
            self.node_map.get(&edge.target),
        ) {
            self.graph.add_edge(source_idx, target_idx, edge);
        }
    }

    /// Force-directed layout using Fruchterman-Reingold algorithm
    pub fn calculate_layout(&self, center_node_id: Option<&str>, iterations: i32) -> GraphLayout {
        let node_count = self.graph.node_count() as f32;
        let mut positions: HashMap<NodeIndex, PhysicsNode> = HashMap::new();
        let mut physics_nodes: Vec<PhysicsNode> = Vec::new();

        // Initialize positions deterministically
        let mut counter: usize = 0;
        for idx in self.graph.node_indices() {
            if let Some(node) = self.graph.node_weight(idx) {
                let angle = (counter as f32) * std::f32::consts::TAU / node_count.max(1.0);
                let radius = 100.0;
                // deterministic pseudo-random z based on node index
                let z = ((idx.index() as f32 * 37.0).sin() - 0.5) * 50.0;

                positions.insert(
                    idx,
                    PhysicsNode {
                        id: node.id.clone(),
                        x: radius * angle.cos(),
                        y: radius * angle.sin(),
                        z,
                        vx: 0.0,
                        vy: 0.0,
                        vz: 0.0,
                        fixed: false,
                    },
                );
                counter += 1;
            }
        }

        // Fix center node if specified
        if let Some(center_id) = center_node_id {
            if let Some(&idx) = self.node_map.get(center_id) {
                if let Some(pos) = positions.get_mut(&idx) {
                    pos.x = 0.0;
                    pos.y = 0.0;
                    pos.z = 0.0;
                    pos.fixed = true;
                }
            }
        }

        // Simulation iterations
        let k = 100.0 / (node_count.sqrt()); // Optimal distance
        let mut temperature = 100.0;
        let cooling_rate = temperature / (iterations as f32);

        for _iteration in 0..iterations {
            temperature -= cooling_rate;
            let k_squared = k * k;

            // Repulsive forces
            let mut forces: HashMap<NodeIndex, (f32, f32, f32)> = HashMap::new();
            for (idx, _) in self.graph.node_indices().zip(self.graph.node_weights()) {
                forces.insert(idx, (0.0, 0.0, 0.0));
            }

            for idx1 in self.graph.node_indices() {
                for idx2 in self.graph.node_indices() {
                    if idx1 != idx2 {
                        let pos1 = &positions[&idx1];
                        let pos2 = &positions[&idx2];
                        let dx = pos1.x - pos2.x;
                        let dy = pos1.y - pos2.y;
                        let dz = pos1.z - pos2.z;
                        let dist = (dx * dx + dy * dy + dz * dz).sqrt().max(0.01);
                        let force = k_squared / dist;

                        let (fx, fy, fz) = forces[&idx1];
                        forces.insert(idx1, (fx + force * dx / dist, fy + force * dy / dist, fz + force * dz / dist));
                    }
                }
            }

            // Attractive forces along edges (use EdgeRef)
            for edge_ref in self.graph.edge_references() {
                let source = edge_ref.source();
                let target = edge_ref.target();
                let weight = edge_ref.weight().strength;
                let pos1 = &positions[&source];
                let pos2 = &positions[&target];
                let dx = pos2.x - pos1.x;
                let dy = pos2.y - pos1.y;
                let dz = pos2.z - pos1.z;
                let dist = (dx * dx + dy * dy + dz * dz).sqrt().max(0.01);
                let force = (dist - k) / dist * weight * 0.5;

                let (fx, fy, fz) = forces[&source];
                forces.insert(source, (fx + force * dx, fy + force * dy, fz + force * dz));

                let (fx, fy, fz) = forces[&target];
                forces.insert(target, (fx - force * dx, fy - force * dy, fz - force * dz));
            }

            // Update positions
            for idx in self.graph.node_indices() {
                if let Some(pos) = positions.get_mut(&idx) {
                    if !pos.fixed {
                        let (fx, fy, fz) = forces[&idx];
                        let magnitude = (fx * fx + fy * fy + fz * fz).sqrt();
                        if magnitude > 0.0 {
                            let displacement = (temperature / magnitude.max(0.01)).min(temperature);
                            pos.vx = (fx / magnitude * displacement).max(-temperature).min(temperature);
                            pos.vy = (fy / magnitude * displacement).max(-temperature).min(temperature);
                            pos.vz = (fz / magnitude * displacement).max(-temperature).min(temperature);
                            pos.x += pos.vx;
                            pos.y += pos.vy;
                            pos.z += pos.vz;
                        }
                    }
                }
            }
        }

        for (_, node) in positions.iter() {
            physics_nodes.push(node.clone());
        }

        GraphLayout {
            nodes: physics_nodes,
            edges: self
                .graph
                .edge_references()
                .map(|er| er.weight().clone())
                .collect(),
            iterations,
            center_node_id: center_node_id.map(|s| s.to_string()),
        }
    }

    pub fn analyze_impact(&self, node_id: &str) -> Option<ImpactAnalysis> {
        let idx = *self.node_map.get(node_id)?;
        let mut directly_dependent = Vec::new();
        let mut media_references = Vec::new();
        let mut tags = Vec::new();
        let mut backlinks = Vec::new();

        // Find direct dependencies and outgoing relationships
        for edge_ref in self.graph.edges(idx) {
            let edge = edge_ref.weight();
            let target_idx = edge_ref.target();
            if let Some(target_node) = self.graph.node_weight(target_idx) {
                match edge.relationship_type.as_str() {
                    "depends_on" => directly_dependent.push(target_node.id.clone()),
                    "uses_media" => media_references.push(target_node.id.clone()),
                    "tagged_with" => tags.push(target_node.id.clone()),
                    _ => {}
                }
            }
        }

        // Find backlinks (what references this node)
        for edge_ref in self.graph.edges_directed(idx, Direction::Incoming) {
            let edge = edge_ref.weight();
            let source_idx = edge_ref.source();
            if let Some(source_node) = self.graph.node_weight(source_idx) {
                if edge.relationship_type == "depends_on" || edge.relationship_type == "references" {
                    backlinks.push(source_node.id.clone());
                }
            }
        }

        // Calculate indirect dependencies using BFS
        let mut indirectly_dependent = Vec::new();
        let mut visited = std::collections::HashSet::new();
        let mut queue = std::collections::VecDeque::new();

        for dependent_id in &directly_dependent {
            if let Some(&dep_idx) = self.node_map.get(dependent_id) {
                queue.push_back(dep_idx);
            }
        }

        while let Some(current_idx) = queue.pop_front() {
            if visited.insert(current_idx) {
                for edge_idx in self.graph.edges(current_idx) {
                    let target_idx = edge_idx.target();
                    if !visited.contains(&target_idx) {
                        if let Some(target_node) = self.graph.node_weight(target_idx) {
                            indirectly_dependent.push(target_node.id.clone());
                        }
                        queue.push_back(target_idx);
                    }
                }
            }
        }

        let impact_score =
            (directly_dependent.len() as f32 * 1.0 + indirectly_dependent.len() as f32 * 0.5
                + media_references.len() as f32 * 0.3
                + backlinks.len() as f32 * 0.7)
                / (self.graph.node_count() as f32).max(1.0);

        Some(ImpactAnalysis {
            node_id: node_id.to_string(),
            directly_dependent,
            indirectly_dependent,
            media_references,
            tags,
            backlinks,
            impact_score,
        })
    }
}

// ============================================================================
// WASM Bindings
// ============================================================================

#[wasm_bindgen]
pub struct CartographerWasm {
    engine: CartographyEngine,
}

#[wasm_bindgen]
impl CartographerWasm {
    #[wasm_bindgen(constructor)]
    pub fn new() -> CartographerWasm {
        CartographerWasm {
            engine: CartographyEngine::new(),
        }
    }

    #[wasm_bindgen]
    pub fn add_nodes(&mut self, nodes_json: &str) -> Result<(), String> {
        let nodes: Vec<GraphNode> =
            serde_json::from_str(nodes_json).map_err(|e| e.to_string())?;
        for node in nodes {
            self.engine.add_node(node);
        }
        Ok(())
    }

    #[wasm_bindgen]
    pub fn add_edges(&mut self, edges_json: &str) -> Result<(), String> {
        let edges: Vec<GraphEdge> =
            serde_json::from_str(edges_json).map_err(|e| e.to_string())?;
        for edge in edges {
            self.engine.add_edge(edge);
        }
        Ok(())
    }

    #[wasm_bindgen]
    pub fn calculate_layout(
        &self,
        center_node_id: Option<String>,
        iterations: i32,
    ) -> Result<String, String> {
        let layout = self.engine.calculate_layout(center_node_id.as_deref(), iterations);
        serde_json::to_string(&layout).map_err(|e| e.to_string())
    }

    #[wasm_bindgen]
    pub fn analyze_impact(&self, node_id: &str) -> Result<String, String> {
        let analysis = self
            .engine
            .analyze_impact(node_id)
            .ok_or_else(|| "Node not found".to_string())?;
        serde_json::to_string(&analysis).map_err(|e| e.to_string())
    }

    #[wasm_bindgen]
    pub fn get_graph_stats(&self) -> String {
        format!(
            "{{\"nodes\": {}, \"edges\": {}}}",
            self.engine.graph.node_count(),
            self.engine.graph.edge_count()
        )
    }
}

// Test function from original
#[wasm_bindgen]
pub fn check_the_grail(input: &str) -> String {
    format!("Rust says: '{}' is a leap of faith worth taking!", input)
}