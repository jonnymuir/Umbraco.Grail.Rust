# Content Cartographer Demo - Umbraco 17 Backoffice Property Editor

This guide walks you through creating a fresh Umbraco 17 instance and using Content Cartographer as a backoffice property editor.

## Quick Start (Automated - 2 minutes)

### 1. Run the Setup Script

**macOS/Linux:**
```bash
./setup-demo.sh
```

**Windows (PowerShell):**
```bash
.\setup-demo.ps1
```

This automatically:
- ✅ Creates a fresh Umbraco 17 project
- ✅ Builds the Rust WASM engine
- ✅ Builds the TypeScript component
- ✅ Compiles the C# package
- ✅ Deploys Content Cartographer as a property editor
- ✅ Starts the Umbraco server on https://localhost:44356

### 2. Add Content Cartographer to a Document Type

Go to https://localhost:44356/umbraco (backoffice):

1. **Create Document Types** (Settings > Document Types):
   - **Home** (alias: `home`, allow as root)
     - Add property: `Content Graph` (alias: `contentGraph`, type: **Content Cartographer**)
   - **Page** (alias: `page`, allow as root)
     - Add property: `Content Graph` (same as above)

   **Save each type after adding the property**

2. **Create Sample Content** (Content > Create):
   - **Home Page** (doc type: Home)
     - About Us (doc type: Page)
     - Services (doc type: Page)
     - Contact (doc type: Page)
     - Force Graphs (doc type: Page)
     - Relationships (doc type: Page)

   **Important:** Publish each page after creating it (Actions > Publish)

### 3. View the Visualization in the Backoffice

1. Go to **Content > Home Page**
2. **Scroll down** to find the **"Content Graph"** property
3. You should see:
   - A 3D visualization with green spheres
   - The central node (bright green) = Home Page
   - Connected nodes (blue) = related content
   - Gray lines = parent-child relationships
   - Statistics sidebar showing node count, relationship count

4. **Try interactive controls:**
   - Click and drag to rotate
   - Scroll to zoom
   - Hover over nodes to see names

### 4. View Other Content

Navigate to different content pages:
- Go to **Content > Home Page > About Us**
- Scroll to **"Content Graph"** property
- The graph now shows **About Us** as the central node (bright green)
- All its relationships displayed relative to this page

---

## Manual Setup (If Automated Fails)

### 1. Create a New Umbraco 17 Project

```bash
dotnet new umbraco -n UmbracoDemoCartographer --release Latest

cd UmbracoDemoCartographer
dotnet restore
```

### 2. Build and Deploy Content Cartographer

From the root of the repository:

```bash
# Build the property editor package
cd packages/ContentCartographer.Core
./build.sh  # or build.ps1 on Windows

# Copy DLL to the Umbraco bin directory
cp bin/Release/net10.0/Umbraco.Grail.ContentCartographer.dll \
   ../../UmbracoDemoCartographer/bin/

# Copy WASM files to wwwroot
mkdir -p ../../UmbracoDemoCartographer/wwwroot/app_plugins/content-cartographer/wasm
cp wwwroot/app_plugins/content-cartographer/wasm/* \
   ../../UmbracoDemoCartographer/wwwroot/app_plugins/content-cartographer/wasm/
```

### 3. Start Umbraco

```bash
cd ../../UmbracoDemoCartographer
dotnet run
```

Wait for startup message, then navigate to: **https://localhost:44356/umbraco**

### 4. Create Document Types with Content Cartographer

In the backoffice:

1. Go to **Settings > Document Types > Create**
2. Create **Home**:
   - Name: `Home`
   - Alias: `home`
   - Check: **Allow as root**
   - Go to **Design** tab
   - Add property:
     - Name: `Title`
     - Alias: `title`
     - Type: `Textstring`
   - Add property:
     - Name: `Content Graph`
     - Alias: `contentGraph`
     - Type: **Content Cartographer** (property editor)
   - Click **Save**

