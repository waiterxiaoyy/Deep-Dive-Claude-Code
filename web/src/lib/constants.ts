export const CHAPTER_ORDER = [
  "ch01","ch02","ch03","ch04","ch05","ch06",
  "ch07","ch08","ch09","ch10","ch11","ch12","ch13",
] as const;

export type ChapterId = typeof CHAPTER_ORDER[number];

export const CHAPTER_META: Record<string, {
  title: string;
  subtitle: string;
  motto: string;
  layer: "engine" | "tools" | "context" | "ecosystem" | "hidden";
  sourceFiles: string[];
  sourceSize: string;
  demoFile: string;
  needsApiKey: boolean;
  prev: string | null;
}> = {
  ch01: {
    title: "Agent 循环", subtitle: "对话循环的心脏", motto: "所有 Agent 的本质是一个循环：调用模型 → 执行工具 → 回传结果",
    layer: "engine", sourceFiles: ["QueryEngine.ts","query.ts","query/stopHooks.ts"], sourceSize: "113KB",
    demoFile: "s01_query_engine.ts", needsApiKey: true, prev: null,
  },
  ch02: {
    title: "工具系统", subtitle: "50+ 工具的注册与分发", motto: "注册一个 handler 就多一种能力，循环永远不变",
    layer: "engine", sourceFiles: ["Tool.ts","tools.ts","tools/"], sourceSize: "46KB+",
    demoFile: "s02_tool_system.ts", needsApiKey: false, prev: "ch01",
  },
  ch03: {
    title: "提示词工程", subtitle: "动态组装管线", motto: "System Prompt 不是一个字符串，而是一个动态组装的管线",
    layer: "engine", sourceFiles: ["constants/prompts.ts","utils/claudemd.ts","utils/messages.ts"], sourceSize: "287KB",
    demoFile: "s03_prompt_pipeline.ts", needsApiKey: false, prev: "ch02",
  },
  ch04: {
    title: "Shell 安全", subtitle: "300KB+ 安全验证", motto: "最强大的工具需要最严密的防护",
    layer: "tools", sourceFiles: ["BashTool/bashSecurity.ts","BashTool/bashPermissions.ts","bash/bashParser.ts"], sourceSize: "535KB",
    demoFile: "s04_bash_security.ts", needsApiKey: false, prev: "ch03",
  },
  ch05: {
    title: "权限引擎", subtitle: "每次操作都经过检查", motto: "权限不是事后添加的功能，而是架构的骨架",
    layer: "tools", sourceFiles: ["permissions/permissions.ts","permissions/filesystem.ts","fsOperations.ts"], sourceSize: "136KB",
    demoFile: "s05_permissions.ts", needsApiKey: false, prev: "ch04",
  },
  ch06: {
    title: "上下文管理", subtitle: "在有限窗口做无限的事", motto: "上下文总会满，关键是怎么压缩",
    layer: "context", sourceFiles: ["compact/compact.ts","compact/microCompact.ts","SessionMemory/","autoDream/"], sourceSize: "130KB+",
    demoFile: "s06_context_compact.ts", needsApiKey: true, prev: "ch05",
  },
  ch07: {
    title: "MCP 协议", subtitle: "统一的工具调用标准", motto: "MCP 让任何服务都能成为 AI 的工具",
    layer: "ecosystem", sourceFiles: ["mcp/client.ts","mcp/auth.ts","mcp/config.ts"], sourceSize: "253KB",
    demoFile: "s07_mcp_protocol.ts", needsApiKey: false, prev: "ch06",
  },
  ch08: {
    title: "插件生态", subtitle: "可扩展的能力边界", motto: "插件是能力的乘法器",
    layer: "ecosystem", sourceFiles: ["plugins/pluginLoader.ts","plugins/marketplaceManager.ts"], sourceSize: "199KB",
    demoFile: "s08_plugin_loader.ts", needsApiKey: false, prev: "ch07",
  },
  ch09: {
    title: "多 Agent 协作", subtitle: "Agent/Team/Swarm", motto: "规模化来自分工，不是更大的上下文",
    layer: "ecosystem", sourceFiles: ["AgentTool/AgentTool.tsx","shared/spawnMultiAgent.ts","swarm/"], sourceSize: "300KB+",
    demoFile: "s09_multi_agent.ts", needsApiKey: false, prev: "ch08",
  },
  ch10: {
    title: "CLI 传输层", subtitle: "终端到远程的桥梁", motto: "传输层决定 Agent 能在哪里运行",
    layer: "ecosystem", sourceFiles: ["cli/transports/","ink.ts","hooks/"], sourceSize: "100KB+",
    demoFile: "s10_transport.ts", needsApiKey: false, prev: "ch09",
  },
  ch11: {
    title: "启动优化", subtitle: "从回车到提示符", motto: "快速路径决定体验，完整路径决定能力",
    layer: "engine", sourceFiles: ["dev-entry.ts","entrypoints/cli.tsx","main.tsx"], sourceSize: "785KB",
    demoFile: "s11_bootstrap.ts", needsApiKey: false, prev: "ch10",
  },
  ch12: {
    title: "生产级模式", subtitle: "Demo → Production", motto: "让 Agent 可靠运行需要十倍工程量",
    layer: "engine", sourceFiles: ["sessionStorage.ts","gracefulShutdown.ts","analytics/","api/errors.ts"], sourceSize: "300KB+",
    demoFile: "s12_production.ts", needsApiKey: false, prev: "ch11",
  },
  ch13: {
    title: "隐藏功能", subtitle: "Feature Flag 门控的隐藏模块", motto: "每一行 feature('FLAG') 背后，都是一个尚未公开的产品决策",
    layer: "hidden", sourceFiles: ["buddy/","commands/ultraplan.tsx","utils/undercover.ts","entrypoints/cli.tsx"], sourceSize: "500KB+",
    demoFile: "s13_hidden_features.ts", needsApiKey: false, prev: "ch12",
  },
};

export const LAYERS = [
  { id: "engine" as const, label: "引擎内核", color: "#3B82F6", chapters: ["ch01","ch02","ch03","ch11","ch12"] },
  { id: "tools" as const, label: "工具与安全", color: "#10B981", chapters: ["ch04","ch05"] },
  { id: "context" as const, label: "上下文管理", color: "#8B5CF6", chapters: ["ch06"] },
  { id: "ecosystem" as const, label: "协议与协作", color: "#EF4444", chapters: ["ch07","ch08","ch09","ch10"] },
  { id: "hidden" as const, label: "隐藏功能", color: "#F59E0B", chapters: ["ch13"] },
] as const;

export const LAYER_COLORS: Record<string, string> = {
  engine: "#3B82F6",
  tools: "#10B981",
  context: "#8B5CF6",
  ecosystem: "#EF4444",
  hidden: "#F59E0B",
};
