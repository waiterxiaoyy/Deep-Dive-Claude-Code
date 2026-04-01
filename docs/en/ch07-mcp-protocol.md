# Ch08: MCP Protocol — Unified Tool Calling Standard

`Ch01 > Ch02 > Ch03 > Ch04 > Ch05 > Ch06 | Ch07 > [ Ch08 ] Ch09 > Ch10 > Ch11 > Ch12`

> *"MCP makes any service a tool for AI—databases, APIs, local apps, remote services"*

## The Problem

Claude Code has 50+ built-in tools, but user needs are infinite. Database queries, Jira operations, Slack messages, Kubernetes management... can't all be built-in. Need a standard protocol so third-party services can declare their capabilities, and agents can auto-discover and call them.

## Architecture Diagram

```
Claude Code
    |
    |  MCP Client (client.ts 116KB)
    |
    ├── stdio transport ────── Local MCP server (subprocess)
    │   e.g. filesystem-server, git-server
    │
    ├── SSE transport ───────── Remote MCP server
    │   e.g. Jira MCP, Slack MCP
    │
    └── WebSocket transport ─── Remote MCP server
        e.g. custom MCP server

MCP server declares:
  tools:     [{name, description, inputSchema}]  → become agent tools
  resources: [{uri, name, mimeType}]             → readable resources
  prompts:   [{name, description, arguments}]    → predefined prompt templates
```

## Source Code Guide

### 1. MCP Client — client.ts (116KB)

File path: `src/services/mcp/client.ts`

The largest file in MCP implementation, responsible for:
- Discovering and connecting to MCP servers
- Tool list fetching and caching
- Tool call proxying
- Resource reading
- Connection lifecycle management

### 2. MCP Config — config.ts (50KB)

File path: `src/services/mcp/config.ts`

MCP server configuration comes from multiple levels:

```
~/.claude/settings.json        → Global MCP config
.claude/settings.local.json    → Project-level MCP config
CLAUDE.md                      → MCP declarations in project rules
```

Config supports environment variable expansion (`envExpansion.ts`) and multiple transport types.

### 3. MCP Auth — auth.ts (87KB)

File path: `src/services/mcp/auth.ts`

Supports OAuth 2.0 auth flow for MCP servers requiring login:

```
User → MCP server returns 401 → Start OAuth flow
    → Local HTTP server receives callback (oauthPort.ts)
    → Get token → Retry request
```

### 4. How MCP Tools Integrate with Agent

Tools declared by MCP servers are wrapped as `MCPTool`, participating in dispatch like built-in tools:

```typescript
// src/tools/MCPTool/MCPTool.ts — MCP tool wrapper
// Tool schemas from MCP servers are converted to Claude Code's Tool interface
// Calls are forwarded to corresponding server via MCP protocol
```

### 5. Key File Index

```
services/mcp/
├── client.ts               (116KB) — MCP client core
├── auth.ts                 (87KB)  — OAuth authentication
├── config.ts               (50KB)  — Config management
├── useManageMCPConnections.ts (44KB) — Connection management hook
├── xaa.ts                  (18KB)  — Extended auth agent
├── utils.ts                (18KB)  — Utility functions
├── types.ts                (7KB)   — Type definitions
├── channelPermissions.ts   (9KB)   — Channel permissions
└── elicitationHandler.ts   (10KB)  — Request handling
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Support stdio/SSE/WebSocket transports | Local servers use stdio, remote use network protocols |
| OAuth 2.0 authentication | Secure access to third-party services requiring login |
| Multi-level config | Global + project-level, team members can share project MCP config |
| Auto tool discovery | Auto-fetch tool list after connecting, no manual config needed |

## Practice Exercises

1. **View MCP type definitions**: Open `src/services/mcp/types.ts`, understand the data structure of MCP server connections
2. **Trace MCP tool call**: From `src/tools/MCPTool/MCPTool.ts`, trace how an MCP tool call is forwarded to the MCP server
3. **Understand config format**: In `src/services/mcp/config.ts`, find the JSON Schema definition for MCP config
