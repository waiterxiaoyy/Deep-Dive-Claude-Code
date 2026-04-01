export type Locale = "zh" | "en";

/* ─── 通用 UI 文案 ─── */
export const UI_TEXT: Record<Locale, {
  // nav
  nav_home: string;
  nav_learn: string;
  nav_path: string;
  nav_arch: string;
  // header
  switch_lang_title: string;
  wiki_title: string;
  // hero
  hero_badge: string;
  hero_subtitle_1: string;
  hero_subtitle_2: string;
  hero_cta_start: string;
  hero_cta_arch: string;
  hero_cta_timeline: string;
  // agent loop section
  sec_agent_loop_tag: string;
  sec_agent_loop_title: string;
  sec_agent_loop_desc: string;
  agent_loop_footer: string;
  agent_loop_pause: string;
  agent_loop_play: string;
  // compare section
  sec_compare_tag: string;
  sec_compare_title: string;
  sec_compare_desc: string;
  compare_teaching: string;
  compare_teaching_lang: string;
  compare_teaching_comment: string;
  compare_production: string;
  compare_production_extra: string;
  // arch layers section
  sec_layers_tag: string;
  sec_layers_title: string;
  sec_layers_desc: string;
  layers_chapters_suffix: string;
  // hidden features section
  sec_hidden_tag: string;
  sec_hidden_title: string;
  sec_hidden_desc: string;
  sec_hidden_cta: string;
  // source files section
  sec_source_tag: string;
  sec_source_title: string;
  sec_source_desc: string;
  source_click_hint: string;
  // learning path section
  sec_path_tag: string;
  sec_path_title: string;
  sec_path_desc: string;
  path_filter_all: string;
  path_needs_key: string;
  path_runnable: string;
  // footer
  footer_quote: string;
  footer_quote_sub: string;
  footer_start: string;
  footer_arch: string;
  // timeline page
  timeline_breadcrumb_home: string;
  timeline_breadcrumb_current: string;
  timeline_title: string;
  timeline_desc: string;
  // architecture page
  arch_breadcrumb_home: string;
  arch_breadcrumb_current: string;
  arch_title: string;
  arch_desc: string;
  arch_data_flow_title: string;
  arch_stats_title: string;
  arch_stats_files: string;
  arch_stats_tools: string;
  arch_stats_security: string;
  arch_stats_largest: string;
  arch_source_title: string;
  arch_source_desc: string;
  arch_source_hint: string;
  arch_wiki_title: string;
  arch_wiki_desc: string;
  // chapter page
  chapter_prev: string;
  chapter_next: string;
  chapter_tab_visual: string;
  chapter_tab_sim: string;
  chapter_tab_code: string;
  chapter_tab_deep: string;
  chapter_source_files: string;
  chapter_total_size: string;
  chapter_run_demo: string;
  chapter_needs_key: string;
  chapter_runnable: string;
  chapter_code_wip: string;
  // simulator
  sim_title: string;
  sim_no_scenario: string;
  sim_start_hint: string;
}> = {
  zh: {
    nav_home: "首页",
    nav_learn: "学习",
    nav_path: "路径",
    nav_arch: "架构",
    switch_lang_title: "Switch to English",
    wiki_title: "完整源码解析 Wiki",
    hero_badge: "基于 Claude Code 源码 · 13 章交互式教学",
    hero_subtitle_1: "生产级的 Claude Code 有 960+ 个文件，50+ 集成工具，380K+ 行代码",
    hero_subtitle_2: "这 13 章带你从核心循环到工程全貌，逐层拆解。",
    hero_cta_start: "从源码开始",
    hero_cta_arch: "架构总览",
    hero_cta_timeline: "学习路径",
    sec_agent_loop_tag: "SOURCE CODE WALKTHROUGH",
    sec_agent_loop_title: "核心 Agentic Loop",
    sec_agent_loop_desc: "所有 AI Agent 的本质是一个循环。Claude Code 的核心在 QueryEngine.ts (46KB) 和 query.ts (67KB) 中实现。点击每个步骤查看对应的源码位置和实现细节。",
    agent_loop_footer: "工具结果反馈，循环继续",
    agent_loop_pause: "⏸ 暂停自动播放",
    agent_loop_play: "▶ 自动播放",
    sec_compare_tag: "WHY DEEP DIVE",
    sec_compare_title: "30 行代码到 960 个文件",
    sec_compare_desc: "教学版 Agent 的核心循环只要 30 行，但生产级的 Claude Code 在同一个循环上叠加了多少工程？",
    compare_teaching: "教学版",
    compare_teaching_lang: "~30 行 Python",
    compare_teaching_comment: "# 一个完整的 Agent 核心",
    compare_production: "生产版 Claude Code",
    compare_production_extra: "同一个循环 + 12 层工程",
    sec_layers_tag: "ARCHITECTURE LAYERS",
    sec_layers_title: "五层架构",
    sec_layers_desc: "960 个 TypeScript 文件按功能分为五个架构层。点击展开查看每层的核心文件、设计模式和对应章节。",
    layers_chapters_suffix: "章深度解析",
    sec_hidden_tag: "HIDDEN FEATURES",
    sec_hidden_title: "源码中的 8 大隐藏功能",
    sec_hidden_desc: "通过 feature('FLAG') 编译时门控，外部构建中被 DCE 移除，但源码还原中完整保留。",
    sec_hidden_cta: "深入 Ch13: 隐藏功能完整解析 →",
    sec_source_tag: "KEY SOURCE FILES",
    sec_source_title: "核心源码文件",
    sec_source_desc: "理解这些关键文件，就掌握了整个系统的脉络。文件大小反映了工程复杂度。",
    source_click_hint: "点击查看源码 →",
    sec_path_tag: "LEARNING PATH",
    sec_path_title: "13 章源码深潜",
    sec_path_desc: "每章聚焦一个核心子系统，包含源码解析 + 架构可视化 + 可运行的最小复现。按架构层过滤，或按顺序学习。",
    path_filter_all: "全部",
    path_needs_key: "🔑 需要 API Key",
    path_runnable: "▶ 可直接运行",
    footer_quote: "模型就是智能体。我们的工作就是给它工具，然后让开。",
    footer_quote_sub: "但这个\u201C让开\u201D需要 960 个文件、380,000+ 行 TypeScript 的工程能力。",
    footer_start: "开始阅读 →",
    footer_arch: "架构总览 →",
    timeline_breadcrumb_home: "首页",
    timeline_breadcrumb_current: "学习路径",
    timeline_title: "学习路径",
    timeline_desc: "13 章由浅入深，从启动流程到生产级工程",
    arch_breadcrumb_home: "首页",
    arch_breadcrumb_current: "架构总览",
    arch_title: "Claude Code 架构总览",
    arch_desc: "从顶到底的分层架构，~960 个 TypeScript 文件",
    arch_data_flow_title: "数据流",
    arch_stats_title: "代码量统计",
    arch_stats_files: "TypeScript 文件",
    arch_stats_tools: "工具数量",
    arch_stats_security: "安全代码",
    arch_stats_largest: "最大文件",
    arch_source_title: "📦 想看完整源码？",
    arch_source_desc: "本项目只摘取了核心文件用于教学分析。如果你想阅读完整的 Claude Code 源码、在本地编译并运行，请前往以下仓库：",
    arch_source_hint: "该项目支持本地 bun install + bun build 编译运行完整的 Claude Code。",
    arch_wiki_title: "📖 完整源码解析 Wiki",
    arch_wiki_desc: "想要更系统地逐文件阅读 Claude Code 源码？这里有一份完整的源码解析 Wiki，覆盖每个模块的详细注释和分析。",
    chapter_prev: "← 上一章",
    chapter_next: "下一章 →",
    chapter_tab_visual: "可视化",
    chapter_tab_sim: "模拟器",
    chapter_tab_code: "源码",
    chapter_tab_deep: "深入",
    chapter_source_files: "核心源码文件",
    chapter_total_size: "总大小约",
    chapter_run_demo: "运行演示",
    chapter_needs_key: "需要配置 API Key",
    chapter_runnable: "可直接运行",
    chapter_code_wip: "该章节的源码示例正在开发中...",
    sim_title: "Agent 循环模拟器",
    sim_no_scenario: "该章节暂无模拟场景",
    sim_start_hint: "点击 播放 或 单步 开始模拟",
  },
  en: {
    nav_home: "Home",
    nav_learn: "Learn",
    nav_path: "Path",
    nav_arch: "Arch",
    switch_lang_title: "切换为中文",
    wiki_title: "Full Source Analysis Wiki",
    hero_badge: "Based on Claude Code source · 13 interactive chapters",
    hero_subtitle_1: "Production Claude Code has 960+ files, 50+ integrated tools, 380K+ lines of code",
    hero_subtitle_2: "These 13 chapters take you from the core loop to the full engineering picture, layer by layer.",
    hero_cta_start: "Start Reading",
    hero_cta_arch: "Architecture",
    hero_cta_timeline: "Learning Path",
    sec_agent_loop_tag: "SOURCE CODE WALKTHROUGH",
    sec_agent_loop_title: "Core Agentic Loop",
    sec_agent_loop_desc: "Every AI Agent is essentially a loop. Claude Code's core is implemented in QueryEngine.ts (46KB) and query.ts (67KB). Click each step to see the corresponding source code location and implementation details.",
    agent_loop_footer: "Tool results feed back, loop continues",
    agent_loop_pause: "⏸ Pause autoplay",
    agent_loop_play: "▶ Autoplay",
    sec_compare_tag: "WHY DEEP DIVE",
    sec_compare_title: "From 30 Lines to 960 Files",
    sec_compare_desc: "A teaching Agent's core loop is just 30 lines, but how much engineering does production Claude Code stack on top of the same loop?",
    compare_teaching: "Teaching",
    compare_teaching_lang: "~30 lines Python",
    compare_teaching_comment: "# A complete Agent core",
    compare_production: "Production Claude Code",
    compare_production_extra: "Same loop + 12 layers of engineering",
    sec_layers_tag: "ARCHITECTURE LAYERS",
    sec_layers_title: "Five Architecture Layers",
    sec_layers_desc: "960 TypeScript files organized into five architecture layers. Click to expand and see core files, design patterns, and corresponding chapters.",
    layers_chapters_suffix: "chapters in depth",
    sec_hidden_tag: "HIDDEN FEATURES",
    sec_hidden_title: "8 Hidden Features in the Source Code",
    sec_hidden_desc: "Gated by compile-time feature('FLAG'), removed by DCE in external builds, but fully preserved in the restored source.",
    sec_hidden_cta: "Explore Ch13: Full Hidden Features Analysis →",
    sec_source_tag: "KEY SOURCE FILES",
    sec_source_title: "Key Source Files",
    sec_source_desc: "Understanding these key files gives you a grasp of the entire system. File size reflects engineering complexity.",
    source_click_hint: "Click to view source →",
    sec_path_tag: "LEARNING PATH",
    sec_path_title: "13 Chapters of Source Deep Dive",
    sec_path_desc: "Each chapter focuses on a core subsystem with source analysis + architecture visualization + runnable demos. Filter by architecture layer, or follow the sequence.",
    path_filter_all: "All",
    path_needs_key: "🔑 Needs API Key",
    path_runnable: "▶ Directly runnable",
    footer_quote: "The model is the agent. Our job is to give it tools and get out of the way.",
    footer_quote_sub: "But that 'getting out of the way' requires 960 files and 380,000+ lines of TypeScript engineering.",
    footer_start: "Start Reading →",
    footer_arch: "Architecture →",
    timeline_breadcrumb_home: "Home",
    timeline_breadcrumb_current: "Learning Path",
    timeline_title: "Learning Path",
    timeline_desc: "13 progressive chapters, from bootstrap to production engineering",
    arch_breadcrumb_home: "Home",
    arch_breadcrumb_current: "Architecture",
    arch_title: "Claude Code Architecture Overview",
    arch_desc: "Top-to-bottom layered architecture, ~960 TypeScript files",
    arch_data_flow_title: "Data Flow",
    arch_stats_title: "Code Statistics",
    arch_stats_files: "TypeScript Files",
    arch_stats_tools: "Tools",
    arch_stats_security: "Security Code",
    arch_stats_largest: "Largest File",
    arch_source_title: "📦 Want the full source?",
    arch_source_desc: "This project only extracts core files for teaching. If you want to read the complete Claude Code source, compile and run it locally, visit this repository:",
    arch_source_hint: "Supports local bun install + bun build to compile and run the full Claude Code.",
    arch_wiki_title: "📖 Full Source Analysis Wiki",
    arch_wiki_desc: "Want to systematically read the Claude Code source file by file? Here is a complete source analysis Wiki covering every module with detailed annotations.",
    chapter_prev: "← Previous",
    chapter_next: "Next →",
    chapter_tab_visual: "Visual",
    chapter_tab_sim: "Simulator",
    chapter_tab_code: "Source",
    chapter_tab_deep: "Deep Dive",
    chapter_source_files: "Key Source Files",
    chapter_total_size: "Total size ~",
    chapter_run_demo: "Run Demo",
    chapter_needs_key: "Requires API Key",
    chapter_runnable: "Directly runnable",
    chapter_code_wip: "Source code examples for this chapter are under development...",
    sim_title: "Agent Loop Simulator",
    sim_no_scenario: "No simulation scenario available for this chapter",
    sim_start_hint: "Click Play or Step to start simulation",
    chapter_runnable: "Directly runnable",
    chapter_code_wip: "Source code example for this chapter is under development...",
  },
};

