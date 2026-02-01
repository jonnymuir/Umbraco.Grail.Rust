# Umbraco.Grail.Rust 🗺️

**Content Cartographer** - An interactive 3D force-directed graph visualization of your Umbraco site structure, powered by Rust WASM.

## What is Content Cartographer?

Content Cartographer transforms how you understand your Umbraco site's architecture. See your entire content ecosystem as an interactive 3D force-directed graph where:

- **Nodes** = Content pages, media, tags
- **Edges** = Relationships: parent-child, media usage, tags, references
- **Physics** = Rust-powered calculations instantly layout 50,000+ node graphs
- **Impact Analysis** = "What breaks if I delete this node?"

## Why This?

**Problem:** Traditional content management UI hides the true structure of large sites.

**Solution:** Visualize it. In 3D. Powered by Rust.

JavaScript alone is too slow for force-directed layout on 10k+ nodes. Rust/WASM makes it **instant**, leaving the web component lightweight and responsive.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# macOS/Linux
./setup-demo.sh

# Windows (PowerShell)
.\setup-demo.ps1
```

This creates a fresh demo Umbraco 17 instance with Content Cartographer pre-installed.

**After setup:**
1. Open https://localhost:44356/umbraco (backoffice)
2. Follow the "Setting Up Test Content" section below
3. Visit https://localhost:44356/cartographer to see the 3D visualization

### Option 2: Manual Installation

See [packages/ContentCartographer.Core/README.md](packages/ContentCartographer.Core/README.md) for detailed installation steps.

## Setting Up Test Content

To see Content Cartographer in action, you need to create Document Types and content pages.

### Step 1: Create Document Types

In the Umbraco backoffice (https://localhost:44356/umbraco):

1. **Go to:** Settings > Document Types > Create
2. **Create "Home" document type:**
   - Name: `Home`
   - Alias: `home`
   - ✓ Check "Allow as root"
   - Design tab > Add property:
     - Name: `Title`
     - Alias: `title`
     - Type: `Textstring`
   - **Save**

3. **Create "Page" document type:**
   - Name: `Page`
   - Alias: `page`
   - ✓ Check "Allow as root"
   - Design tab > Add property:
     - Name: `Title`
     - Alias: `title`
     - Type: `Textstring`
   - **Save**

### Step 2: Create Content

In the Umbraco backoffice:

1. **Go to:** Content > Create
2. **Create root "Home Page":**
   - Document Type: `Home`
   - Name: `Home Page`
   - Title: `Welcome to Content Cartographer`
   - **Save & Publish**

3. **Create child pages** (select "Home Page" first, then Create):
   - `About Us` (Page type)
   - `Services` (Page type)
   - `Contact` (Page type)
   - `Force Graphs` (Page type)
   - `Relationships` (Page type)

   For each page:
   - Fill in Name and Title
   - **Save & Publish**

### Step 3: View Visualization

Visit: **https://localhost:44356/cartographer**

You should see:
- **6 green spheres** representing your content nodes
- **Gray lines** showing parent-child relationships
- **Statistics sidebar** showing 6 nodes, 5 edges
- Nodes gently rotating with interactive controls

### Interactive Features

Once the graph loads:
- **Click and drag** - Rotate the view
- **Scroll** - Zoom in/out
- **Hover** - See node names
- **Graph stats** - Node count and connection metrics

## Project Structure

```
.
├── engine/grail_core/              # Rust WASM engine
│   ├── src/lib.rs                  # Graph algorithms, petgraph
│   ├── Cargo.toml                  # Rust dependencies
│   └── pkg/                        # Compiled WASM output
│
├── packages/ContentCartographer.Core/  # .NET 10 package
│   ├── src/
│   │   ├── components/             # Lit web component
│   │   │   └── content-cartographer.ts
│   │   ├── Controllers/            # API endpoints
│   │   ├── Services/               # Umbraco business logic
│   │   └── Models/                 # Data structures
│   ├── wwwroot/wasm/               # WASM artifacts (deployed)
│   ├── package.json                # npm dependencies
│   ├── vite.config.ts              # Frontend bundler
│   ├── Cargo.toml                  # Rust deps (in engine/)
│   ├── build.sh                    # Full build pipeline
│   └── README.md                   # Package documentation
│
├── DEMO.md                         # Demo setup guide
├── setup-demo.sh                   # Automated setup (macOS/Linux)
├── setup-demo.ps1                  # Automated setup (Windows)
└── README.md                       # This file
```

## Architecture

### Backend Stack
- **Umbraco 17** - Headless CMS
- **.NET 10** - Runtime
- **C# Controllers** - REST API endpoints
- **CartographyService** - Business logic (content graph building, impact analysis)

### Frontend Stack
- **Lit 2.7** - Web components framework
- **Three.js r160** - 3D rendering
- **Rust WASM** - Graph physics (petgraph, force-directed layout)

### Build Pipeline
```
Rust source → wasm-pack → grail_core.wasm (~200KB)
TypeScript → Vite → content-cartographer.ts
C# source → dotnet build → Umbraco.Grail.ContentCartographer.dll
```

## Key Features

### 🎨 3D Force-Directed Visualization
- Interactive orbit controls
- Real-time physics (via Rust)
- Color-coded node types
- Smooth WebGL rendering

### 📊 Impact Analysis
Click any node to see:
- **Directly dependent** items (immediate cascade)
- **Indirectly dependent** items (secondary cascade)
- **Media references** (orphaned assets)
- **Backlinks** (what links here)
- **Impact score** (criticality 0-100%)

### ⚡ Performance
- Rust engine handles heavy lifting
- Layout calculation: milliseconds
- Supports 50,000+ node graphs
- Minimal JavaScript overhead

## Development

### Prerequisites
- **.NET 10 SDK**
- **Node.js 18+**
- **Rust & wasm-pack** (for Rust changes)

### Dev Server
```bash
cd packages/ContentCartographer.Core
npm run dev
```

Runs on `http://localhost:5174/` with hot reload.

