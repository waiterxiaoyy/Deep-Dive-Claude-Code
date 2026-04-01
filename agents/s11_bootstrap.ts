/**
 * s01_bootstrap.ts — 启动流程演示
 *
 * 演示 Claude Code 的启动优化机制：
 * 1. 快速路径分发（--version 零加载）
 * 2. feature() 编译时功能消除
 * 3. 并行预取（利用 import 求值时间做 I/O）
 * 4. 动态 import 避免不必要模块加载
 *
 * Source: 
 *   src/dev-entry.ts          → 缺失导入检查
 *   src/entrypoints/cli.tsx   → 快速路径分发
 *   src/main.tsx:1-66         → 并行预取
 *
 *     bun run dev
 *         |
 *         v
 *     dev-entry.ts ──(缺失导入=0?)──> cli.tsx
 *         |                              |
 *         |                   ┌──────────┼──────────┐
 *         |                   v          v          v
 *         |              --version   --mcp      (其他)
 *         |              零加载      最小加载    完整加载
 *         |                                        |
 *         v                                        v
 *     报告缺失导入                            main.tsx
 *                                      并行预取 MDM + Keychain
 *                                      Commander 参数解析
 *                                      REPL 启动
 *
 * 运行: npx tsx agents/s01_bootstrap.ts [--version | --fast-path-demo]
 */

// ============================================================
// 第 1 部分: feature() 宏模拟
// 在真实 Claude Code 中, feature() 由 bun:bundle 在编译时求值
// 返回 true/false，使得整个 if 块在构建产物中被删除 (DCE)
// ============================================================

const FEATURES: Record<string, boolean> = {
  ABLATION_BASELINE: false,    // 消融实验（仅内部）
  DUMP_SYSTEM_PROMPT: false,   // prompt 导出（仅内部）
  COORDINATOR_MODE: false,     // 协调器模式
  DAEMON: false,               // 守护进程
  BRIDGE_MODE: false,          // 远程桥接
  CHICAGO_MCP: true,           // 计算机使用 MCP
  AGENT_TRIGGERS: true,        // 定时任务
  PROACTIVE: false,            // 主动模式
  KAIROS: false,               // 助手模式
  MONITOR_TOOL: false,         // 监控工具
}

function feature(name: string): boolean {
  return FEATURES[name] ?? false
}

// ============================================================
// 第 2 部分: 快速路径分发
// 真实源码: src/entrypoints/cli.tsx:33-106
// 核心思想: 不同的 CLI 参数走不同的加载路径
// --version 不需要任何模块, 瞬间返回
// ============================================================

const VERSION = '999.0.0-restored'

type FastPathResult =
  | { type: 'version'; output: string }
  | { type: 'dump-prompt'; loadModules: string[] }
  | { type: 'mcp-server'; loadModules: string[] }
  | { type: 'daemon-worker'; loadModules: string[] }
  | { type: 'full'; loadModules: string[] }

function dispatchFastPath(args: string[]): FastPathResult {
  // 快速路径 1: --version — 零模块加载
  if (args.length === 1 && ['--version', '-v', '-V'].includes(args[0])) {
    return { type: 'version', output: `${VERSION} (Claude Code)` }
  }

  // 快速路径 2: --dump-system-prompt — 仅加载 config + prompts
  if (feature('DUMP_SYSTEM_PROMPT') && args[0] === '--dump-system-prompt') {
    return {
      type: 'dump-prompt',
      loadModules: ['utils/config.js', 'utils/model/model.js', 'constants/prompts.js'],
    }
  }

  // 快速路径 3: MCP 服务器模式
  if (args[0] === '--claude-in-chrome-mcp') {
    return {
      type: 'mcp-server',
      loadModules: ['utils/claudeInChrome/mcpServer.js'],
    }
  }

  // 快速路径 4: 守护进程工作线程
  if (feature('DAEMON') && args[0] === '--daemon-worker') {
    return {
      type: 'daemon-worker',
      loadModules: ['daemon/workerRegistry.js'],
    }
  }

  // 完整路径: 加载 main.tsx (785KB, 135ms+ import 求值)
  return {
    type: 'full',
    loadModules: [
      'utils/startupProfiler.js',
      'utils/settings/mdm/rawRead.js',       // 并行预取 1
      'utils/secureStorage/keychainPrefetch.js', // 并行预取 2
      'commander', 'chalk', 'react', 'lodash-es', // 重量级依赖
      'services/analytics/growthbook.js',
      'services/api/bootstrap.js',
      'services/mcp/officialRegistry.js',
      'services/policyLimits/index.js',
      'tools.js',                             // 所有工具
      'commands.js',                          // 所有命令
      // ... 还有 60+ 个 import
    ],
  }
}

// ============================================================
// 第 3 部分: 并行预取模拟
// 真实源码: src/main.tsx:1-20
// 利用 ES module import 顺序求值的特性:
//   import A   ← A 开始执行
//   A.start()  ← 启动异步任务
//   import B   ← B 开始求值 (此时 A 的异步任务在后台跑)
//   import C   ← C 开始求值
//   ...135ms 后所有 import 完成, A 的任务也完成了
// ============================================================