/* ─── constants.ts 的双语标题/副标题/格言 ─── */
export const CHAPTER_META_I18N: Record<string, Record<Locale, { title: string; subtitle: string; motto: string }>> = {
  ch01: {
    zh: { title: "Agent 循环", subtitle: "对话循环的心脏", motto: "所有 Agent 的本质是一个循环：调用模型 → 执行工具 → 回传结果" },
    en: { title: "Agent Loop", subtitle: "Heart of the conversation loop", motto: "Every Agent is essentially a loop: call model → execute tool → return result" },
  },
  ch02: {
    zh: { title: "工具系统", subtitle: "50+ 工具的注册与分发", motto: "注册一个 handler 就多一种能力，循环永远不变" },
    en: { title: "Tool System", subtitle: "Registry & dispatch of 50+ tools", motto: "Register a handler, gain a capability — the loop never changes" },
  },
  ch03: {
    zh: { title: "提示词工程", subtitle: "动态组装管线", motto: "System Prompt 不是一个字符串，而是一个动态组装的管线" },
    en: { title: "Prompt Engineering", subtitle: "Dynamic assembly pipeline", motto: "System Prompt is not a string — it's a dynamically assembled pipeline" },
  },
  ch04: {
    zh: { title: "Shell 安全", subtitle: "300KB+ 安全验证", motto: "最强大的工具需要最严密的防护" },
    en: { title: "Shell Security", subtitle: "300KB+ security validation", motto: "The most powerful tool needs the tightest security" },
  },
  ch05: {
    zh: { title: "权限引擎", subtitle: "每次操作都经过检查", motto: "权限不是事后添加的功能，而是架构的骨架" },
    en: { title: "Permission Engine", subtitle: "Every operation is checked", motto: "Permissions are not an afterthought — they are the skeleton of the architecture" },
  },
  ch06: {
    zh: { title: "上下文管理", subtitle: "在有限窗口做无限的事", motto: "上下文总会满，关键是怎么压缩" },
    en: { title: "Context Management", subtitle: "Infinite work in a finite window", motto: "Context always fills up — the key is how to compress" },
  },
  ch07: {
    zh: { title: "MCP 协议", subtitle: "统一的工具调用标准", motto: "MCP 让任何服务都能成为 AI 的工具" },
    en: { title: "MCP Protocol", subtitle: "Unified tool calling standard", motto: "MCP lets any service become an AI tool" },
  },
  ch08: {
    zh: { title: "插件生态", subtitle: "可扩展的能力边界", motto: "插件是能力的乘法器" },
    en: { title: "Plugin Ecosystem", subtitle: "Extensible capability boundary", motto: "Plugins are capability multipliers" },
  },
  ch09: {
    zh: { title: "多 Agent 协作", subtitle: "Agent/Team/Swarm", motto: "规模化来自分工，不是更大的上下文" },
    en: { title: "Multi-Agent", subtitle: "Agent/Team/Swarm", motto: "Scale comes from division of labor, not larger context" },
  },
  ch10: {
    zh: { title: "CLI 传输层", subtitle: "终端到远程的桥梁", motto: "传输层决定 Agent 能在哪里运行" },
    en: { title: "CLI Transport", subtitle: "Bridge from terminal to remote", motto: "The transport layer determines where an Agent can run" },
  },
  ch11: {
    zh: { title: "启动优化", subtitle: "从回车到提示符", motto: "快速路径决定体验，完整路径决定能力" },
    en: { title: "Bootstrap", subtitle: "From Enter to prompt", motto: "Fast path determines experience, full path determines capability" },
  },
  ch12: {
    zh: { title: "生产级模式", subtitle: "Demo → Production", motto: "让 Agent 可靠运行需要十倍工程量" },
    en: { title: "Production Patterns", subtitle: "Demo → Production", motto: "Making an Agent reliable requires 10x engineering effort" },
  },
  ch13: {
    zh: { title: "隐藏功能", subtitle: "Feature Flag 门控的隐藏模块", motto: "每一行 feature('FLAG') 背后，都是一个尚未公开的产品决策" },
    en: { title: "Hidden Features", subtitle: "Feature flag-gated hidden modules", motto: "Behind every feature('FLAG') lies an unreleased product decision" },
  },
};

