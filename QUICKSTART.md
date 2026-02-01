# Content Cartographer - Quick Start 🗺️

Get up and running in **3 minutes**.

## Step 1: Automated Setup

```bash
cd /path/to/Umbraco.Grail.Rust

# macOS/Linux
./setup-demo.sh

# Windows (PowerShell)
.\setup-demo.ps1
```

This creates a fresh Umbraco 17 instance in `demo_instance/` with Content Cartographer pre-installed.

## Step 2: Start Umbraco

```bash
cd demo_instance/UmbracoDemoCartographer
dotnet run
```

Open http://localhost:5000 in your browser.

## Step 3: Complete Setup Wizard

- Select **SQLite** for database
- Create superuser account
- Skip default templates

## Step 4: Create Sample Content

Follow [DEMO.md](./DEMO.md) to create:
- Document type: "Page"
- Content tree: Homepage → About, Services, Blog, etc.
- Media: Upload some images

## Step 5: View the 3D Graph

Open browser dev tools (F12), go to **Console**, then embed:

```html
<content-cartographer nodeId="1" baseUrl="/api/cartographer"></content-cartographer>
```

You'll see:
```
✅ WASM loaded
📡 Fetching graph from /api/cartographer/graph
📊 Graph loaded: { nodes: 12, edges: 15 }
✅ Graph rendered (Rust physics)
```

## What You'll See

- **Blue nodes** = Content pages
- **Green nodes** = Media
- **Red node** = Root
- **Lines** = Relationships
- **Sidebar** = Impact analysis

## API Quick Test

```bash
# Health check
curl http://localhost:5000/api/cartographer/health

# Get graph
curl -X POST http://localhost:5000/api/cartographer/graph \
  -H "Content-Type: application/json" \
  -d '{"node_id":1,"depth":3,"include_media":true}'

# Analyze impact
curl -X POST "http://localhost:5000/api/cartographer/impact?nodeId=1"
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 5000 in use | `dotnet run --urls http://localhost:5001` |
| WASM not loading | Check `/api/cartographer/health` first |
| Empty graph | Create more content pages |
| Build fails | Ensure .NET 10: `dotnet --version` |

## Documentation

- [README.md](./README.md) - Full project overview
- [DEMO.md](./DEMO.md) - Detailed setup guide
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Technical details
- [packages/ContentCartographer.Core/README.md](./packages/ContentCartographer.Core/README.md) - API docs

## Development

### Dev Server (hot reload)
```bash
cd packages/ContentCartographer.Core
npm run dev              # http://localhost:5174/
```

### Full Build
```bash
cd packages/ContentCartographer.Core
./build.sh
```

### Rust Only
```bash
cd engine/grail_core
wasm-pack build --target web --release
```

---

**Ready? Let's go! 🚀**
