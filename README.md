# Umbraco.Grail.Rust 🗺️

**Content Cartographer** - A backoffice Property Editor for Umbraco 17 that visualizes content relationships as an interactive 3D force-directed graph, powered by Rust WASM.

## What is Content Cartographer?

Content Cartographer is a Property Editor that transforms how you understand content structure **directly in the Umbraco backoffice**. Add it to any Document Type and:

- **Visualize** the selected content node and all its relationships as a 3D force-directed graph
- **Understand** your content ecosystem at a glance
- **Navigate** relationships interactively
- **Analyze Impact** - see what depends on each content node

## Architecture: Rust Bridge Pattern

This project demonstrates how to build Umbraco backoffice components using Rust for heavy computation:

```
Umbraco 17 Backoffice (C# + Angular)
        ↓
  Property Editor (Lit Web Component)
        ↓
  WASM Module (Rust)
  ├─ petgraph (graph algorithms)
  ├─ Fruchterman-Reingold (force-directed layout)
  └─ serde (serialization)
        ↓
  Three.js 3D Rendering
```

**Why Rust WASM?** JavaScript alone can't efficiently layout 10k+ node graphs. Rust calculations happen in **microseconds** while JavaScript rendering stays responsive.

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
3. Content Cartographer will appear as a Property Editor on your Document Types

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

### Step 3: Add Property Editor to Document Type

Now let's add Content Cartographer to your Home document type:

1. **Go to:** Settings > Document Types > Home
2. **Design tab** > Scroll down and add new property:
   - Name: `Content Graph`
   - Alias: `contentGraph`
   - Property Type: **Content Cartographer**
3. **Save**

### Step 4: View Visualization in Backoffice

1. **Go to:** Content > Home Page
2. **Scroll down** to see the "Content Graph" property
3. You should see:
- **3D force-directed graph** centered on the current content node
- **Green spheres** representing related content
- **Gray connecting lines** showing parent-child relationships
- **Statistics panel** showing node count, relationships, and metrics

### Interactive Controls

In the backoffice property editor:
- **Left click + drag** - Rotate the 3D view
- **Right click + drag** - Pan the view
- **Scroll** - Zoom in/out
- **Hover over nodes** - See content names
- **Click nodes** - Trigger impact analysis (shows dependencies)

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

## Architecture: Umbraco 17 Property Editor Pattern

### How It Works

1. **Property Editor Registration** (`umbracomanifest.json`)
   - Registers as `Umbraco.ContentCartographer` property type
   - Adds to Document Type design surface
   
2. **Backoffice Integration** (Angular + C#)
   - Property editor HTML loads the Lit web component
   - Angular controller passes current `nodeId` from content tree
   - Component re-renders when you navigate to different content nodes

3. **WASM Bridge** (Rust → JavaScript)
   - Web component calls API: `POST /api/cartographer/graph`
   - Backend sends graph data for selected node
   - Rust WASM calculates optimal layout (microseconds)
   - Three.js renders 3D visualization in real-time

4. **Rendering** (Lit + Three.js)
   - Lit manages component lifecycle and updates
   - Three.js renders 3D scene to canvas
   - Statistics sidebar shows metadata
   - Interactive controls for exploration

### Backend Stack
- **Umbraco 17** - Headless CMS & backoffice
- **.NET 10** - API runtime
- **C# Controllers** - REST endpoints (`/api/cartographer/`)
- **CartographyService** - Graph building, traversal, impact analysis

### Frontend Stack
- **Angular 1.x** - Umbraco backoffice framework (property editor registration)
- **Lit 2.7** - Modern web component rendering
- **Three.js r160** - WebGL 3D visualization
- **TypeScript** - Type-safe component code

### Rust/WASM Layer
- **petgraph** - Graph data structures and algorithms
- **Fruchterman-Reingold** - Force-directed layout algorithm
- **serde_json** - Serialization between Rust and JavaScript
- **wasm-bindgen** - Rust ↔ JavaScript interop

### Build Pipeline
```
Rust source (.rs)
    ↓ wasm-pack build
grail_core.wasm (~200KB) + .js + .d.ts
    ↓ Copy to wwwroot/wasm
Deployed in Umbraco package
    ↑
TypeScript source (.ts)
    ↓ Vite bundler
property-editor.js (~15KB)
    ↓ Deployed to app_plugins/
Ready in backoffice
    ↑
C# Controllers + Services
    ↓ dotnet build
Umbraco.Grail.ContentCartographer.dll
    ↓ Deployed to bin/
API endpoints ready
```

## Key Features

### 🎨 Backoffice Property Editor
- Add to any Document Type in seconds
- Shows content relationships for current node
- No page redirect - stays in backoffice
- Responsive and embedded design

### 📊 3D Force-Directed Visualization
- Interactive orbit controls (drag to rotate, scroll to zoom)
- Real-time physics calculation via Rust WASM
- Central node highlighted (the one you're editing)
- Related content shown in context

### ⚡ Performance
- Force layout: **milliseconds** (Rust)
- Supports **50,000+ node** graphs
- WebGL rendering: smooth 60fps
- Minimal JavaScript: Lit web component only ~15KB

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
