# Content Cartographer 🗺️

**The Grail Diary of your Umbraco site** - An interactive 3D force-directed graph visualization of your entire content architecture, powered by Rust WASM.

## Overview

Content Cartographer transforms the way Umbraco editors and developers understand their site's structure. Instead of navigating endless menus, see your entire content universe as an interactive 3D graph where:

- **Nodes** represent content, media, tags, and other entities
- **Edges** visualize relationships: dependencies, media usage, tags, and cross-references
- **Physics** calculations (powered by Rust) instantly compute force-directed layouts for 50,000+ node sites
- **Impact Analysis** reveals what breaks if you delete a node

## Why Rust?

JavaScript force-directed graph layout for 10,000+ nodes is slow. Rust makes it **instantaneous**. Using `petgraph` and compiled WASM, we can:

- Calculate physics for massive graphs in milliseconds
- Render smooth 3D visualizations without lag
- Handle enterprise-scale site structures effortlessly

## Features

### 1. 3D Force-Directed Graph Visualization
- Interactive orbit camera controls
- Real-time node physics simulation
- Color-coded nodes: Content (blue), Media (green), Tags (amber)
- Edge strength visualization (thicker = stronger relationship)
- Auto-rotating background with optional manual control

### 2. Impact Analysis
The Enterprise Feature: "What happens if I delete this?"

Shows:
- Directly dependent items (will break immediately)
- Indirectly dependent items (cascading failures)
- Media references (orphaned assets)
- Backlinks (what references this content)
- **Impact Score** (0-100%): How critical is this node?

### 3. Flexible Graph Building
- Configurable depth (how many levels to traverse)
- Include/exclude media, tags, dictionaries
- Filter by publish state
- Support for custom relationship types

### 4. Export & Analysis
- Export graph data as JSON
- Statistics: node count, edge count, average connections
- Performance metrics built-in

## Architecture

```
Content Cartographer
├── Rust (engine/grail_core/)
│   ├── Force-directed layout engine (Fruchterman-Reingold)
│   ├── Graph analysis (impact, dependencies)
│   └── WASM bindings
├── C# (packages/ContentCartographer.Core/)
│   ├── API Controllers (graph, impact endpoints)
│   ├── Services (CartographyService)
│   ├── Models (nodes, edges, relationships)
│   └── Umbraco integration
├── Vue/TypeScript (components & types)
│   ├── 3D visualization (THREE.js)
│   ├── Property editor component
│   └── Type definitions
└── Build Pipeline
    ├── wasm-pack (Rust → WASM)
    ├── Vite (frontend bundling)
    └── dotnet build (C# packaging)
```

## Installation

### Prerequisites
- **Umbraco 17+**
- **.NET 10+**
- **Node.js 18+** (for building from source)
- **Rust & wasm-pack** (only if building Rust engine from scratch)

### Quick Start

```bash
# 1. Build the package
./packages/ContentCartographer.Core/build.sh

# 2. Add to your Umbraco project
dotnet add package Umbraco.Grail.ContentCartographer

# 3. Register in Program.cs
builder.Services
    .AddUmbraco(...)
    .AddComposers()
    .Build();

# 4. Use as a property editor
# In your Document Type, add a property with editor: "Content Cartographer"
```

## Development

### Development Server
```bash
cd packages/ContentCartographer.Core
./dev.sh
```

### Editing the Rust Engine
```bash
cd engine/grail_core
wasm-pack build --target web --dev
```

### Building a Package Release
```bash
cd packages/ContentCartographer.Core
./build.sh
dotnet pack -c Release
```

## API Endpoints

### GET /api/cartographer/health
Health check endpoint.

### POST /api/cartographer/graph
Build a content graph.

**Request:**
```json
{
  "node_id": 1234,
  "depth": 3,
  "include_media": true,
  "include_tags": true,
  "include_unpublished": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...],
    "root_node": {...},
    "stats": {
      "node_count": 156,
      "edge_count": 342,
      "average_connections": 2.19,
      "depth": 3
    }
  }
}
```

### POST /api/cartographer/impact?nodeId=1234
Analyze the impact of deleting a node.

**Response:**
```json
{
  "success": true,
  "data": {
    "node_id": "1234",
    "directly_dependent": ["2001", "2002"],
    "indirectly_dependent": ["3001", "3002", "3003"],
    "media_references": ["m001", "m002"],
    "tags": ["tag1", "tag2"],
    "backlinks": ["1100", "1101"],
    "impact_score": 0.42
  }
}
```

## Configuration

### Property Editor Config

```csharp
var config = new CartographerPropertyEditorConfig
{
    ShowDepth = 4,
    VisualizationMode = "force-directed",
    HighlightRelationships = new[] { "depends_on", "uses_media" },
    EnableImpactAnalysis = true,
    EnableExport = true,
    Physics = new
    {
        Temperature = 100,
        Cooling = 0.1,
        Iterations = 100
    }
};
```

## Use Cases

### For Developers
- Understand content dependencies before major refactoring
- Identify orphaned content and media
- Visualize site structure during onboarding
- Debug complex multi-level hierarchies

### For Content Editors
- "What will break if I delete this?"
- Discover related content visually
- Understand tag relationships
- Assess media dependencies

### For DevOps/Architects
- Impact analysis for migrations
- Site structure auditing
- Performance optimization (identify bottlenecks)
- Compliance reporting (content lineage)

## Performance Considerations

### Graph Size Limits
- **Recommended**: Up to 10,000 nodes
- **Maximum**: 50,000 nodes (with reduced interactivity)
- **Depth**: Keep depth ≤ 4 for faster calculations

### Caching
```csharp
// Cache computed graphs (5-minute TTL)
services.AddMemoryCache();
```

## Troubleshooting

### Graph Not Rendering
- Check browser console for WASM loading errors
- Verify WASM files are in `/wwwroot/wasm/`
- Ensure WebGL is supported in your browser

### Slow Performance
- Reduce graph depth
- Exclude media/tags if not needed
- Check browser hardware acceleration
- Monitor memory usage

### Missing Relationships
- Verify Umbraco relation types are configured
- Check content property aliases for media references
- Ensure tag property types are correctly identified

## Contributing

We welcome contributions! Areas of interest:

- [ ] Additional visualization modes (hierarchical, radial tree)
- [ ] Custom relationship type detection
- [ ] Graph filtering UI
- [ ] Performance optimizations
- [ ] Additional Umbraco integrations (forms, dictionary, blocks)

## License

MIT © Umbraco Grail

## Credits

Built with:
- [petgraph](https://github.com/petgraph/petgraph) - Graph data structure library
- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) - Rust-WASM bindings
- [THREE.js](https://threejs.org/) - 3D visualization
- [Vue 3](https://vuejs.org/) - UI framework

---

*"The Grail is not behind the cross, but beneath the earth." - Indiana Jones*

The truth about your content architecture lies beneath the surface. Content Cartographer brings it into the light.
