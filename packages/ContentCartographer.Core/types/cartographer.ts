/**
 * Content Cartographer - TypeScript Type Definitions
 * Interfaces for the Rust WASM engine and property editor
 */

export interface GraphNode {
  id: string;
  name: string;
  node_type: 'content' | 'media' | 'tag' | 'dictionary' | 'form';
  level: number;
  is_published: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship_type: 'depends_on' | 'uses_media' | 'tagged_with' | 'references' | 'child_of';
  strength: number;
}

export interface PhysicsNode {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fixed: boolean;
}

export interface GraphLayout {
  nodes: PhysicsNode[];
  edges: GraphEdge[];
  iterations: number;
  center_node_id?: string;
}

export interface ImpactAnalysis {
  node_id: string;
  directly_dependent: string[];
  indirectly_dependent: string[];
  media_references: string[];
  tags: string[];
  backlinks: string[];
  impact_score: number;
}

export interface CartographyEngineConfig {
  maxNodes?: number;
  iterations?: number;
  centerNode?: string;
  relationshipTypes?: string[];
}

/**
 * Cartographer API Service - Umbraco Backend
 */
export interface CartographerApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ContentGraphRequest {
  nodeId: string;
  depth?: number;
  includeMedia?: boolean;
  includeTags?: boolean;
}

export interface ContentGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNode: GraphNode;
  stats: {
    nodeCount: number;
    edgeCount: number;
    averageConnections: number;
  };
}

export interface ImpactAnalysisRequest {
  nodeId: string;
  includeIndirect?: boolean;
}

export interface ImpactAnalysisResponse {
  analysis: ImpactAnalysis;
  relatedContent: {
    directly_affected: GraphNode[];
    indirectly_affected: GraphNode[];
    media_affected: GraphNode[];
  };
}

/**
 * Property Editor Context
 */
export interface CartographerPropertyEditorConfig {
  showDepth?: number;
  visualizationMode?: 'force-directed' | 'hierarchical' | 'radial';
  highlightRelationships?: string[];
  enableImpactAnalysis?: boolean;
  enableExport?: boolean;
  physics?: {
    temperature?: number;
    cooling?: number;
    iterations?: number;
  };
}