/* ─── 架构层双语 ─── */
export const LAYER_LABELS_I18N: Record<string, Record<Locale, string>> = {
  engine: { zh: "引擎内核", en: "Engine Core" },
  tools: { zh: "工具与安全", en: "Tools & Security" },
  context: { zh: "上下文管理", en: "Context Management" },
  ecosystem: { zh: "协议与协作", en: "Protocols & Collaboration" },
  hidden: { zh: "隐藏功能", en: "Hidden Features" },
};

/* ─── 架构层详情双语 ─── */
export const LAYER_DETAILS_I18N: Record<string, Record<Locale, { desc: string; keyPatterns: string[] }>> = {
  engine: {
    zh: {
      desc: "从 dev-entry.ts 启动，经过 CLI 快速路径分发，到 QueryEngine 的 Agentic Loop，再到 System Prompt 的动态组装管线。这是整个系统的骨架。",
      keyPatterns: ["Fast Path Dispatch", "Agentic Loop", "Parallel Prefetch", "System Prompt Pipeline"],
    },
    en: {
      desc: "Starting from dev-entry.ts, through CLI fast path dispatch, to QueryEngine's Agentic Loop, to the dynamic System Prompt assembly pipeline. This is the skeleton of the entire system.",
      keyPatterns: ["Fast Path Dispatch", "Agentic Loop", "Parallel Prefetch", "System Prompt Pipeline"],
    },
  },
  tools: {
    zh: {
      desc: "50+ 工具的统一注册与分发架构，535KB 的 Bash 安全验证，多层权限检查系统。每一次文件操作、命令执行都经过严格的安全检查。",
      keyPatterns: ["Tool Registry", "Permission Middleware", "Bash Sandboxing", "AST-level Validation"],
    },
    en: {
      desc: "Unified registry and dispatch for 50+ tools, 535KB Bash security validation, multi-layer permission check system. Every file operation and command execution undergoes strict security checks.",
      keyPatterns: ["Tool Registry", "Permission Middleware", "Bash Sandboxing", "AST-level Validation"],
    },
  },
  context: {
    zh: {
      desc: "在有限的上下文窗口中管理无限的对话。当 token 接近阈值时自动压缩，通过 SessionMemory 和 autoDream 提取关键信息。",
      keyPatterns: ["Auto Compaction", "Memory Extraction", "Token Budget", "Context Boundary"],
    },
    en: {
      desc: "Managing infinite conversations in a finite context window. Auto-compresses when tokens approach the threshold, extracting key information through SessionMemory and autoDream.",
      keyPatterns: ["Auto Compaction", "Memory Extraction", "Token Budget", "Context Boundary"],
    },
  },
  ecosystem: {
    zh: {
      desc: "通过 MCP 协议接入外部服务，热加载插件扩展能力边界，Agent/Team/Swarm 多层协作模式，SSE/WS/Hybrid 传输层。",
      keyPatterns: ["MCP Client/Server", "Plugin Marketplace", "Multi-Agent Orchestration", "Transport Abstraction"],
    },
    en: {
      desc: "External service integration via MCP protocol, hot-loaded plugins extending capability boundaries, Agent/Team/Swarm multi-layer collaboration, SSE/WS/Hybrid transport layers.",
      keyPatterns: ["MCP Client/Server", "Plugin Marketplace", "Multi-Agent Orchestration", "Transport Abstraction"],
    },
  },
  hidden: {
    zh: {
      desc: "通过 feature() 编译时门控的 30+ 隐藏功能：Buddy 电子宠物、Kairos 助手模式、Ultraplan 深度规划、Undercover 卧底模式、Daemon 守护进程、UDS 跨会话通信等。",
      keyPatterns: ["Feature Flags", "Compile-time DCE", "GrowthBook Gates", "Buddy / Kairos / Ultraplan"],
    },
    en: {
      desc: "30+ hidden features gated by compile-time feature(): Buddy virtual pet, Kairos assistant mode, Ultraplan deep planning, Undercover stealth mode, Daemon background process, UDS cross-session communication, and more.",
      keyPatterns: ["Feature Flags", "Compile-time DCE", "GrowthBook Gates", "Buddy / Kairos / Ultraplan"],
    },
  },
};

