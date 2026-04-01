/**
 * s04_tool_system.ts — 工具系统演示
 *
 * 演示 Claude Code 的工具架构:
 * 1. Tool 类接口 (name + schema + call + prompt + render)
 * 2. 条件注册 (feature gate + USER_TYPE + lazy require)
 * 3. Schema 验证
 * 4. 工具分类 (核心/协作/条件/MCP动态)
 *
 * Source: 
 *   src/Tool.ts     → 工具基类 (29KB)
 *   src/tools.ts    → 注册中心 (17KB)
 *   src/tools/*/    → 50+ 工具目录
 *
 * 运行: npx tsx agents/s04_tool_system.ts
 */

// ============================================================
// 第 1 部分: Tool 接口
// 真实源码: src/Tool.ts
// 每个工具是一个对象, 不是一个函数
// ============================================================

interface ToolInputSchema {
  type: 'object'
  properties?: Record<string, any>
  required?: string[]
}

interface ToolProgress {
  type: string
  content: string
}

interface Tool {
  name: string
  description: string
  inputSchema: ToolInputSchema
  isEnabled: () => boolean         // 运行时判断是否可用
  prompt: () => string             // 该工具的 system prompt 片段
  call: (input: any) => Promise<string>  // 执行函数
  renderProgress?: (p: ToolProgress) => string  // UI 渲染
}

// ============================================================
// 第 2 部分: 工具实现
// 真实源码: src/tools/*/  每个工具一个目录
// ============================================================

const BashTool: Tool = {
  name: 'bash',
  description: 'Run a shell command in the user\'s environment.',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in seconds (default: 120)' },
    },
    required: ['command'],
  },
  isEnabled: () => true,
  prompt: () => `Use bash for: running tests, git operations, installing packages, file system navigation.
Prefer targeted commands over broad ones. Wait for confirmation before destructive operations.`,
  call: async (input) => {
    const { execSync } = require('child_process')
    try {
      return execSync(input.command, {
        encoding: 'utf-8', timeout: (input.timeout || 120) * 1000, cwd: process.cwd(),
      }).trim() || '(no output)'
    } catch (e: any) {
      return `Error: ${e.message?.slice(0, 500)}`
    }
  },
}

const FileReadTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path (relative or absolute)' },
      offset: { type: 'number', description: 'Start line (1-based)' },
      limit: { type: 'number', description: 'Max lines to read' },
    },
    required: ['path'],
  },
  isEnabled: () => true,
  prompt: () => `Use read_file for viewing code. Use offset/limit for large files to avoid context waste.`,
  call: async (input) => {
    const fs = require('fs')
    try {
      const content = fs.readFileSync(input.path, 'utf-8')
      let lines = content.split('\n')
      if (input.offset) lines = lines.slice(input.offset - 1)
      if (input.limit) lines = lines.slice(0, input.limit)
      return lines.map((l: string, i: number) => `${String(i + (input.offset || 1)).padStart(5)}:${l}`).join('\n')
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },
}

const FileEditTool: Tool = {
  name: 'edit_file',
  description: 'Replace exact text in an existing file.',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      old_str: { type: 'string', description: 'Text to find (must match exactly)' },
      new_str: { type: 'string', description: 'Replacement text' },
    },
    required: ['path', 'old_str', 'new_str'],
  },
  isEnabled: () => true,
  prompt: () => `old_str must match EXACTLY including whitespace. Prefer edit_file over write_file for existing files.`,
  call: async (input) => {
    const fs = require('fs')
    try {
      const content = fs.readFileSync(input.path, 'utf-8')
      if (!content.includes(input.old_str)) return `Error: old_str not found in ${input.path}`
      fs.writeFileSync(input.path, content.replace(input.old_str, input.new_str))
      return `Edited ${input.path}`
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },
}

const TodoWriteTool: Tool = {
  name: 'todo_write',
  description: 'Create or update a structured todo list for tracking multi-step tasks.',
  inputSchema: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          },
          required: ['id', 'content', 'status'],
        },
      },
    },
    required: ['todos'],
  },
  isEnabled: () => true,
  prompt: () => `Use for complex multi-step tasks. Only ONE item can be in_progress at a time.`,
  call: async (input) => {
    const inProgress = input.todos?.filter((t: any) => t.status === 'in_progress') || []
    if (inProgress.length > 1) return 'Error: Only one task can be in_progress at a time'
    return input.todos?.map((t: any) => {
      const icon = { pending: '[ ]', in_progress: '[>]', completed: '[x]' }[t.status as string] || '[?]'
      return `${icon} #${t.id}: ${t.content}`
    }).join('\n') || 'No todos'
  },
}

// ============================================================
// 第 3 部分: 条件加载的工具
// 真实源码: src/tools.ts:16-53
// ============================================================

// 模拟 feature flags
const features = { AGENT_TRIGGERS: true, MONITOR_TOOL: false, KAIROS: false }

const CronCreateTool: Tool = {
  name: 'cron_create',
  description: 'Create a scheduled task.',
  inputSchema: { type: 'object', properties: { schedule: { type: 'string' }, task: { type: 'string' } }, required: ['schedule', 'task'] },
  isEnabled: () => features.AGENT_TRIGGERS,
  prompt: () => 'Create cron jobs for recurring tasks.',
  call: async (input) => `Cron created: "${input.task}" at ${input.schedule}`,
}