async function simulateParallelPrefetch(): Promise<{
  sequential: number
  parallel: number
}> {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

  // 串行方式: MDM (50ms) → Keychain OAuth (35ms) → Keychain API Key (30ms)
  const seqStart = Date.now()
  await delay(50)   // MDM
  await delay(35)   // Keychain OAuth
  await delay(30)   // Keychain API Key
  const sequential = Date.now() - seqStart

  // 并行方式: 三者同时启动, import 求值 (135ms) 与它们并行
  const parStart = Date.now()
  const [, , ,] = await Promise.all([
    delay(50),    // MDM
    delay(35),    // Keychain OAuth
    delay(30),    // Keychain API Key
    delay(135),   // import 求值 (最长的一项决定总时间)
  ])
  const parallel = Date.now() - parStart

  return { sequential: sequential + 135, parallel }  // 串行还要加上 import 时间
}

// ============================================================
// 第 4 部分: 条件加载 & 编译时消除
// 真实源码: src/tools.ts:16-53
// feature() 返回 false 时, 整个 require() 块被 DCE 删除
// ============================================================

interface ToolStub { name: string; loaded: boolean }

function loadToolsConditionally(): ToolStub[] {
  const tools: ToolStub[] = [
    // 始终加载的核心工具
    { name: 'BashTool', loaded: true },
    { name: 'FileReadTool', loaded: true },
    { name: 'FileEditTool', loaded: true },
    { name: 'FileWriteTool', loaded: true },
    { name: 'GrepTool', loaded: true },
    { name: 'GlobTool', loaded: true },
    { name: 'AgentTool', loaded: true },
    { name: 'TodoWriteTool', loaded: true },
    { name: 'WebFetchTool', loaded: true },
    { name: 'WebSearchTool', loaded: true },
  ]

  // 条件编译加载 — 外部构建中这些代码会被完全删除
  if (feature('PROACTIVE') || feature('KAIROS')) {
    tools.push({ name: 'SleepTool', loaded: true })
  } else {
    tools.push({ name: 'SleepTool', loaded: false })
  }

  if (feature('AGENT_TRIGGERS')) {
    tools.push({ name: 'CronCreateTool', loaded: true })
    tools.push({ name: 'CronDeleteTool', loaded: true })
    tools.push({ name: 'CronListTool', loaded: true })
  }

  if (feature('MONITOR_TOOL')) {
    tools.push({ name: 'MonitorTool', loaded: true })
  } else {
    tools.push({ name: 'MonitorTool', loaded: false })
  }

  return tools
}

// ============================================================
// 主程序: 演示上述所有机制
// ============================================================

async function main() {
  const args = process.argv.slice(2)

  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  s01: Claude Code 启动流程演示                       ║')
  console.log('║  展示快速路径、feature() 宏、并行预取               ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  // --- 演示 1: 快速路径分发 ---
  console.log('━━━ 1. 快速路径分发 ━━━')
  console.log('真实源码: src/entrypoints/cli.tsx:33-106\n')

  const testCases = [
    ['--version'],
    ['--claude-in-chrome-mcp'],
    ['--daemon-worker', 'assistant'],
    ['my', 'prompt', 'here'],
  ]

  for (const tc of testCases) {
    const result = dispatchFastPath(tc)
    const moduleCount = result.type === 'version' ? 0 : (result as any).loadModules?.length ?? 0
    console.log(
      `  args: ${JSON.stringify(tc).padEnd(35)} → ` +
      `\x1b[33m${result.type.padEnd(15)}\x1b[0m ` +
      `需加载 ${moduleCount} 个模块`
    )
  }

  console.log()

  // --- 演示 2: 并行预取 ---
  console.log('━━━ 2. 并行预取 (MDM + Keychain) ━━━')
  console.log('真实源码: src/main.tsx:1-20\n')

  const { sequential, parallel } = await simulateParallelPrefetch()
  console.log(`  串行方式: MDM(50ms) + Keychain(35ms+30ms) + import(135ms) = \x1b[31m${sequential}ms\x1b[0m`)
  console.log(`  并行方式: max(MDM, Keychain, import) = \x1b[32m${parallel}ms\x1b[0m`)
  console.log(`  节省: \x1b[32m~${sequential - parallel}ms\x1b[0m (${Math.round((1 - parallel / sequential) * 100)}%)`)
  console.log()

  // --- 演示 3: feature() 条件加载 ---
  console.log('━━━ 3. feature() 条件工具加载 ━━━')
  console.log('真实源码: src/tools.ts:16-53\n')

  const tools = loadToolsConditionally()
  const loaded = tools.filter(t => t.loaded)
  const skipped = tools.filter(t => !t.loaded)
  console.log(`  已加载 (${loaded.length}): ${loaded.map(t => t.name).join(', ')}`)
  console.log(`  \x1b[90m已跳过 (${skipped.length}): ${skipped.map(t => t.name).join(', ')}\x1b[0m`)

  console.log()

  // --- 演示 4: feature flags 总览 ---
  console.log('━━━ 4. Feature Flags 总览 ━━━')
  console.log('真实源码: cli.tsx 和 tools.ts 中的 feature() 调用\n')

  for (const [name, enabled] of Object.entries(FEATURES)) {
    const icon = enabled ? '\x1b[32m✓\x1b[0m' : '\x1b[90m✗\x1b[0m'
    console.log(`  ${icon} ${name}`)
  }

  console.log('\n━━━ 总结 ━━━')
  console.log('Claude Code 启动的三个关键优化:')
  console.log('  1. 快速路径: --version 零加载, 瞬间返回')
  console.log('  2. 并行预取: 利用 import 求值时间做异步 I/O')
  console.log('  3. 编译时消除: feature() 宏让无关代码不进入产物')
}

main().catch(console.error)