/* ─── 隐藏功能卡片双语 ─── */
export const HIDDEN_FEATURES_I18N: Record<Locale, Array<{ name: string; flag: string; desc: string; color: string; icon: string }>> = {
  zh: [
    { name: "Buddy 电子宠物", flag: "BUDDY", desc: "18 种物种 · ASCII 精灵图 · 愚人节彩蛋", color: "#F59E0B", icon: "🐾" },
    { name: "Kairos 助手模式", flag: "KAIROS", desc: "跨会话持久化 · 主动循环 · Cron 调度", color: "#8B5CF6", icon: "🧠" },
    { name: "Ultraplan 深度规划", flag: "ULTRAPLAN", desc: "Opus 模型 · 30min 远程规划 · CCR", color: "#3B82F6", icon: "📋" },
    { name: "Undercover 卧底", flag: "ant-only", desc: "开源贡献安全 · 防泄露内部代号", color: "#EF4444", icon: "🕵️" },
    { name: "Daemon 守护进程", flag: "DAEMON", desc: "Supervisor/Worker · 无头桥接", color: "#10B981", icon: "⚙️" },
    { name: "UDS 跨会话通信", flag: "UDS_INBOX", desc: "Unix Domain Socket · /peers", color: "#06B6D4", icon: "📡" },
    { name: "Voice 语音模式", flag: "VOICE_MODE", desc: "Anthropic voice_stream STT", color: "#F97316", icon: "🎙️" },
    { name: "后台会话", flag: "BG_SESSIONS", desc: "claude --bg · ps/attach/kill", color: "#A855F7", icon: "📺" },
  ],
  en: [
    { name: "Buddy Virtual Pet", flag: "BUDDY", desc: "18 species · ASCII sprites · April Fools easter egg", color: "#F59E0B", icon: "🐾" },
    { name: "Kairos Assistant", flag: "KAIROS", desc: "Cross-session persistence · Proactive loop · Cron", color: "#8B5CF6", icon: "🧠" },
    { name: "Ultraplan Planner", flag: "ULTRAPLAN", desc: "Opus model · 30min remote planning · CCR", color: "#3B82F6", icon: "📋" },
    { name: "Undercover Mode", flag: "ant-only", desc: "Open-source safety · Prevent codename leaks", color: "#EF4444", icon: "🕵️" },
    { name: "Daemon Process", flag: "DAEMON", desc: "Supervisor/Worker · Headless bridge", color: "#10B981", icon: "⚙️" },
    { name: "UDS Cross-Session", flag: "UDS_INBOX", desc: "Unix Domain Socket · /peers", color: "#06B6D4", icon: "📡" },
    { name: "Voice Mode", flag: "VOICE_MODE", desc: "Anthropic voice_stream STT", color: "#F97316", icon: "🎙️" },
    { name: "Background Sessions", flag: "BG_SESSIONS", desc: "claude --bg · ps/attach/kill", color: "#A855F7", icon: "📺" },
  ],
};

