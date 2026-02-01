# Using Umbraco MCP to Create Content

This guide explains how to use the Umbraco Developer MCP to create sample content for testing the Content Cartographer package.

## Prerequisites

1. **Node.js 22+** - Check with `node -v`
2. **GitHub Copilot** or Claude Desktop configured
3. **Umbraco instance running** - https://localhost:44356

## Step 1: Create an API User in Umbraco

1. Go to https://localhost:44356/umbraco
2. Navigate to **Settings > Users > API Users** (or **Security > API Users** in newer versions)
3. Click "Create API User"
4. Fill in:
   - **User Name**: `mcp-developer`
   - **Email**: `mcp@localhost`
   - **Password**: Generate a secure password
   - **Set Access Level**: Administrator (needed to create document types)

5. Click "Create"
6. Copy the **Client ID** and **Client Secret** for the next step

## Step 2: Configure MCP in GitHub Copilot / VS Code

You already have GitHub Copilot integration! The Umbraco MCP can be added to VS Code settings:

1. Open VS Code Settings (Cmd+,)
2. Search for "MCP" or look in your user settings JSON
3. Add the Umbraco MCP configuration:

```json
{
  "github.copilot.advanced": {
    "umbraco-mcp": {
      "command": "npx",
      "args": ["@umbraco-cms/mcp-dev@17"],
      "env": {
        "NODE_TLS_REJECT_UNAUTHORIZED": "0",
        "UMBRACO_CLIENT_ID": "mcp-developer",
        "UMBRACO_CLIENT_SECRET": "YOUR_SECRET_HERE",
        "UMBRACO_BASE_URL": "https://localhost:44356",
        "UMBRACO_INCLUDE_TOOL_COLLECTIONS": "document,document-type,media"
      }
    }
  }
}
```

(Replace CLIENT_ID and CLIENT_SECRET with actual values from Step 1)

## Step 3: Use Copilot to Create Content

Once configured, ask Copilot in VS Code:

> "Create sample content for Content Cartographer testing. Create a Home page as root, then add these child pages:
> - About Us
> - Services  
> - Contact
> - Getting Started with Force Graphs
> - Visualizing Content Relationships
> - Impact Analysis with WASM
> All should use the TextPage document type."

Copilot will use the Umbraco MCP tools to:
1. Create the content hierarchy
2. Set property values
3. Publish the content

## Verifying Content Creation

Once created via MCP:
1. Go to https://localhost:44356/umbraco/#/content
2. Verify the content tree shows your new pages
3. Return to the Content Cartographer visualization
4. The 3D graph should now display your content structure

## Alternative: Manual Creation

If you prefer creating content via the UI:
1. Go to https://localhost:44356/umbraco
2. Content > New
3. Create pages manually using "Text Page" document type
4. Publish each page

## Useful MCP Commands

Once set up, you can ask Copilot:

- "Show me all document types in this Umbraco instance"
- "List all content items"
- "Update the About Us page title"
- "Delete a page"
- "Create media files"
- "Batch operations on content"
