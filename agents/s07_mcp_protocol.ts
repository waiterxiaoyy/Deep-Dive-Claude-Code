/**
 * s08_mcp_protocol.ts — MCP 协议演示
 *
 * 演示 Claude Code 的 MCP (Model Context Protocol) 核心概念:
 * 1. 工具自动发现 (服务器声明 → Agent 使用)
 * 2. 多传输方式 (stdio / SSE / WebSocket)
 * 3. 动态工具注册 (MCP 工具 + 内置工具 统一分发)
 *
 * Source: 
 *   src/services/mcp/client.ts   (116KB) — MCP 客户端
 *   src/services/mcp/config.ts   (50KB)  — 配置管理
 *   src/services/mcp/types.ts    (7KB)   — 类型定义
 *   src/tools/MCPTool/MCPTool.ts          — MCP 工具包装
 *
 * 运行: npx tsx agents/s08_mcp_protocol.ts
 * (纯演示, 不需要 API Key)
 */

// ============================================================
// MCP 协议核心概念
// ============================================================

interface MCPToolSchema {
  name: string
  description: string
  inputSchema: { type: 'object'; properties?: Record<string, any>; required?: string[] }
}

interface MCPResource {
  uri: string
  name: string
  mimeType: string
}

interface MCPServerCapabilities {
  tools: MCPToolSchema[]
  resources: MCPResource[]
  prompts: { name: string; description: string }[]
}

type TransportType = 'stdio' | 'sse' | 'websocket'

interface MCPServerConfig {
  name: string
  transport: TransportType
  command?: string        // stdio 模式
  url?: string            // sse/websocket 模式
  env?: Record<string, string>
}

interface MCPConnection {
  config: MCPServerConfig
  status: 'connecting' | 'connected' | 'error' | 'disconnected'
  capabilities?: MCPServerCapabilities
  error?: string
}

// ============================================================
// 模拟 MCP 服务器
// ============================================================