/* ─── Agent Loop 步骤双语 ─── */
export const AGENT_LOOP_STEPS_I18N: Record<Locale, Array<{ id: string; label: string; desc: string; color: string }>> = {
  zh: [
    { id: "input", label: "用户输入", desc: "用户在 REPL 中输入自然语言指令", color: "#3B82F6" },
    { id: "build", label: "构建上下文", desc: "动态组装 System Prompt + 历史消息 + 工具定义", color: "#8B5CF6" },
    { id: "call", label: "调用 Claude API", desc: "将完整消息列表发送给 Claude，等待流式响应", color: "#06B6D4" },
    { id: "check", label: "检查 stop_reason", desc: "判断模型响应：是文本输出还是工具调用请求", color: "#F59E0B" },
    { id: "execute", label: "执行工具", desc: "经过权限验证后在沙盒中安全执行工具", color: "#10B981" },
    { id: "loop", label: "循环回到 API", desc: "工具结果追加到消息后，重新发送给 Claude 继续推理", color: "#EF4444" },
  ],
  en: [
    { id: "input", label: "User Input", desc: "User enters natural language instructions in the REPL", color: "#3B82F6" },
    { id: "build", label: "Build Context", desc: "Dynamically assemble System Prompt + message history + tool definitions", color: "#8B5CF6" },
    { id: "call", label: "Call Claude API", desc: "Send the full message list to Claude and await streaming response", color: "#06B6D4" },
    { id: "check", label: "Check stop_reason", desc: "Determine response type: text output or tool call request", color: "#F59E0B" },
    { id: "execute", label: "Execute Tool", desc: "Safely execute the tool in a sandbox after permission checks", color: "#10B981" },
    { id: "loop", label: "Loop Back to API", desc: "Append tool results to messages and re-send to Claude for continued reasoning", color: "#EF4444" },
  ],
};