const MonitorTool: Tool = {
  name: 'monitor',
  description: 'Monitor MCP server status.',
  inputSchema: { type: 'object', properties: {} },
  isEnabled: () => features.MONITOR_TOOL,
  prompt: () => 'Monitor MCP connections.',
  call: async () => 'Monitor not available',
}

const SleepTool: Tool = {
  name: 'sleep',
  description: 'Sleep for a specified duration.',
  inputSchema: { type: 'object', properties: { seconds: { type: 'number' } }, required: ['seconds'] },
  isEnabled: () => features.KAIROS,
  prompt: () => 'Use sleep for waiting between operations.',
  call: async (input) => { await new Promise(r => setTimeout(r, (input.seconds || 1) * 1000)); return `Slept ${input.seconds}s` },
}

// ============================================================
// 第 4 部分: 工具注册中心
// 真实源码: src/tools.ts → getTools()
// ============================================================

function getTools(): Tool[] {
  const allTools = [
    // 核心工具 — 始终加载
    BashTool,
    FileReadTool,
    FileEditTool,
    TodoWriteTool,
    // 条件工具 — feature gate 控制
    CronCreateTool,
    MonitorTool,
    SleepTool,
  ]

  // 只返回 isEnabled() 为 true 的工具
  return allTools.filter(t => t.isEnabled())
}

// Schema 验证
function validateToolInput(tool: Tool, input: any): string | null {
  const schema = tool.inputSchema
  if (!schema.required) return null
  for (const field of schema.required) {
    if (!(field in input)) return `Missing required field: ${field}`
  }
  return null
}

// ============================================================
// 主程序
// ============================================================

function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  s04: Claude Code 工具系统演示                       ║')
  console.log('║  Tool 类接口 + 条件注册 + Schema 验证              ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  const tools = getTools()
  const allTools = [BashTool, FileReadTool, FileEditTool, TodoWriteTool, CronCreateTool, MonitorTool, SleepTool]

  // 工具注册结果
  console.log('━━━ 1. 工具注册结果 ━━━')
  console.log(`  已注册: ${tools.length} / ${allTools.length}`)
  console.log()
  for (const t of allTools) {
    const enabled = t.isEnabled()
    const icon = enabled ? '\x1b[32m✓\x1b[0m' : '\x1b[90m✗\x1b[0m'
    const params = t.inputSchema.required?.join(', ') || '(none)'
    console.log(`  ${icon} ${t.name.padEnd(15)} params: [${params}]${!enabled ? ' \x1b[90m(feature gated)\x1b[0m' : ''}`)
  }

  // 工具分类
  console.log('\n━━━ 2. 工具分类 (真实 Claude Code 50+ 工具) ━━━')
  const categories = [
    { name: '文件系统', tools: 'FileRead, FileEdit, FileWrite, Glob, Grep', count: 5 },
    { name: 'Shell', tools: 'BashTool, PowerShellTool', count: 2 },
    { name: 'AI 子代理', tools: 'AgentTool (228KB!)', count: 1 },
    { name: '规划', tools: 'TodoWrite, EnterPlanMode, ExitPlanMode', count: 3 },
    { name: '协作', tools: 'TeamCreate, TeamDelete, SendMessage', count: 3 },
    { name: '任务', tools: 'TaskCreate/Get/List/Update/Stop/Output', count: 6 },
    { name: 'MCP', tools: 'MCPTool, McpAuth, ListMcpResources', count: 3 },
    { name: 'IDE', tools: 'LSPTool, NotebookEditTool', count: 2 },
    { name: '网络', tools: 'WebFetch, WebSearch', count: 2 },
    { name: 'Worktree', tools: 'EnterWorktree, ExitWorktree', count: 2 },
    { name: '其他', tools: 'Skill, Config, Brief, Sleep, Cron*3...', count: 10 },
  ]
  for (const cat of categories) {
    console.log(`  ${cat.name.padEnd(10)} (${cat.count}) — ${cat.tools}`)
  }

  // Schema 验证
  console.log('\n━━━ 3. Schema 验证 ━━━')
  const validInput = { command: 'ls -la' }
  const invalidInput = { }
  console.log(`  bash(${JSON.stringify(validInput)}) → ${validateToolInput(BashTool, validInput) || '\x1b[32mValid\x1b[0m'}`)
  console.log(`  bash(${JSON.stringify(invalidInput)}) → \x1b[31m${validateToolInput(BashTool, invalidInput)}\x1b[0m`)

  // 工具 Prompt
  console.log('\n━━━ 4. 工具 Prompt 片段 ━━━')
  for (const t of tools.slice(0, 3)) {
    console.log(`  ${t.name}: \x1b[33m${t.prompt().split('\n')[0]}\x1b[0m`)
  }

  // 条件加载
  console.log('\n━━━ 5. Feature Gate 状态 ━━━')
  for (const [name, enabled] of Object.entries(features)) {
    console.log(`  ${enabled ? '\x1b[32m✓\x1b[0m' : '\x1b[90m✗\x1b[0m'} ${name}`)
  }

  console.log('\n━━━ 关键洞察 ━━━')
  console.log('  1. 每个工具是一个对象 (不是函数) — name + schema + call + prompt + render')
  console.log('  2. 每个工具一个目录 — 代码/prompt/UI/测试自包含')
  console.log('  3. feature() + isEnabled() 双重门控 — 编译时 + 运行时')
  console.log('  4. 循环不变 — 加工具 = 加一个对象到数组, query() 循环无需修改')
}

main()
