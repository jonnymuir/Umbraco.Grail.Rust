# Umbraco MCP (Model Context Protocol) - Complete Guide

## Overview

**Note:** There is currently no official "Umbraco MCP" server published in the Umbraco community or official repositories. However, this guide explains what an Umbraco MCP server would be, how MCP works, and how one could be built for Umbraco.

---

## 1. What is MCP (Model Context Protocol)?

### What is it?

**Model Context Protocol (MCP)** is an open-source standard that allows AI applications (like Claude, ChatGPT, or custom agents) to connect to external systems and data sources. Think of MCP like a **USB-C port for AI applications** – it provides a standardized way to connect AI apps to external systems.

**Official source:** https://modelcontextprotocol.io

### Key Characteristics

- **Open standard** developed by the Linux Foundation
- **Client-server architecture** where AI apps act as MCP hosts
- **JSON-RPC 2.0** based protocol for communication
- **Multiple transport options**: STDIO (local) or HTTP (remote)
- **Enables AI applications to access data and perform actions** without built-in integrations

---

## 2. What Could an Umbraco MCP Provide?

An Umbraco MCP server would expose three types of capabilities to AI applications:

### **Tools** (Functions that AI can execute)
- **Create content nodes** with properties and values
- **Create document types** with properties and configurations
- **Publish/unpublish content** at specific cultures/segments
- **Delete content nodes** and analyze cascading impacts
- **Manage media files** and relationships
- **Query content structure** and hierarchy
- **Create variants** for multilingual sites
- **Manage properties and data types**
- **Create template/layout compositions**

### **Resources** (Data sources for context)
- **Content tree structure** - hierarchical view of all content
- **Content type schemas** - available properties and structures
- **Media library metadata** - assets and relationships
- **Site analytics** - content usage, traffic data
- **Content relationships** - links between nodes
- **Workflow states** - publication status, versions
- **User permissions** - what AI can and cannot do

### **Prompts** (Reusable interaction templates)
- "Create a landing page with specific sections"
- "Generate multilingual content variants"
- "Analyze content structure for improvements"
- "Migrate content from old structure"

---

## 3. How MCP Works - Architecture

### Communication Flow

```
┌─────────────────────────────────────────────────────┐
│             AI Application (MCP Host)                │
│         (Claude, ChatGPT, or custom client)         │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    (STDIO)              (HTTP with Auth)
         │                       │
┌────────▼──────────────┐   ┌───▼──────────────────┐
│   Local MCP Server    │   │ Remote MCP Server    │
│  (same machine)       │   │ (different machine)  │
└───────────────────────┘   └──────────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
            Provides to MCP Host:
            • Tools (functions)
            • Resources (data)
            • Prompts (templates)
```

### Key Architecture Concepts

#### **1. Participants**
- **MCP Host**: The AI application (Claude, ChatGPT, VS Code with Copilot)
- **MCP Client**: Maintains connection to the MCP server (managed by host)
- **MCP Server**: Your Umbraco MCP server exposing capabilities

#### **2. Protocol Layers**
- **Data Layer**: JSON-RPC 2.0 messages defining tools, resources, prompts
- **Transport Layer**: How messages move (STDIO for local, HTTP for remote)

#### **3. Lifecycle Management**
1. **Initialize**: Client sends capabilities, server responds with capabilities
2. **Discover**: Client lists available tools/resources
3. **Execute**: Client calls tools with arguments
4. **Notify**: Server sends real-time updates about changes

---

## 4. How MCP Communication Works

### Step 1: Initialization (Handshake)

```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "elicitation": {},
      "sampling": {}
    },
    "clientInfo": {
      "name": "claude-desktop",
      "version": "1.0.0"
    }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": {"listChanged": true},
      "resources": {}
    },
    "serverInfo": {
      "name": "umbraco-mcp",
      "version": "1.0.0"
    }
  }
}
```

### Step 2: Tool Discovery

```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}

// Server → Client (Example Umbraco MCP)
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "create_content_node",
        "description": "Create a new content node under a parent",
        "inputSchema": {
          "type": "object",
          "properties": {
            "parentId": {"type": "string", "description": "Parent node ID"},
            "contentTypeName": {"type": "string", "description": "Document type name"},
            "properties": {"type": "object", "description": "Content properties"}
          },
          "required": ["parentId", "contentTypeName"]
        }
      },
      {
        "name": "publish_content",
        "description": "Publish content to specified cultures",
        "inputSchema": {
          "type": "object",
          "properties": {
            "nodeId": {"type": "string"},
            "cultures": {"type": "array", "items": {"type": "string"}}
          },
          "required": ["nodeId"]
        }
      }
    ]
  }
}
```

### Step 3: Tool Execution

```json
// Client → Server (Execute a tool)
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "create_content_node",
    "arguments": {
      "parentId": "1050",
      "contentTypeName": "Article",
      "properties": {
        "title": "My New Article",
        "body": "Content here..."
      }
    }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Successfully created content node with ID: 1234"
      }
    ]
  }
}
```