/* ─── 生产版对比列表双语 ─── */
export const COMPARE_ITEMS_I18N: Record<Locale, Array<{ label: string; desc: string; ch: string }>> = {
  zh: [
    { label: "流式 + 重试", desc: "AsyncGenerator 流式输出，指数退避重试，fallback 模型", ch: "Ch01" },
    { label: "50+ 工具注册", desc: "统一 Schema 验证 + 条件编译 + 超时保护", ch: "Ch02" },
    { label: "动态 Prompt", desc: "4 层管线组装，CLAUDE.md 项目配置", ch: "Ch03" },
    { label: "300KB 安全验证", desc: "Bash AST 解析 + 路径沙箱 + AI 分类器", ch: "Ch04" },
    { label: "权限引擎", desc: "allow/deny/ask 规则 + 环境变量清洗", ch: "Ch05" },
    { label: "三层压缩", desc: "微压缩 + 自动压缩 + 做梦记忆整合", ch: "Ch06" },
    { label: "MCP 协议", desc: "外部工具发现 + OAuth + 多级配置", ch: "Ch07" },
    { label: "多 Agent", desc: "Subagent / Teammate / Swarm 三层协作", ch: "Ch09" },
  ],
  en: [
    { label: "Streaming + Retry", desc: "AsyncGenerator streaming, exponential backoff, fallback models", ch: "Ch01" },
    { label: "50+ Tool Registry", desc: "Unified schema validation + conditional compilation + timeout", ch: "Ch02" },
    { label: "Dynamic Prompt", desc: "4-layer pipeline assembly, CLAUDE.md project config", ch: "Ch03" },
    { label: "300KB Security", desc: "Bash AST parsing + path sandbox + AI classifier", ch: "Ch04" },
    { label: "Permission Engine", desc: "allow/deny/ask rules + env variable sanitization", ch: "Ch05" },
    { label: "3-Layer Compaction", desc: "Micro-compact + auto-compact + dream memory consolidation", ch: "Ch06" },
    { label: "MCP Protocol", desc: "External tool discovery + OAuth + multi-level config", ch: "Ch07" },
    { label: "Multi-Agent", desc: "Subagent / Teammate / Swarm 3-tier collaboration", ch: "Ch09" },
  ],
};

