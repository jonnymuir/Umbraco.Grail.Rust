# Content Cartographer Demo - Umbraco 17 Test Instance

This guide walks you through creating a fresh Umbraco 17 instance with sample content to test Content Cartographer.

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
- ✅ Deploys all artifacts to the correct locations
- ✅ Starts the Umbraco server on https://localhost:44356

### 2. Create Sample Content

Go to https://localhost:44356/umbraco (backoffice) and:

1. **Create Document Types** (Settings > Document Types):
   - **Home** (alias: `home`, allow as root)
   - **Page** (alias: `page`, allow as root)

2. **Create Content** (Content > Create):
   - Home Page (root)
     - About Us (child)
     - Services (child)
     - Contact (child)
     - Force Graphs (child)
     - Relationships (child)

   **Important:** Publish each page after creating it

### 3. View the Visualization

Visit: **https://localhost:44356/cartographer**

You should see a 3D interactive graph of your content structure!

---

## Manual Setup (If Automated Fails)

### 1. Create a New Umbraco 17 Project

```bash
dotnet new umbraco -n UmbracoDemoCartographer --release Latest

cd UmbracoDemoCartographer

dotnet restore
```

### 2. Build and Deploy Content Cartographer

```bash
# Build the package
cd ../packages/ContentCartographer.Core
./build.sh

# Copy DLL
cp bin/Release/net10.0/Umbraco.Grail.ContentCartographer.dll \
   ../../demo_instance/UmbracoDemoCartographer/bin/

# Copy WASM files
mkdir -p ../../demo_instance/UmbracoDemoCartographer/wwwroot/wasm
cp wwwroot/wasm/* ../../demo_instance/UmbracoDemoCartographer/wwwroot/wasm/
```

### 3. Start Umbraco

```bash
cd ../../demo_instance/UmbracoDemoCartographer
dotnet run
```

Navigate to https://localhost:44356/umbraco

```bash
# Once package is published to NuGet
dotnet add package Umbraco.Grail.ContentCartographer
```

### 4. Restart Umbraco

Stop the running instance (Ctrl+C) and restart:

```bash
dotnet run
```

The Composer will auto-register the package. You'll see in the console:

```
[INFO] Registering CartographerComposer...
```

## Creating Sample Content

Once Umbraco is running at `http://localhost:5000`, log in to the backoffice and create sample content.

### Step 1: Create a Document Type

1. Go to **Content** → **Settings** (left sidebar)
2. Click **Document Types** → **+ Create**
3. Create **"Page"**:
   - Alias: `page`
   - Icon: document
   - Allow as root: **Yes**
   - Add property:
     - Name: **Title**
     - Alias: `title`
     - Editor: **Textstring**
   - Add property:
     - Name: **Body**
     - Alias: `body`
     - Editor: **Rich Text Editor**

4. Click **Save**

### Step 2: Create Content Structure

1. Go to **Content** → **+** (Create root node)
2. Select **"Page"** document type
3. Fill in:
   - **Title**: "Acme Corporation"
   - Click **Save and Publish**

4. Under "Acme Corporation", create child pages (right-click → Create):
   - **About Us**
   - **Services**
   - **Products**
   - **Contact**
   - **Blog**

5. Under **Blog**, create article pages:
   - **Article 1: Getting Started**
   - **Article 2: Advanced Topics**
   - **Article 3: Case Studies**

6. Under **Services**, create:
   - **Consulting**
   - **Development**
   - **Support**

Final structure should look like:
```
Acme Corporation (id: 1)
├── About Us (id: 2)
├── Services (id: 3)
│   ├── Consulting (id: 4)
│   ├── Development (id: 5)
│   └── Support (id: 6)
├── Products (id: 7)
├── Contact (id: 8)
└── Blog (id: 9)
    ├── Article 1 (id: 10)
    ├── Article 2 (id: 11)
    └── Article 3 (id: 12)
```

### Step 3: Create Media

1. Go to **Media** → **+** (Create root)
2. Select **Folder**
3. Name: **Images**
4. Create images in the folder:
   - Upload some sample images (JPG/PNG)

This gives us media relationships to visualize.

### Step 4: Add Media References to Content

Edit the **Page** document type and add a media picker:

1. Settings → **Document Types** → **Page** → Edit
2. Add property:
   - Name: **Featured Image**
   - Alias: `featuredImage`
   - Editor: **Media Picker**
3. Click **Save**

Now edit content pages and add featured images. This creates `uses_media` relationships that the graph will visualize.

## Testing Content Cartographer

### Access the Component Demo

1. Open a new browser tab to `http://localhost:5000/api/cartographer/health`
   - Should return: `{"status":"ok","version":"1.0.0"}`

2. Test graph API:
   ```
   POST http://localhost:5000/api/cartographer/graph
   Content-Type: application/json
   
   {
     "node_id": 1,
     "depth": 3,
     "include_media": true,
     "include_tags": true,
     "include_unpublished": false
   }
   ```

3. Test impact API:
   ```
   POST http://localhost:5000/api/cartographer/impact?nodeId=1
   ```

### View in 3D Visualization

Create a simple test page in the Umbraco backoffice to embed the component:

1. Go to **Settings** → **Document Types** → **Create new**
2. Create **"Test Page"**
3. Add property:
   - Name: **Content Cartographer**
   - Alias: `contentCartographer`
   - Editor: **Rich Text Editor**

4. Create content page using this type
5. In the rich text editor, add:
   ```html
   <content-cartographer nodeId="1" baseUrl="/api/cartographer"></content-cartographer>
   ```

6. Save and view the page in a browser console
7. Open developer tools → **Console**
8. You should see:
   ```
   ✅ WASM loaded
   📡 Fetching graph from /api/cartographer/graph
   📊 Graph loaded: { nodes: 12, edges: 15 }
   ✅ Graph rendered (Rust physics)
   ```

### Expected Behavior

- **Graph renders** with your content as 3D nodes
- **Blue nodes** = Content pages
- **Green nodes** = Media (if featured images added)
- **Red node** = Root (Acme Corporation)
- **Lines** = Parent-child or media relationships
- **Sidebar** shows impact metrics for the root node

## Debugging

### WASM Not Loading?

Check browser console:
1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for errors like:
   ```
   Failed to load /wasm/grail_core_bg.wasm
   ```

**Solution:**
- Ensure `wwwroot/wasm/` folder exists with:
  - `grail_core.js`
  - `grail_core_bg.wasm`
  - `grail_core.d.ts`

### API Returns 404?

```
Failed to fetch /api/cartographer/graph
```

**Solution:**
- Restart Umbraco
- Check that `CartographerApiController` is compiled into the DLL
- Verify the DLL is in `bin/` folder

### Graph Renders But No Nodes?

**Solution:**
- Check that you created content pages
- Verify content is **Published** (not draft)
- Try with `"include_unpublished": true` in API request

## Performance Testing

### Large Graph Test

To test with larger datasets:

1. Create 100+ content pages using a script:

```csharp
// In Umbraco package management console
var root = _contentService.GetById(1);
for (int i = 0; i < 100; i++)
{
    var page = _contentService.Create($"Article {i}", root, "page");
    page.SetValue("title", $"Article {i}");
    _contentService.SaveAndPublish(page);
}
```

2. Test graph API with larger depth:
```json
{
  "node_id": 1,
  "depth": 4,
  "include_media": true,
  "include_tags": true,
  "include_unpublished": false
}
```

Monitor:
- **API response time** (should be < 500ms for 1000 nodes)
- **Rust layout calculation** (should be < 100ms)
- **Browser rendering** (FPS in dev tools)

## Next Steps

### Integrate into Your Own Project

1. Copy the built DLL to your Umbraco project
2. Ensure `wwwroot/wasm/` is deployed
3. Use the API endpoints in your custom dashboard/property editor
4. Embed `<content-cartographer>` web component anywhere

### Customize the Component

Edit [content-cartographer.ts](packages/ContentCartographer.Core/src/components/content-cartographer.ts) to:
- Change colors
- Modify physics parameters
- Add click handlers
- Extend impact analysis display

### Production Deployment

1. **Build release:**
   ```bash
   ./build.sh
   dotnet pack -c Release
   ```

2. **Publish to NuGet** (when ready)

3. **Deploy to Azure/hosting:**
   - Include wwwroot/wasm/ in deployment
   - Ensure WebGL is enabled on hosting
   - Configure CORS if APIs are cross-domain

## Troubleshooting

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