### Step 4: Real-time Notifications

```json
// Server → Client (No ID field - notification)
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}

// Client then requests updated tool list
```

---

## 5. How to Install/Configure an Umbraco MCP

> **Note**: This is for when an official or community Umbraco MCP server becomes available.

### For Claude Desktop Users

1. **Locate config file**:
   ```bash
   # macOS/Linux
   ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Add Umbraco MCP configuration**:
   ```json
   {
     "mcpServers": {
       "umbraco": {
         "command": "node",
         "args": ["/path/to/umbraco-mcp/server.js"],
         "env": {
           "UMBRACO_URL": "https://your-umbraco-instance.com",
           "UMBRACO_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

3. **Restart Claude for Desktop**

4. **Verify connection**: Look for Umbraco in the "Connectors" menu

### For Custom MCP Client

```python
import asyncio
from mcp.client.stdio import stdio_client

async def connect_umbraco():
    async with stdio_client(
        command="node",
        args=["/path/to/umbraco-mcp/server.js"]
    ) as streams:
        # Connect and use Umbraco tools
        pass
```

---

## 6. What Operations Can Umbraco MCP Perform?

### Content Management
✅ **Create content nodes** with properties
✅ **Update existing content** (title, properties, variants)
✅ **Delete content** (with impact analysis)
✅ **Publish/unpublish** at specific cultures
✅ **Create content variants** for multilingual sites
✅ **Copy/move** content within tree

### Document Type Management
✅ **Create document types** with properties
✅ **Define property structure** (groups, tabs)
✅ **Set validation rules** and constraints
✅ **Configure templates and compositions**
✅ **Manage allowed child types**

### Media Management
✅ **Upload media files**
✅ **Organize media folders**
✅ **Link media to content**
✅ **Query media relationships**

### Analysis & Inspection
✅ **Analyze content relationships** (what links to this?)
✅ **Impact analysis** (what breaks if deleted?)
✅ **Content tree traversal** (hierarchical queries)
✅ **Query content by type/properties**
✅ **Generate content reports**

### Publishing & Workflows
✅ **Publish content** to live
✅ **Schedule publishing** (if supported)
✅ **Manage content versions**
✅ **Handle workflows** (if configured)

### Multilingual & Segments
✅ **Create language variants**
✅ **Publish to specific cultures**
✅ **Manage segment variants** (A/B testing)

### User & Permissions
⚠️ **Query user permissions** (read-only)
⚠️ **Audit trail** (read-only)
🔒 **Cannot create/delete users** (security)

---

## 7. How to Connect to an Umbraco Instance

### Authentication Methods

#### **API Key Authentication**
```json
{
  "mcpServers": {
    "umbraco": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "UMBRACO_URL": "https://mysite.com",
        "UMBRACO_API_KEY": "sk_live_...",
        "UMBRACO_API_SECRET": "..." // optional
      }
    }
  }
}
```

#### **Bearer Token**
```json
{
  "UMBRACO_URL": "https://mysite.com",
  "UMBRACO_BEARER_TOKEN": "eyJhbGc..."
}
```

#### **OAuth 2.0** (for remote servers)
```json
{
  "UMBRACO_URL": "https://mysite.com",
  "OAUTH_CLIENT_ID": "...",
  "OAUTH_CLIENT_SECRET": "...",
  "OAUTH_REDIRECT_URI": "http://localhost:3000/callback"
}
```

### Connection Requirements

1. **Umbraco Version**: 13+ or Umbraco 17+
2. **API Access**: Must have Management API enabled
3. **Permissions**: User/token must have appropriate permissions
4. **Network Access**: Server must be reachable from MCP client
5. **HTTPS**: Recommended for production connections
6. **CORS** (if remote): Might need configuration

### Example Connection Flow

```python
# Pseudocode for Umbraco MCP connection
async def connect_to_umbraco(url, api_key):
    # 1. Initialize MCP connection
    async with stdio_client(server_command) as streams:
        session = StdioClientSession(streams)
        
        # 2. Send initialize request
        init = await session.initialize()
        
        # 3. Authenticate with Umbraco
        auth_response = await session.call_tool(
            "authenticate",
            arguments={
                "url": url,
                "api_key": api_key
            }
        )
        
        # 4. Now ready to use tools
        content = await session.call_tool("get_content_tree")
        return content
```

---

## 8. Building Your Own Umbraco MCP Server

### Technology Stack Options

#### **Python (Recommended)**
```bash
# Install MCP SDK
pip install mcp

# Create server
python umbraco_mcp.py
```

```python
from mcp.server.fastmcp import FastMCP
import httpx

mcp = FastMCP("umbraco")

@mcp.tool()
async def create_content_node(
    parent_id: str,
    content_type: str,
    properties: dict
) -> str:
    """Create a new content node in Umbraco."""
    # Call Umbraco Management API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{UMBRACO_URL}/api/v1/content",
            json={
                "parentId": parent_id,
                "contentType": content_type,
                "values": properties
            },
            headers={"Authorization": f"Bearer {token}"}
        )
    return f"Created node: {response.json()['id']}"

mcp.run(transport="stdio")
```

#### **TypeScript/Node.js**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "umbraco-mcp",
  version: "1.0.0"
});

server.setRequestHandler(ToolCallRequestSchema, async (request) => {
  if (request.params.name === "create_content") {
    const result = await createContentInUmbraco(request.params.arguments);
    return { content: [{ type: "text", text: result }] };
  }
});

server.run(new StdioServerTransport());
```

#### **C# (.NET)**
```csharp
// Umbraco native implementation
public class UmbracoMcpServer
{
    private readonly IContentService _contentService;
    
    [MpcTool("create_content")]
    public async Task<string> CreateContent(
        string parentId,
        string contentTypeName,
        Dictionary<string, object> properties)
    {
        var content = _contentService.Create(
            properties["title"].ToString(),
            int.Parse(parentId),
            contentTypeName
        );
        
        foreach (var prop in properties)
        {
            content.SetValue(prop.Key, prop.Value);
        }
        
        _contentService.Save(content);
        return $"Created: {content.Id}";
    }
}
```

### Key Implementation Considerations

1. **Error Handling**: Wrap Umbraco API calls in try-catch
2. **Logging**: Write to stderr (not stdout, which corrupts JSON-RPC)
3. **Timeouts**: Set appropriate timeouts for API calls
4. **Caching**: Cache tool lists and common queries
5. **Security**: Validate inputs, use HTTPS, rotate API keys
6. **Permissions**: Enforce user permissions from Umbraco

---

## 9. Security Considerations

### Best Practices

1. ✅ **Use HTTPS** for remote connections
2. ✅ **Rotate API keys** regularly
3. ✅ **Use bearer tokens** with expiration
4. ✅ **Validate all inputs** before Umbraco API calls
5. ✅ **Limit permissions** (read-only for sensitive operations)
6. ✅ **Audit logging** of all operations
7. ✅ **Rate limiting** to prevent abuse
8. ✅ **Use OAuth 2.0** for user delegation

### What NOT to Expose

- 🚫 User creation/deletion (use Umbraco admin panel)
- 🚫 Permission changes (security risk)
- 🚫 Backups/restore (handle separately)
- 🚫 Configuration changes (manual review required)
- 🚫 Sensitive data (API keys in responses)

---

## 10. Current Status & Resources

### Official MCP Resources
- **Website**: https://modelcontextprotocol.io
- **Specification**: https://modelcontextprotocol.io/specification/latest
- **GitHub**: https://github.com/modelcontextprotocol
- **Reference Servers**: https://github.com/modelcontextprotocol/servers
- **Inspector Tool**: https://github.com/modelcontextprotocol/inspector

### Existing MCP Servers
- **Filesystem**: Read/write local files
- **PostgreSQL**: Query databases
- **Sentry**: Error tracking
- **Git**: Repository operations
- **Web Search**: Browser automation
- **Slack**: Team communication

### Umbraco MCP Status
❌ **No official Umbraco MCP server exists yet**
⏳ **Potential for community contribution**
✅ **Can be built using MCP SDK for any language**

---

## 11. Example Use Cases with Umbraco MCP

### Use Case 1: Content Generation with Claude
```
User: "Create a blog post about Umbraco with standard sections"

Claude:
1. Uses MCP tool: create_content_node
2. Creates "Article" under Blog section
3. Sets title, summary, body
4. Creates variant for Spanish
5. Publishes to live
6. Returns: "Blog post created and published at /blog/umbraco-post"
```

### Use Case 2: Content Migration
```
User: "Migrate all news items to a new structure"

Claude:
1. Lists all content of type "News"
2. For each item:
   - Reads properties
   - Creates new node under News Archive
   - Maps old properties to new structure
   - Publishes
   - Deletes old node
3. Reports: "Migrated 47 news items"
```

### Use Case 3: Content Analysis
```
User: "Find all orphaned content pages"

Claude:
1. Queries content tree
2. Analyzes relationships
3. Identifies nodes with no incoming links
4. Suggests deletion or archival
5. Shows impact: "4 pages have orphaned content"
```

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **What is it?** | Open standard for AI apps to connect to external systems |
| **Architecture** | Client-server, JSON-RPC 2.0, STDIO or HTTP transport |
| **Key Features** | Tools (functions), Resources (data), Prompts (templates) |
| **Umbraco Use** | Automate content creation, publishing, management with AI |
| **Installation** | Configure in Claude Desktop or build custom client |
| **Operations** | Content CRUD, document types, publishing, analysis |
| **Security** | API keys, bearer tokens, OAuth 2.0, permission validation |
| **Status** | No official server yet, but can be built |

---

## Next Steps

1. **Monitor** the Umbraco community for MCP server announcements
2. **Explore** existing MCP servers for patterns
3. **Consider** building a custom Umbraco MCP for your needs
4. **Follow** the official MCP SDK documentation for your preferred language
5. **Join** the Model Context Protocol community discussions

For more information, visit: https://modelcontextprotocol.io/docs
