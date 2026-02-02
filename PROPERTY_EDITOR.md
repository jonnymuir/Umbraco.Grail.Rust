# Content Cartographer - Property Editor Guide

> Use Content Cartographer as an interactive 3D visualization property on any Document Type

## Overview

Content Cartographer is an Umbraco 17 **Property Editor** that shows you the content relationships of the page you're editing in real-time as an interactive 3D force-directed graph.

**Key benefit:** Understand your content structure without leaving the backoffice.

## Installation

### Automated (Recommended)

Run the setup script:

```bash
# macOS/Linux
./setup-demo.sh

# Windows PowerShell
.\setup-demo.ps1
```

The property editor is automatically installed and ready to use.

### Manual Installation

1. Clone this repository
2. Build the package:
   ```bash
   cd packages/ContentCartographer.Core
   npm install
   ./build.sh  # or build.ps1 on Windows
   ```
3. Copy the compiled DLL to your Umbraco instance
4. Restart Umbraco

## Adding to Your Document Type

### Step 1: Create Document Type

In the Umbraco backoffice:

1. Go to **Settings → Document Types**
2. Click **Create** to add a new Document Type
3. Give it a name and alias (e.g., `Page`, alias: `page`)
4. Go to the **Design** tab

### Step 2: Add Property

1. Click **Add property**
2. Fill in:
   - **Name:** `Content Relationships` (or any label you like)
   - **Alias:** `contentRelationships`
   - **Type:** Search for and select **Content Cartographer**
3. Click **Add**
4. Click **Save**

### Step 3: Configure Property (Optional)

When adding the property, you can configure:

| Setting | Description |
|---------|-------------|
| **Show Statistics** | Display node count and relationship metrics in sidebar |
| **Auto-Focus Mode** | When true, visualizes selected node as central focus; when false, shows full tree |
| **Node Size** | Scale factor for sphere size (0.5 - 2.0) |

## Using the Property Editor

### Viewing the Graph

1. Go to **Content** in the backoffice
2. Select any published content page
3. Scroll down to find the **Content Relationships** property
4. The 3D graph loads automatically, showing:
   - **Green sphere in center** = The content page you're editing
   - **Surrounding spheres** = Related content (parents, siblings, children)
   - **Gray lines** = Relationship connections
   - **Sidebar stats** = Node count, relationships, metadata

### Interacting with the Graph

| Action | Result |
|--------|--------|
| **Left Click + Drag** | Rotate the 3D view |
| **Right Click + Drag** | Pan the camera |
| **Scroll** | Zoom in/out |
| **Hover over node** | See content name tooltip |
| **Click on node** | (Future) Show impact analysis |

### Understanding the Visualization

```
       Parent Page
            ↑
            │ (child of)
Sibling ←---● Central Node---→ Related
            │ (parent of)
            ↓
       Child Page
```

- **Center node** = The page you're editing (white highlight)
- **Connected nodes** = Direct relationships
- **Distant nodes** = Indirect relationships (shown to full tree depth)
- **Line thickness** = Relationship strength
- **Node color gradient** = Content type or depth level

## Common Use Cases

### 1. Verify Content Structure

Before publishing a new page, check:
- Is it in the right location in the hierarchy?
- Are all expected relationships shown?
- Are there any orphaned connections?

### 2. Understand Impact

When editing critical content:
- How many pages depend on this one?
- What would break if I delete it?
- Are there unexpected references?

### 3. Plan Reorganization

When restructuring content:
- Visualize current state
- Drag to see relationships
- Plan how to move/rename

### 4. Onboard New Editors

New content editors can:
- See site structure without documentation
- Understand content hierarchy visually
- Learn relationships by exploring

## Customization

### Display as Read-Only on a Tab

You can add it as a non-editable visualization on a tab:

```csharp
// In your Document Type configuration
var contentRelationshipsProperty = new PropertyType(dataTypeService.GetDataTypeByAlias("Umbraco.ContentCartographer"))
{
    Name = "Content Structure",
    Alias = "contentStructure",
    // This will display but not allow editing - purely informational
};
```

### Add to Multiple Document Types

Repeat the "Adding to Your Document Type" steps for each document type where you want the visualization:

- `Home` - See all child pages at once
- `Page` - Understand your page's relationships
- `News` - Visualize article connections
- `Product` - See related products and categories

### Controlling What's Shown

In the property editor configuration, you can:

- **Toggle statistics panel** on/off
- **Change focus mode** (central node vs full tree)
- **Adjust node sizes** for readability

## Performance Considerations

### For Large Sites (10,000+ Content Nodes)

The graph algorithm is optimized via Rust WASM:

- Layout calculation: **milliseconds** (not seconds)
- Rendering: **smooth 60fps**
- Memory: **efficient** (WASM + WebGL)

However, for the best UX:
1. Configure the API to limit **depth** parameter
2. Exclude **media** and **tags** if not needed
3. The component will cache calculations

### For Small Sites (< 1,000 Nodes)

Everything is instant. Show all relationships without worry.

## Troubleshooting

### Property Editor Not Appearing?

**Check:** Is the property type "Content Cartographer" available?

```bash
# Make sure the package is installed
cd packages/ContentCartographer.Core
npm run build
dotnet build -c Release
# Copy DLL to your Umbraco bin/
```

### Graph Not Loading?

1. **Check the content is published:**
   - Unpublished pages won't appear in the graph
   - Go to **Content → Your Page → Actions → Publish**

2. **Check the browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed API calls

3. **Verify API is working:**
   ```bash
   curl -X POST http://localhost:44356/api/cartographer/health
   ```

### Visualization Doesn't Update When I Publish?

The graph loads once when the page loads. If you:
- Add new child pages
- Change relationships
- Publish new content

**Refresh the page** to see updates (or we can add auto-refresh in future).

## Advanced Usage

### Via Code

If you need to generate graphs programmatically:

```csharp
// Use CartographyService directly
var service = new CartographyService(
    contentService, 
    mediaService, 
    tagService, 
    relationService);

var graph = await service.BuildContentGraphAsync(
    new ContentGraphRequest { 
        NodeId = 1, 
        Depth = 3 
    });
```

### Extending the Component

The property editor is a standard **Lit web component**. You can:

1. Fork and customize the visualization
2. Add custom controls or overlays
3. Integrate with external analytics
4. Create derived property editors

See [packages/ContentCartographer.Core/src/components/](../packages/ContentCartographer.Core/src/components/) for source code.

## API Reference

The property editor uses these endpoints internally:

### Get Graph Data
```
POST /api/cartographer/graph
Content-Type: application/json

{
  "node_id": 1234,
  "depth": 3,
  "include_media": true,
  "include_tags": false,
  "include_unpublished": false
}

Response:
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...],
    "statistics": { ... }
  }
}
```

### Analyze Impact
```
POST /api/cartographer/impact?nodeId=1234

Response:
{
  "success": true,
  "data": {
    "directDependents": [...],
    "indirectDependents": [...],
    "impactScore": 0.75
  }
}
```

For full API documentation, see [packages/ContentCartographer.Core/README.md](../packages/ContentCartographer.Core/README.md).

## Next Steps

- ✅ Add Content Cartographer property to your Document Type
- ✅ Create test content with parent/child relationships
- ✅ View the visualization in the backoffice
- 🔄 (Future) Click nodes for impact analysis
- 🔄 (Future) Drag nodes to reorder in tree
- 🔄 (Future) Export graph as visual diagram

## Contributing

Found a bug or have a feature idea?

- Report issues in the GitHub repo
- Rust engine optimizations welcome!
- Three.js visualization enhancements appreciated

## License

See [LICENSE](../LICENSE) file.