### Build Release
```bash
cd packages/ContentCartographer.Core
./build.sh                 # Full build
dotnet pack -c Release     # Package as NuGet
```

### Rust Engine Only
```bash
cd engine/grail_core
wasm-pack build --target web --release
```

## API Reference

### Health Check
```
GET /api/cartographer/health
```

### Get Content Graph
```
POST /api/cartographer/graph
Content-Type: application/json

{
  "node_id": 1,
  "depth": 3,
  "include_media": true,
  "include_tags": true,
  "include_unpublished": false
}
```

### Analyze Delete Impact
```
POST /api/cartographer/impact?nodeId=1
```

See [packages/ContentCartographer.Core/README.md](packages/ContentCartographer.Core/README.md) for full API documentation.

## Using the Component

Embed in your Umbraco backoffice page:

```html
<content-cartographer 
  nodeId="1" 
  baseUrl="/api/cartographer"
></content-cartographer>
```

The component will:
1. Load Rust WASM from `/wasm/grail_core.js`
2. Fetch graph via API
3. Calculate physics using Rust engine
4. Render 3D visualization
5. Display impact analysis

## Performance Tips

| Scenario | Recommendation |
|----------|-----------------|
| Large site (10k+ nodes) | Set depth ≤ 2, exclude media/tags |
| Small site (<1k nodes) | depth ≤ 4, include all |
| Real-time interactivity | Cache graphs, invalidate on content change |
| First load speed | Pre-calculate root graphs on startup |

## Troubleshooting

### Demo Setup Issues

**Q: `dotnet new umbraco` command fails**
- Ensure `.NET 10 SDK` is installed: `dotnet --version`
- Use `--release Latest` flag (not `-f net10.0`)

**Q: WASM files not found**
- Check `/demo_instance/UmbracoDemoCartographer/wwwroot/wasm/` exists
- Ensure `grail_core.wasm`, `grail_core.js`, and `.d.ts` files are present
- Run build again: `cd packages/ContentCartographer.Core && npm run build`

**Q: API returns 400 error**
- Verify you created content pages first
- Ensure pages are **Published** (not just saved)
- Check browser console for error details

### Visualization Issues

### WASM not loading?
- Check `wwwroot/wasm/` exists with `.wasm` and `.js` files
- Verify MIME type: `.wasm` should be `application/wasm`
- Check browser console for errors

### Graph not rendering?
- Verify you created content pages
- Ensure content is **published**
- Check Network tab: `/api/cartographer/graph` response

### Slow performance?
- Reduce depth parameter
- Exclude media/tags if not needed
- Check browser hardware acceleration

See [DEMO.md](./DEMO.md) for more troubleshooting.

## What's Inside

### Rust Engine (`engine/grail_core/`)
- **Graph structure**: petgraph directed graph
- **Layout**: Fruchterman-Reingold force-directed algorithm
- **Analysis**: BFS dependency traversal for impact calculation
- **WASM export**: wasm-bindgen for JS interop

### API Controllers (`packages/.../Controllers/`)
- `CartographerApiController` - REST endpoints
- Routes:
  - `POST /api/cartographer/graph` → build content graph
  - `POST /api/cartographer/impact` → analyze impact
  - `GET /api/cartographer/health` → health check

### Business Logic (`packages/.../Services/`)
- `CartographyService` - Umbraco integration
  - Queries IContentService, IMediaService, ITagService
  - Recursively builds graph from a root node
  - Analyzes dependencies and calculates impact scores

### Web Component (`packages/.../components/`)
- `content-cartographer.ts` - Lit web component
  - Loads WASM module
  - Fetches graph data from API
  - Manages Three.js scene
  - Renders impact sidebar

## Deployment

### To Production

1. **Build release package:**
   ```bash
   cd packages/ContentCartographer.Core
   dotnet pack -c Release
   ```

2. **Publish NuGet package** (when ready)

3. **Deploy to hosting:**
   - Include `wwwroot/wasm/` in deployment
   - Ensure WASM MIME type configured
   - Enable WebGL on server if needed

### Umbraco Cloud / Hosting

Simply add the NuGet package:
```bash
dotnet add package Umbraco.Grail.ContentCartographer
```

DI will auto-register via Composer.

## License

MIT © Umbraco Grail

## Credits

**Built with:**
- [petgraph](https://github.com/petgraph/petgraph) - Rust graph library
- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) - Rust↔WASM
- [THREE.js r160](https://threejs.org/) - 3D graphics
- [Lit 2.7](https://lit.dev/) - Web components
- [Umbraco 17](https://umbraco.com/) - CMS

---

**"The Grail is not behind the cross, but beneath the earth."**

The truth about your content architecture lies beneath the surface. Content Cartographer brings it into the light. 🗺️