/* ─── 教学版缺失项双语 ─── */
export const TEACHING_LACKS_I18N: Record<Locale, string[]> = {
  zh: ["同步 API 调用", "无权限检查", "无上下文管理", "崩溃即丢失", "单个 Agent"],
  en: ["Synchronous API calls", "No permission checks", "No context management", "Crash = data loss", "Single Agent"],
};

/* ─── 核心源码文件列表双语 ─── */
export const SOURCE_FILES_I18N: Record<Locale, Array<{ file: string; sourceId: string; size: string; desc: string; layer: string; detail: string }>> = {
  zh: [
    { file: "QueryEngine.ts", sourceId: "QueryEngine", size: "46KB", desc: "Agentic Loop 核心循环", layer: "engine", detail: "消息构建 → API 调用 → stop_reason 判断 → 工具执行 → 循环" },
    { file: "query.ts", sourceId: "query", size: "67KB", desc: "流式消息处理与重试", layer: "engine", detail: "SSE 流解析、指数退避重试、Token 计数" },
    { file: "prompts.ts", sourceId: "prompts", size: "287KB", desc: "System Prompt 动态组装", layer: "engine", detail: "工具定义注入、上下文文件合并、权限规则嵌入" },
    { file: "Tool.ts", sourceId: "Tool", size: "29KB", desc: "工具抽象接口与注册", layer: "tools", detail: "统一的 inputSchema 定义、execute 生命周期、结果格式化" },
    { file: "bashSecurity.ts", sourceId: "bashSecurity", size: "535KB", desc: "Shell 命令安全验证", layer: "tools", detail: "AST 级命令解析、危险模式检测、沙盒策略" },
    { file: "permissions.ts", sourceId: "permissions", size: "51KB", desc: "多层权限检查", layer: "tools", detail: "allow/deny 规则引擎、语义验证、交互式审批" },
    { file: "compact.ts", sourceId: "compact", size: "59KB", desc: "上下文自动压缩", layer: "context", detail: "Token 阈值检测、消息摘要、关键信息提取" },
    { file: "mcp/client.ts", sourceId: "mcp-client", size: "116KB", desc: "MCP 协议客户端", layer: "ecosystem", detail: "JSON-RPC 传输、工具发现、OAuth 认证" },
    { file: "AgentTool.tsx", sourceId: "AgentTool", size: "300KB+", desc: "多 Agent 编排", layer: "ecosystem", detail: "Agent/Team/Swarm 三种模式、上下文隔离" },
  ],
  en: [
    { file: "QueryEngine.ts", sourceId: "QueryEngine", size: "46KB", desc: "Agentic Loop core cycle", layer: "engine", detail: "Message build → API call → stop_reason check → tool exec → loop" },
    { file: "query.ts", sourceId: "query", size: "67KB", desc: "Streaming message handling & retry", layer: "engine", detail: "SSE stream parsing, exponential backoff retry, token counting" },
    { file: "prompts.ts", sourceId: "prompts", size: "287KB", desc: "System Prompt dynamic assembly", layer: "engine", detail: "Tool definition injection, context file merging, permission rule embedding" },
    { file: "Tool.ts", sourceId: "Tool", size: "29KB", desc: "Tool abstraction & registry", layer: "tools", detail: "Unified inputSchema definition, execute lifecycle, result formatting" },
    { file: "bashSecurity.ts", sourceId: "bashSecurity", size: "535KB", desc: "Shell command security validation", layer: "tools", detail: "AST-level command parsing, dangerous pattern detection, sandbox strategy" },
    { file: "permissions.ts", sourceId: "permissions", size: "51KB", desc: "Multi-layer permission checks", layer: "tools", detail: "allow/deny rule engine, semantic validation, interactive approval" },
    { file: "compact.ts", sourceId: "compact", size: "59KB", desc: "Context auto-compaction", layer: "context", detail: "Token threshold detection, message summarization, key info extraction" },
    { file: "mcp/client.ts", sourceId: "mcp-client", size: "116KB", desc: "MCP protocol client", layer: "ecosystem", detail: "JSON-RPC transport, tool discovery, OAuth authentication" },
    { file: "AgentTool.tsx", sourceId: "AgentTool", size: "300KB+", desc: "Multi-Agent orchestration", layer: "ecosystem", detail: "Agent/Team/Swarm three modes, context isolation" },
  ],
};