3. Create **Page** (same as above, but alias: `page`)

### 5. Create Sample Content

1. Go to **Content > Create**
2. Create root **"Home Page"** (type: Home)
   - Title: "Welcome"
   - Scroll down to **Content Graph** property
   - You should see the 3D visualization!
3. Create child pages under Home Page:
   - About Us (Page)
   - Services (Page)
   - Contact (Page)
   - Blog (Page)
   - Gallery (Page)

   For each page:
   - Fill in Title
   - **Publish** (must publish for it to appear in graph)
   - Scroll down to see **Content Graph** update

4. Add more child pages under these, creating a deeper hierarchy

### 6. Explore the Visualization

Navigate to different pages and watch the graph update:

1. Click **Home Page** → See all children in 3D graph (Home is central green node)
2. Click **About Us** → Graph recenters to About Us
3. Click **Services** → Shows Services and its children
4. Try the interactive controls:
   - Drag to rotate
   - Scroll to zoom
   - Observe statistics update for each page

## Testing the APIs Directly

To verify the backend is working:

### Health Check
```bash
curl https://localhost:44356/api/cartographer/health
```

Response:
```json
{"status":"ok","version":"1.0.0"}
```

### Get Graph Data
```bash
curl -X POST https://localhost:44356/api/cartographer/graph \
  -H "Content-Type: application/json" \
  -d '{"node_id":1,"depth":3,"include_media":true}'
```

Response:
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...],
    "statistics": {
      "nodeCount": 6,
      "edgeCount": 5,
      "averageConnections": 0.833
    }
  }
}
```

### Analyze Impact
```bash
curl -X POST https://localhost:44356/api/cartographer/impact?nodeId=1
```

Response shows what depends on node 1.

## Troubleshooting

### Property Editor Not Showing?

**Problem:** "Content Cartographer" doesn't appear in the property type list

**Solution:**
- Restart Umbraco
- Check that build completed successfully
- Verify DLL is in `bin/` directory
- Check browser console for JavaScript errors

### Graph Not Loading in Property?

**Problem:** See loading spinner but graph never appears

**Solution:**
- Open DevTools (F12) → Network tab
- Look for failed requests to `/api/cartographer/graph`
- Check if content is **published** (not draft)
- Try creating simple child pages first
- Restart the browser

### WASM Files Not Found?

**Problem:** Error about missing `.wasm` file

**Solution:**
- Check `wwwroot/app_plugins/content-cartographer/wasm/` exists
- Verify files are deployed:
  - `grail_core.js`
  - `grail_core_bg.wasm`
  - `grail_core.d.ts`
- Rebuild: `cd packages/ContentCartographer.Core && ./build.sh`

### Content Cartographer Already in Use?

**Problem:** Error about property editor being used on other document types

**Solution:**
- This is normal, just a warning
- Multiple document types can use the same property editor
- It's designed for this use case

## Next Steps

- ✅ View Content Cartographer on your backoffice property editors
- ✅ Add it to more document types
- ✅ Create larger content hierarchies to see how it scales
- 📖 Read [PROPERTY_EDITOR.md](PROPERTY_EDITOR.md) for advanced usage
- 🔧 See [packages/ContentCartographer.Core/README.md](packages/ContentCartographer.Core/README.md) for API details

| Problem | Solution |
|---------|----------|
| "Package not found" error | Rebuild and ensure DLL is in bin/ |
| WASM not loading | Check wwwroot/wasm/ folder exists |
| Graph shows only 1-2 nodes | Create more content pages |
| API returns 500 error | Check Umbraco logs, restart service |
| "cartographer" element not recognized | Ensure JavaScript bundle loaded |
| Slow rendering | Reduce depth to 2, exclude media/tags |

## Support

For issues:
1. Check [README.md](README.md) troubleshooting section
2. Review browser console errors (F12 → Console)
3. Check Umbraco logs: `umbraco/Logs/`
4. Test API directly with Postman/curl

---

Happy exploring! 🗺️