const MOCK_SERVERS: Record<string, MCPServerCapabilities> = {
  'filesystem-server': {
    tools: [
      { name: 'fs_list', description: 'List directory contents', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
      { name: 'fs_stat', description: 'Get file metadata', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    ],
    resources: [
      { uri: 'file:///workspace', name: 'Workspace Root', mimeType: 'inode/directory' },
    ],
    prompts: [],
  },
  'github-server': {
    tools: [
      { name: 'gh_create_issue', description: 'Create a GitHub issue', inputSchema: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' }, repo: { type: 'string' } }, required: ['title', 'repo'] } },
      { name: 'gh_list_prs', description: 'List pull requests', inputSchema: { type: 'object', properties: { repo: { type: 'string' }, state: { type: 'string' } }, required: ['repo'] } },
      { name: 'gh_review_pr', description: 'Review a pull request', inputSchema: { type: 'object', properties: { repo: { type: 'string' }, pr: { type: 'number' } }, required: ['repo', 'pr'] } },
    ],
    resources: [],
    prompts: [
      { name: 'review-template', description: 'Code review prompt template' },
    ],
  },
  'database-server': {
    tools: [
      { name: 'db_query', description: 'Execute a SQL query', inputSchema: { type: 'object', properties: { sql: { type: 'string' }, database: { type: 'string' } }, required: ['sql'] } },
      { name: 'db_schema', description: 'Get database schema', inputSchema: { type: 'object', properties: { database: { type: 'string' } } } },
    ],
    resources: [
      { uri: 'db://main/schema', name: 'Database Schema', mimeType: 'application/json' },
    ],
    prompts: [],
  },
}

// ============================================================
// MCP 配置管理 (多级配置)
// ============================================================

function loadMCPConfig(): MCPServerConfig[] {
  // 真实源码: src/services/mcp/config.ts
  // 配置来源:
  //   1. ~/.claude/settings.json    → 全局配置
  //   2. .claude/settings.local.json → 项目级配置
  //   3. CLAUDE.md 中的 MCP 声明

  return [
    { name: 'filesystem-server', transport: 'stdio', command: 'npx @modelcontextprotocol/server-filesystem /workspace' },
    { name: 'github-server', transport: 'sse', url: 'https://mcp.github.example.com/sse', env: { GITHUB_TOKEN: '***' } },
    { name: 'database-server', transport: 'stdio', command: 'npx @mcp/server-postgres', env: { DATABASE_URL: '***' } },
  ]
}

// ============================================================
// 连接管理器
// ============================================================

function connectServers(configs: MCPServerConfig[]): MCPConnection[] {
  return configs.map(config => {
    const capabilities = MOCK_SERVERS[config.name]
    if (capabilities) {
      return { config, status: 'connected' as const, capabilities }
    }
    return { config, status: 'error' as const, error: 'Server not found' }
  })
}

// ============================================================
// MCP 工具 → 统一工具列表
// ============================================================

interface UnifiedTool {
  name: string
  description: string
  source: 'built-in' | 'mcp'
  mcpServer?: string
}

function buildUnifiedToolList(connections: MCPConnection[]): UnifiedTool[] {
  const tools: UnifiedTool[] = [
    // 内置工具
    { name: 'bash', description: 'Run shell command', source: 'built-in' },
    { name: 'read_file', description: 'Read file', source: 'built-in' },
    { name: 'edit_file', description: 'Edit file', source: 'built-in' },
    { name: 'grep', description: 'Search text', source: 'built-in' },
    { name: 'todo_write', description: 'Manage todos', source: 'built-in' },
  ]

  // MCP 工具注入
  for (const conn of connections) {
    if (conn.status !== 'connected' || !conn.capabilities) continue
    for (const tool of conn.capabilities.tools) {
      tools.push({
        name: tool.name,
        description: tool.description,
        source: 'mcp',
        mcpServer: conn.config.name,
      })
    }
  }

  return tools
}

// ============================================================
// 主程序
// ============================================================

function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  s08: Claude Code MCP 协议演示                       ║')
  console.log('║  工具自动发现 + 多传输 + 统一分发                   ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  // 1. 配置加载
  const configs = loadMCPConfig()
  console.log('━━━ 1. MCP 配置 (多级来源) ━━━\n')
  for (const c of configs) {
    console.log(`  ${c.name}`)
    console.log(`    传输: ${c.transport}${c.command ? ` → ${c.command}` : ''}${c.url ? ` → ${c.url}` : ''}`)
    console.log(`    环境: ${c.env ? Object.keys(c.env).join(', ') : '(none)'}`)
  }

  // 2. 连接
  const connections = connectServers(configs)
  console.log('\n━━━ 2. 连接状态 ━━━\n')
  for (const conn of connections) {
    const icon = conn.status === 'connected' ? '\x1b[32m●\x1b[0m' : '\x1b[31m●\x1b[0m'
    const toolCount = conn.capabilities?.tools.length ?? 0
    const resCount = conn.capabilities?.resources.length ?? 0
    console.log(`  ${icon} ${conn.config.name.padEnd(25)} ${toolCount} tools, ${resCount} resources`)
  }

  // 3. 统一工具列表
  const allTools = buildUnifiedToolList(connections)
  console.log('\n━━━ 3. 统一工具列表 (内置 + MCP) ━━━\n')
  const builtIn = allTools.filter(t => t.source === 'built-in')
  const mcp = allTools.filter(t => t.source === 'mcp')
  console.log(`  内置工具 (${builtIn.length}):`)
  for (const t of builtIn) {
    console.log(`    \x1b[36m${t.name.padEnd(20)}\x1b[0m ${t.description}`)
  }
  console.log(`\n  MCP 工具 (${mcp.length}):`)
  for (const t of mcp) {
    console.log(`    \x1b[33m${t.name.padEnd(20)}\x1b[0m ${t.description} \x1b[90m← ${t.mcpServer}\x1b[0m`)
  }
  console.log(`\n  总计: ${allTools.length} 个工具可用`)

  // 4. 资源列表
  console.log('\n━━━ 4. MCP 资源 ━━━\n')
  for (const conn of connections) {
    if (!conn.capabilities?.resources.length) continue
    for (const r of conn.capabilities.resources) {
      console.log(`  📄 ${r.uri} (${r.mimeType}) \x1b[90m← ${conn.config.name}\x1b[0m`)
    }
  }

  console.log('\n━━━ 关键洞察 ━━━')
  console.log('  1. 自动发现 — 连接 MCP 服务器后自动获取工具列表')
  console.log('  2. 统一分发 — MCP 工具和内置工具在 Agent 循环中无差别使用')
  console.log('  3. 三种传输 — stdio(本地) / SSE(远程只读) / WebSocket(远程双向)')
  console.log('  4. 多级配置 — 全局 + 项目级, 团队可共享项目 MCP 配置')
}

main()