/* ─── 架构层名称双语（architecture page） ─── */
export const ARCH_LAYERS_I18N: Record<Locale, Array<{ name: string; files: string; size: string; color: string }>> = {
  zh: [
    { name: "CLI 入口", color: "#3B82F6", files: "cli.tsx → main.tsx", size: "~800KB" },
    { name: "查询引擎", color: "#3B82F6", files: "QueryEngine.ts + query.ts", size: "113KB" },
    { name: "Prompt 管线", color: "#3B82F6", files: "prompts.ts + claudemd.ts + messages.ts", size: "287KB" },
    { name: "工具系统", color: "#10B981", files: "50+ 工具, Tool.ts + tools.ts", size: "1MB+" },
    { name: "安全 & 权限", color: "#10B981", files: "bashSecurity + permissions/", size: "535KB" },
    { name: "上下文压缩", color: "#8B5CF6", files: "compact/ + SessionMemory/ + autoDream/", size: "130KB+" },
    { name: "MCP + 插件", color: "#EF4444", files: "mcp/ + plugins/", size: "450KB+" },
    { name: "多 Agent", color: "#EF4444", files: "AgentTool + swarm/ + teammate*", size: "300KB+" },
    { name: "传输层", color: "#EF4444", files: "transports/ + structuredIO", size: "100KB+" },
    { name: "生产工程", color: "#F59E0B", files: "sessionStorage + analytics + errors", size: "300KB+" },
    { name: "隐藏功能 (Feature Flags)", color: "#F59E0B", files: "buddy/ + ultraplan + undercover + daemon + kairos", size: "500KB+" },
  ],
  en: [
    { name: "CLI Entry", color: "#3B82F6", files: "cli.tsx → main.tsx", size: "~800KB" },
    { name: "Query Engine", color: "#3B82F6", files: "QueryEngine.ts + query.ts", size: "113KB" },
    { name: "Prompt Pipeline", color: "#3B82F6", files: "prompts.ts + claudemd.ts + messages.ts", size: "287KB" },
    { name: "Tool System", color: "#10B981", files: "50+ tools, Tool.ts + tools.ts", size: "1MB+" },
    { name: "Security & Permissions", color: "#10B981", files: "bashSecurity + permissions/", size: "535KB" },
    { name: "Context Compaction", color: "#8B5CF6", files: "compact/ + SessionMemory/ + autoDream/", size: "130KB+" },
    { name: "MCP + Plugins", color: "#EF4444", files: "mcp/ + plugins/", size: "450KB+" },
    { name: "Multi-Agent", color: "#EF4444", files: "AgentTool + swarm/ + teammate*", size: "300KB+" },
    { name: "Transport Layer", color: "#EF4444", files: "transports/ + structuredIO", size: "100KB+" },
    { name: "Production Engineering", color: "#F59E0B", files: "sessionStorage + analytics + errors", size: "300KB+" },
    { name: "Hidden Features (Feature Flags)", color: "#F59E0B", files: "buddy/ + ultraplan + undercover + daemon + kairos", size: "500KB+" },
  ],
};

/* ─── 本地化文本辅助函数 ─── */
import { LocalizedText } from "@/types/agent-data";

/**
 * 获取本地化文本
 * @param text 本地化文本对象或字符串
 * @param locale 语言（默认中文）
 * @returns 对应语言的文本
 */
export function getLocalizedText(text: LocalizedText, locale: Locale = "zh"): string {
  if (typeof text === "string") {
    return text;
  }
  return text[locale] || text.zh;
}
