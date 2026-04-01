"use client";

import { ChapterVisualization } from "@/components/visualizations";
import { AgentLoopSimulator } from "@/components/simulator/agent-loop-simulator";
import { SourceViewer } from "@/components/code/source-viewer";
import { DocRenderer } from "@/components/docs/doc-renderer";
import { Tabs } from "@/components/ui/tabs";
import { CHAPTER_META, LAYER_COLORS } from "@/lib/constants";
import { useLocale } from "@/lib/locale-context";
import { UI_TEXT } from "@/lib/i18n";

// 演示代码源码（按新章节顺序）
const DEMO_SOURCES: Record<string, { source: string; filename: string }> = {
  ch01: {
    filename: "agents/s01_query_engine.ts",
    source: `// Ch01: Agent 循环 — AsyncGenerator + 权限检查
// Source:  src/QueryEngine.ts + src/query.ts

class QueryEngine {
  private messages: Message[] = [];
  private tools: Map<string, Tool> = new Map();
  private permissionEngine: PermissionEngine;

  async *run(userInput: string): AsyncGenerator<StreamEvent> {
    this.messages.push({ role: "user", content: userInput });

    while (true) {
      // 1. Token 预算检查
      const budget = analyzeContext(this.messages);
      if (budget.exceeds) {
        yield { type: "compact", reason: "context_full" };
        await this.compact();
      }

      // 2. 调用 API（流式）
      const response = await this.callAPI(this.messages);

      // 3. 处理响应
      for (const block of response.content) {
        if (block.type === "text") {
          yield { type: "text", content: block.text };
        }
        if (block.type === "tool_use") {
          // 4. 权限检查
          const allowed = await this.permissionEngine.check({
            tool: block.name, input: block.input,
          });
          if (!allowed) { yield { type: "permission_denied" }; continue; }

          // 5. 执行工具
          const result = await this.executeTool(block);
          this.messages.push(
            { role: "assistant", content: [block] },
            { role: "user", content: [{ type: "tool_result", ...result }] }
          );
          yield { type: "tool_result", result };
        }
      }

      // 6. 退出条件
      if (response.stop_reason === "end_turn") break;
      if (response.stop_reason === "max_tokens") break;
    }
  }
}`,
  },
  ch02: {
    filename: "agents/s02_tool_system.ts",
    source: `// Ch02: 工具架构 — Tool 基类 + 条件注册 + Schema 验证
// Source:  src/Tool.ts (29KB) + src/tools.ts (17KB)

abstract class Tool<TInput, TOutput> {
  abstract name: string;
  abstract schema: z.ZodSchema<TInput>;
  abstract execute(input: TInput): Promise<TOutput>;

  async run(rawInput: unknown): Promise<TOutput> {
    const input = this.schema.parse(rawInput); // Zod 验证
    return this.execute(input);
  }
}

// 条件注册: feature() 宏控制工具可见性
if (feature("internal_only")) {
  registry.register(new InternalDebugTool());
}

// 工具分发 4 步流程:
// 1. 模型返回 tool_use → 查询 toolRegistry Map
// 2. Zod Schema 验证输入参数
// 3. Permission Engine 权限检查
// 4. 执行工具 (30s 超时保护)`,
  },
  ch03: {
    filename: "agents/s03_prompt_pipeline.ts",
    source: `// Ch03: 提示词工程 — 4 层动态组装管线
// Source:  src/constants/prompts.ts (53KB)

function buildSystemPrompt(context: Context): string {
  const layers = [
    buildBaseIdentity(),           // L1: ~2K tokens
    buildToolDefinitions(tools),   // L2: ~15K tokens
    loadClaudeMd(projectDir),      // L3: ~5K tokens
    buildDynamicContext(context),   // L4: ~8K tokens
  ];
  return layers.join('\\n');        // 总计 ~30K tokens
}

// CLAUDE.md 查找: 逐级向上搜索
function loadClaudeMd(dir: string): string {
  for (const path of searchPaths(dir)) {
    if (existsSync(path)) return readFileSync(path, 'utf-8');
  }
  return '';
}`,
  },
  ch04: {
    filename: "agents/s04_bash_security.ts",
    source: `// Ch04: Shell 安全体系 — 7 层命令分类
// Source:  tools/BashTool/bashSecurity.ts (100KB)

type SecurityLevel = "safe" | "moderate" | "dangerous" | "blocked";

class BashSecurityEngine {
  private SAFE_COMMANDS = new Set(["ls","cat","grep","find","wc","echo","pwd"]);
  private DANGEROUS_PATTERNS = [/rm\\s+-rf/, /curl.*\\|.*sh/, /chmod\\s+777/];

  classify(input: string, sandbox: string): SecurityLevel {
    const parsed = this.parseCommand(input);
    if (this.SAFE_COMMANDS.has(parsed.commands[0])) return "safe";
    for (const p of this.DANGEROUS_PATTERNS) { if (p.test(input)) return "blocked"; }
    if (!this.validatePaths(parsed, sandbox)) return "blocked";
    return "moderate";
  }
}`,
  },
  ch05: {
    filename: "agents/s05_permissions.ts",
    source: `// Ch05: 权限引擎 — 规则匹配 + 路径沙箱
// Source:  utils/permissions/permissions.ts (51KB)

class PermissionEngine {
  private rules: PermissionRule[];
  check(tool: string, path: string): "allow" | "deny" | "ask" {
    for (const rule of this.rules) {
      if (minimatch(path, rule.pattern)) return rule.access;
    }
    return "ask"; // 默认询问用户
  }
}

// 子进程环境清洗
function cleanEnv(env: NodeJS.ProcessEnv) {
  const SENSITIVE = ['API_KEY','SECRET','TOKEN','PASSWORD','DATABASE_URL'];
  for (const key of Object.keys(env)) {
    if (SENSITIVE.some(s => key.includes(s))) delete env[key];
  }
}`,
  },
  ch06: {
    filename: "agents/s06_context_compact.ts",
    source: `// Ch06: 上下文压缩 — 三层策略
// Source:  services/compact/compact.ts (59KB)

class ContextCompactor {
  // L1: 微压缩 — 截断大型工具结果
  microCompact(messages: Message[]): Message[] {
    return messages.map(m => {
      if (m.content.length > 3000) {
        return { ...m, content: m.content.slice(0,1500) + '\\n...truncated...' };
      }
      return m;
    });
  }

  // L2: 自动压缩 — 模型总结历史
  async autoCompact(messages: Message[]): Promise<Message[]> {
    const summary = await llm.summarize(messages.slice(0, -3));
    return [{ role: 'system', content: summary }, ...messages.slice(-3)];
  }

  // L3: 做梦整合 — 后台提取关键记忆
  async dream(messages: Message[]): Promise<Memory[]> {
    return llm.extractMemories(messages);
  }
}`,
  },
  ch07: {
    filename: "agents/s07_mcp_protocol.ts",
    source: `// Ch07: MCP 协议 — 工具自动发现 + 统一分发
// Source:  services/mcp/client.ts (116KB)

class MCPClient {
  private servers = new Map<string, MCPServer>();

  async connect(config: MCPConfig) {
    const server = new MCPServer(config);
    await server.initialize(); // 协商能力
    const tools = await server.listTools(); // 发现工具
    tools.forEach(t => this.registerTool(config.name, t));
  }

  async callTool(name: string, args: unknown) {
    const [serverName, toolName] = name.split('.');
    const server = this.servers.get(serverName);
    return server.callTool(toolName, args);
  }
}`,
  },
  ch08: {
    filename: "agents/s08_plugin_loader.ts",
    source: `// Ch08: 插件加载 — 发现 + 验证 + 注入
// Source:  utils/plugins/pluginLoader.ts (108KB)

class PluginLoader {
  async loadAll() {
    const plugins = await this.scan();
    for (const plugin of plugins) {
      if (await this.validate(plugin)) { this.inject(plugin); }
    }
  }

  private async validate(plugin: Plugin): Promise<boolean> {
    if (plugin.permissions.includes('NetworkAccess')) return false;
    if (plugin.paths.some(p => !p.startsWith(sandbox))) return false;
    return true;
  }
}`,
  },
  ch09: {
    filename: "agents/s09_multi_agent.ts",
    source: `// Ch09: 多 Agent — Subagent / Teammate / Swarm
// Source:  tools/AgentTool/AgentTool.tsx (228KB)

// L1: Subagent — 隔离上下文
const result = await spawnAgent({
  messages: [],  // 独立 messages[]
  task: '分析依赖图',
});

// L2: Teammate — 持久化 + 邮箱通信
const teammate = spawnTeammate('coder', {
  mailbox: '/tmp/mailbox-coder',
  task: '重写 auth.ts',
});
await teammate.sendMessage('接口变更: login(email, hash)');

// L3: Swarm — 集群并行
coordinator.dispatch([
  { worker: 1, task: '模块 A' },
  { worker: 2, task: '模块 B' },
]);`,
  },
  ch10: {
    filename: "agents/s10_transport.ts",
    source: `// Ch10: CLI 传输层 — 4 种协议
// Source:  cli/transports/

// stdio: 本地终端默认
const stdin = process.stdin.pipe(jsonRpcParser);

// SSE: HTTP 流式输出
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  engine.on('event', e => res.write(\\\`data: \\\${JSON.stringify(e)}\\\\n\\\\n\\\`));
});

// WebSocket: 双向实时
wss.on('connection', ws => {
  ws.on('message', data => engine.handleInput(data));
  engine.on('event', e => ws.send(JSON.stringify(e)));
});

// Hybrid: SSE + WS 混合 (生产推荐)`,
  },
  ch11: {
    filename: "agents/s11_bootstrap.ts",
    source: `// Ch11: 启动优化 — 快速路径 + feature() + 并行预取
// Source:  src/dev-entry.ts → cli.tsx → main.tsx

// 1. 快速路径分发 — 零模块加载
function fastPathDispatch(argv: string[]) {
  if (argv.includes("--version")) {
    console.log("1.0.33");
    process.exit(0);  // 不加载 main.tsx (785KB)
  }
  return loadMain();
}

// 2. 编译时功能消除
if (feature("internal_only")) {
  registerInternalTools(); // 外部构建中被 DCE 移除
}

// 3. 并行预取
async function parallelPrefetch() {
  const [mdm, token, gb, analytics] = await Promise.all([
    fetchMDMConfig(),
    getKeychainToken(),
    loadGrowthBook(),
    initAnalytics(),
  ]);
}`,
  },
  ch12: {
    filename: "agents/s12_production.ts",
    source: `// Ch12: 生产级模式
// Source:  utils/gracefulShutdown.ts (20KB)

// 指数退避重试
async function retry<T>(fn: () => Promise<T>, max = 3): Promise<T> {
  for (let i = 0; i < max; i++) {
    try { return await fn(); }
    catch { await sleep(Math.pow(2, i) * 1000); }
  }
  throw new Error('Max retries exceeded');
}

// 优雅关机
process.on('SIGTERM', async () => {
  await waitForPending();
  await sessionStorage.save(state);
  await mcpClient.disconnect();
  process.exit(0);
});`,
  },
  ch13: {
    filename: "agents/s13_hidden_features.ts",
    source: `// Ch13: 隐藏功能与 Feature Flag 体系
// 30+ Feature Flags · 209 处调用 · 199 个文件

// === 1. feature() 编译时门控 ===
import { feature } from 'bun:bundle'
// ant 构建: feature('BUDDY') → true → 代码保留
// external 构建: feature('BUDDY') → false → DCE 移除

// === 2. Buddy 电子宠物 ===
const SPECIES = ['duck','goose','blob','cat','dragon','octopus',
  'owl','penguin','turtle','snail','ghost','axolotl',
  'capybara','cactus','robot','rabbit','mushroom','chonk'] // 18 种
const RARITY_WEIGHTS = { common:60, uncommon:25, rare:10, epic:4, legendary:1 }

function isBuddyTeaserWindow(): boolean {
  const d = new Date();
  return d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7;
}

// === 3. Kairos 助手模式 ===
// kairosEnabled: 主动循环 + 频道通知 + Cron + 记忆整合
function isGateOpen(): boolean {
  if (getKairosActive()) return false // KAIROS uses disk-skill dream
  return isAutoDreamEnabled()
}

// === 4. Ultraplan 远程规划 ===
const ULTRAPLAN_TIMEOUT_MS = 30 * 60 * 1000 // 30 分钟
function getUltraplanModel() {
  return getFeatureValue('tengu_ultraplan_model', opus46.firstParty)
}

// === 5. Undercover 卧底模式 ===
function isUndercover(): boolean {
  if (USER_TYPE === 'ant') {
    return getRepoClassCached() !== 'internal' // 非内部仓库 → ON
  }
  return false
}`,
  },
};

interface ChapterDetailClientProps {
  chapterId: string;
}

export function ChapterDetailClient({ chapterId }: ChapterDetailClientProps) {
  const { locale } = useLocale();
  const t = UI_TEXT[locale];
  const ch = CHAPTER_META[chapterId];
  if (!ch) return null;

  const tabs = [
    { id: "learn", label: t.chapter_tab_visual },
    { id: "simulate", label: t.chapter_tab_sim },
    { id: "code", label: t.chapter_tab_code },
    { id: "deep-dive", label: t.chapter_tab_deep },
  ];

  const demo = DEMO_SOURCES[chapterId];

  return (
    <div className="space-y-6">
      {/* Hero 可视化 */}
      <ChapterVisualization chapterId={chapterId} />

      {/* Tabbed 内容 */}
      <Tabs tabs={tabs} defaultTab="learn">
        {(activeTab) => (
          <>
            {activeTab === "learn" && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="mb-3 text-lg font-semibold">{t.chapter_source_files}</h3>
                  <div className="space-y-1">
                    {ch.sourceFiles.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: LAYER_COLORS[ch.layer] }} />
                        <span className="font-mono text-sm text-zinc-300">src/{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">{t.chapter_total_size} {ch.sourceSize}</div>
                </div>

                <div className="card">
                  <h3 className="mb-3 text-lg font-semibold">{t.chapter_run_demo}</h3>
                  <div className="rounded-lg bg-zinc-950 p-4 font-mono text-sm">
                    <div className="text-zinc-500"># {ch.needsApiKey ? t.chapter_needs_key : t.chapter_runnable}</div>
                    <div className="text-emerald-400">$ cd Deep-Dive-Claude-Code</div>
                    <div className="text-emerald-400">$ npx tsx agents/{ch.demoFile}</div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "simulate" && (
              <AgentLoopSimulator chapterId={chapterId} />
            )}
            {activeTab === "code" && demo && (
              <SourceViewer source={demo.source} filename={demo.filename} />
            )}
            {activeTab === "code" && !demo && (
              <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                {t.chapter_code_wip}
              </div>
            )}
            {activeTab === "deep-dive" && (
              <DocRenderer version={chapterId} />
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
