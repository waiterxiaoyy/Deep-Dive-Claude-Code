"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { CHAPTER_ORDER, CHAPTER_META, LAYERS, LAYER_COLORS } from "@/lib/constants";

/* ─── 常量 ─── */
const LAYER_BG: Record<string, string> = {
  engine: "border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/10",
  tools: "border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/10",
  context: "border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/10",
  ecosystem: "border-red-500/30 hover:border-red-500/60 hover:shadow-red-500/10",
  hidden: "border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-yellow-500/10",
};

const LAYER_DOT: Record<string, string> = {
  engine: "bg-blue-500",
  tools: "bg-emerald-500",
  context: "bg-purple-500",
  ecosystem: "bg-red-500",
  hidden: "bg-yellow-500",
};

const LAYER_GLOW: Record<string, string> = {
  engine: "from-blue-500/20 to-transparent",
  tools: "from-emerald-500/20 to-transparent",
  context: "from-purple-500/20 to-transparent",
  ecosystem: "from-red-500/20 to-transparent",
  hidden: "from-yellow-500/20 to-transparent",
};

/* ─── 统计数据 ─── */

/* ─── Agent Loop 步骤 ─── */
const AGENT_LOOP_STEPS = [
  {
    id: "input",
    label: "用户输入",
    desc: "用户在 REPL 中输入自然语言指令",
    code: `// src/entrypoints/cli.tsx
const userInput = await readline()
messages.push({ role: "user", content: userInput })`,
    color: "#3B82F6",
  },
  {
    id: "build",
    label: "构建上下文",
    desc: "动态组装 System Prompt + 历史消息 + 工具定义",
    code: `// src/QueryEngine.ts → buildSystemPrompt()
const systemPrompt = assembleSystemPrompt({
  toolDefinitions,    // 50+ 工具的 JSON Schema
  contextFiles,       // .claude/settings.json + CLAUDE.md
  permissionRules,    // 安全策略
})`,
    color: "#8B5CF6",
  },
  {
    id: "call",
    label: "调用 Claude API",
    desc: "将完整消息列表发送给 Claude，等待流式响应",
    code: `// src/query.ts → streamMessages()
const stream = await client.messages.create({
  model: mainLoopModel,
  system: systemPrompt,
  messages: normalizeMessages(history),
  tools: toolDefinitions,
  stream: true,
})`,
    color: "#06B6D4",
  },
  {
    id: "check",
    label: "检查 stop_reason",
    desc: "判断模型响应：是文本输出还是工具调用请求",
    code: `// src/QueryEngine.ts → processResponse()
if (response.stop_reason === "tool_use") {
  // → 进入工具执行分支
  for (const block of response.content) {
    if (block.type === "tool_use") {
      await executeWithPermissions(block)
    }
  }
} else {
  // → 返回文本结果给用户
  return response.content
}`,
    color: "#F59E0B",
  },
  {
    id: "execute",
    label: "执行工具",
    desc: "经过权限验证后在沙盒中安全执行工具",
    code: `// src/Tool.ts → executeTool()
// 1. 权限检查 (permissions.ts - 51KB)
const allowed = await checkPermission(tool, args)
// 2. 安全验证 (bashSecurity.ts - 535KB)
const validated = await validateSecurity(command)
// 3. 沙盒执行
const result = await tool.execute(context)
// 4. 将结果追加到消息历史
messages.push({ role: "tool", content: result })`,
    color: "#10B981",
  },
  {
    id: "loop",
    label: "循环回到 API",
    desc: "工具结果追加到消息后，重新发送给 Claude 继续推理",
    code: `// src/QueryEngine.ts → agenticLoop()
// 工具结果已追加到 messages[]
// 自动检查上下文窗口是否将满
if (tokenCount > threshold) {
  await compactMessages()  // compact.ts - 59KB
}
continue  // → 回到步骤 2: 构建上下文`,
    color: "#EF4444",
  },
];

/* ─── 架构层详细描述 ─── */
const LAYER_DETAILS: Record<string, { desc: string; keyFiles: string[]; keyPatterns: string[] }> = {
  engine: {
    desc: "从 dev-entry.ts 启动，经过 CLI 快速路径分发，到 QueryEngine 的 Agentic Loop，再到 System Prompt 的动态组装管线。这是整个系统的骨架。",
    keyFiles: ["dev-entry.ts", "cli.tsx", "main.tsx", "QueryEngine.ts", "query.ts", "prompts.ts"],
    keyPatterns: ["Fast Path Dispatch", "Agentic Loop", "Parallel Prefetch", "System Prompt Pipeline"],
  },
  tools: {
    desc: "50+ 工具的统一注册与分发架构，535KB 的 Bash 安全验证，多层权限检查系统。每一次文件操作、命令执行都经过严格的安全检查。",
    keyFiles: ["Tool.ts", "tools.ts", "BashTool/", "permissions.ts", "filesystem.ts"],
    keyPatterns: ["Tool Registry", "Permission Middleware", "Bash Sandboxing", "AST-level Validation"],
  },
  context: {
    desc: "在有限的上下文窗口中管理无限的对话。当 token 接近阈值时自动压缩，通过 SessionMemory 和 autoDream 提取关键信息。",
    keyFiles: ["compact.ts", "microCompact.ts", "SessionMemory/", "autoDream/"],
    keyPatterns: ["Auto Compaction", "Memory Extraction", "Token Budget", "Context Boundary"],
  },
  ecosystem: {
    desc: "通过 MCP 协议接入外部服务，热加载插件扩展能力边界，Agent/Team/Swarm 多层协作模式，SSE/WS/Hybrid 传输层。",
    keyFiles: ["mcp/client.ts", "pluginLoader.ts", "AgentTool.tsx", "transports/"],
    keyPatterns: ["MCP Client/Server", "Plugin Marketplace", "Multi-Agent Orchestration", "Transport Abstraction"],
  },
  hidden: {
    desc: "通过 feature() 编译时门控的 30+ 隐藏功能：Buddy 电子宠物、Kairos 助手模式、Ultraplan 深度规划、Undercover 卧底模式、Daemon 守护进程、UDS 跨会话通信等。",
    keyFiles: ["buddy/", "commands/ultraplan.tsx", "utils/undercover.ts", "entrypoints/cli.tsx", "utils/cronScheduler.ts"],
    keyPatterns: ["Feature Flags", "Compile-time DCE", "GrowthBook Gates", "Buddy / Kairos / Ultraplan"],
  },
};

/* ─── 子组件: 打字机效果 ─── */
function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setDone(false);
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse text-blue-400">|</span>}
    </span>
  );
}

/* ─── 子组件: 计数动画 ─── */
function AnimatedStat({ value, label, icon, delay }: { value: string; label: string; icon: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-2"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-bold text-white sm:text-3xl">{value}</span>
      <span className="text-sm text-zinc-500">{label}</span>
    </motion.div>
  );
}

/* ─── 子组件: 交互式 Agent Loop ─── */
function InteractiveAgentLoop() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % AGENT_LOOP_STEPS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const current = AGENT_LOOP_STEPS[activeStep];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* 左侧: 步骤导航 */}
      <div className="flex flex-col gap-1">
        {AGENT_LOOP_STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => { setActiveStep(i); setIsAutoPlaying(false); }}
            className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${i === activeStep
              ? "bg-zinc-800/80 shadow-lg"
              : "hover:bg-zinc-800/40"
              }`}
          >
            {/* 连接线 */}
            {i < AGENT_LOOP_STEPS.length - 1 && (
              <div className="absolute left-[27px] top-full z-0 h-1 w-px bg-zinc-700" />
            )}
            {/* 序号圆点 */}
            <div
              className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: i === activeStep ? step.color : "transparent",
                border: `2px solid ${i === activeStep ? step.color : "#3f3f46"}`,
                color: i === activeStep ? "#fff" : "#71717a",
              }}
            >
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-medium transition-colors ${i === activeStep ? "text-white" : "text-zinc-400"
                }`}>
                {step.label}
              </div>
            </div>
            {/* 活跃指示器 */}
            {i === activeStep && (
              <motion.div
                layoutId="activeStep"
                className="absolute inset-0 rounded-lg border"
                style={{ borderColor: `${step.color}40` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
        {/* 循环箭头 */}
        <div className="mt-1 flex items-center gap-2 px-4 text-xs text-zinc-600">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-600">
            <path d="M2 8a6 6 0 0 1 10.89-3.48M14 8a6 6 0 0 1-10.89 3.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M13.5 1v3.5H10M2.5 15v-3.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>工具结果反馈，循环继续</span>
        </div>
        {/* 播放控制 */}
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="mt-2 mx-4 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {isAutoPlaying ? "⏸ 暂停自动播放" : "▶ 自动播放"}
        </button>
      </div>

      {/* 右侧: 详情面板 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: current.color }}
            >
              {activeStep + 1}
            </div>
            <h4 className="text-lg font-semibold text-white">{current.label}</h4>
          </div>
          <p className="mb-4 text-sm text-zinc-400">{current.desc}</p>
          <div className="flex-1 overflow-auto rounded-lg bg-black/50 p-4 font-mono text-xs leading-relaxed">
            <pre className="text-zinc-300">
              {current.code.split("\n").map((line, i) => (
                <div key={i} className={line.startsWith("//") ? "text-zinc-600" : ""}>
                  {line}
                </div>
              ))}
            </pre>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── 子组件: 架构层卡片(可展开) ─── */
function ExpandableLayerCard({ layer, index }: { layer: typeof LAYERS[number]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const detail = LAYER_DETAILS[layer.id];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group card cursor-pointer border transition-all duration-300 hover:shadow-xl ${expanded ? "col-span-1 sm:col-span-2" : ""
        }`}
      style={{
        borderColor: expanded ? `${layer.color}60` : undefined,
        boxShadow: expanded ? `0 0 30px ${layer.color}15` : undefined,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: `${layer.color}25`, color: layer.color }}
          >
            L{index + 1}
          </div>
          <div>
            <div className="font-semibold text-white">{layer.label}</div>
            <div className="text-xs text-zinc-500">{layer.chapters.length} 章深度解析</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-500"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-sm leading-relaxed text-zinc-400">{detail.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.keyFiles.map((f) => (
                  <span key={f} className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.keyPatterns.map((p) => (
                  <span
                    key={p}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${layer.color}15`, color: layer.color }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {layer.chapters.map((chId) => (
                  <Link
                    key={chId}
                    href={`/chapter/${chId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 no-underline transition hover:border-zinc-500 hover:text-white"
                  >
                    {CHAPTER_META[chId]?.title} →
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── 子组件: 过滤器 Tab ─── */
function LayerFilterTabs({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${active === null
          ? "bg-white text-zinc-900"
          : "border border-zinc-700 text-zinc-400 hover:text-white"
          }`}
      >
        全部
      </button>
      {LAYERS.map((layer) => (
        <button
          key={layer.id}
          onClick={() => onChange(layer.id)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${active === layer.id
            ? "text-white"
            : "border border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          style={
            active === layer.id
              ? { backgroundColor: layer.color }
              : {}
          }
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   主页面
   ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [layerFilter, setLayerFilter] = useState<string | null>(null);

  const filteredChapters = layerFilter
    ? CHAPTER_ORDER.filter((id) => CHAPTER_META[id].layer === layerFilter)
    : CHAPTER_ORDER;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">

      {/* ── Hero Section ── */}
      <section className="relative flex flex-col items-center overflow-hidden pt-16 pb-20 text-center">
        {/* 背景光晕 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-80 w-[800px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -top-20 left-1/3 h-60 w-[600px] -translate-x-1/2 rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            基于 Claude Code 源码 · 13 章交互式教学
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              Deep Dive
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Claude Code
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            生产级的 Claude Code 有 960+ 个文件，50+ 集成工具，380K+ 行代码
            <br />
            这 13 章带你从核心循环到工程全貌，逐层拆解。
          </p>
        </motion.div>


        {/* CTA 按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative mt-10 flex gap-4"
        >
          <Link
            href="/chapter/ch01"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-zinc-900 no-underline shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:bg-zinc-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
          >
            从源码开始
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M4 9h10m0 0L10.5 5.5M14 9l-3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/80 px-8 py-4 text-base font-semibold text-zinc-200 no-underline transition hover:border-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            架构总览
          </Link>
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/80 px-8 py-4 text-base font-semibold text-zinc-200 no-underline transition hover:border-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            学习路径
          </Link>
        </motion.div>
      </section>

      {/* ── Section: 核心 Agentic Loop —— 交互式 ── */}
      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 text-sm font-medium text-blue-400">SOURCE CODE WALKTHROUGH</div>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">核心 Agentic Loop</h2>
          <p className="mb-8 max-w-2xl text-sm text-zinc-500">
            所有 AI Agent 的本质是一个循环。Claude Code 的核心在{" "}
            <code className="font-mono text-zinc-400">QueryEngine.ts</code> (46KB) 和{" "}
            <code className="font-mono text-zinc-400">query.ts</code> (67KB) 中实现。
            点击每个步骤查看对应的源码位置和实现细节。
          </p>
        </motion.div>
        <InteractiveAgentLoop />
      </section>

      {/* ── Section: 教学版 vs 生产版对比 ── */}
      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 text-sm font-medium text-purple-400">WHY DEEP DIVE</div>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">30 行代码到 960 个文件</h2>
          <p className="mb-8 max-w-2xl text-sm text-zinc-500">
            教学版 Agent 的核心循环只要 30 行，但生产级的 Claude Code 在同一个循环上叠加了多少工程？
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 教学版 */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">教学版</span>
              <span className="text-xs text-zinc-500">~30 行 Python</span>
            </div>
            <div className="space-y-2 font-mono text-xs leading-relaxed">
              <div className="rounded-lg bg-black/40 p-3">
                <div className="text-zinc-500">{"# 一个完整的 Agent 核心"}</div>
                <div><span className="text-blue-400">while</span> <span className="text-zinc-300">True:</span></div>
                <div className="pl-4"><span className="text-zinc-300">response = llm.call(messages)</span></div>
                <div className="pl-4"><span className="text-blue-400">if</span> <span className="text-zinc-300">response.stop_reason != </span><span className="text-emerald-400">{'"tool_use"'}</span><span className="text-zinc-300">:</span></div>
                <div className="pl-8"><span className="text-blue-400">break</span></div>
                <div className="pl-4"><span className="text-zinc-300">result = execute(response.tool)</span></div>
                <div className="pl-4"><span className="text-zinc-300">messages.append(result)</span></div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {["同步 API 调用", "无权限检查", "无上下文管理", "崩溃即丢失", "单个 Agent"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="text-zinc-600">—</span> {item}
                </div>
              ))}
            </div>
          </div>

          {/* 生产版 */}
          <div className="rounded-xl border border-blue-500/20 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">生产版 Claude Code</span>
              <span className="text-xs text-zinc-500">同一个循环 + 12 层工程</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "流式 + 重试", desc: "AsyncGenerator 流式输出，指数退避重试，fallback 模型", ch: "Ch01" },
                { label: "50+ 工具注册", desc: "统一 Schema 验证 + 条件编译 + 超时保护", ch: "Ch02" },
                { label: "动态 Prompt", desc: "4 层管线组装，CLAUDE.md 项目配置", ch: "Ch03" },
                { label: "300KB 安全验证", desc: "Bash AST 解析 + 路径沙箱 + AI 分类器", ch: "Ch04" },
                { label: "权限引擎", desc: "allow/deny/ask 规则 + 环境变量清洗", ch: "Ch05" },
                { label: "三层压缩", desc: "微压缩 + 自动压缩 + 做梦记忆整合", ch: "Ch06" },
                { label: "MCP 协议", desc: "外部工具发现 + OAuth + 多级配置", ch: "Ch07" },
                { label: "多 Agent", desc: "Subagent / Teammate / Swarm 三层协作", ch: "Ch09" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 rounded-lg bg-black/20 px-3 py-2"
                >
                  <span className="mt-0.5 shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
                    {item.ch}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200">{item.label}</div>
                    <div className="text-[11px] text-zinc-500">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: 四层架构 ── */}
      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 text-sm font-medium text-emerald-400">ARCHITECTURE LAYERS</div>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">四层架构</h2>
          <p className="mb-8 max-w-2xl text-sm text-zinc-500">
            960 个 TypeScript 文件按功能分为四个架构层。点击展开查看每层的核心文件、设计模式和对应章节。
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LAYERS.map((layer, i) => (
            <ExpandableLayerCard key={layer.id} layer={layer} index={i} />
          ))}
        </div>
      </section>

      {/* ── Section: 隐藏功能 ── */}
      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 text-sm font-medium text-yellow-400">HIDDEN FEATURES</div>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">源码中的 8 大隐藏功能</h2>
          <p className="mb-8 max-w-2xl text-sm text-zinc-500">
            通过 <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-yellow-400/80 font-mono text-xs">feature(&apos;FLAG&apos;)</code> 编译时门控，
            外部构建中被 DCE 移除，但源码还原中完整保留。
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: "Buddy 电子宠物", flag: "BUDDY", desc: "18 种物种 · ASCII 精灵图 · 愚人节彩蛋", color: "#F59E0B", icon: "🐾" },
            { name: "Kairos 助手模式", flag: "KAIROS", desc: "跨会话持久化 · 主动循环 · Cron 调度", color: "#8B5CF6", icon: "🧠" },
            { name: "Ultraplan 深度规划", flag: "ULTRAPLAN", desc: "Opus 模型 · 30min 远程规划 · CCR", color: "#3B82F6", icon: "📋" },
            { name: "Undercover 卧底", flag: "ant-only", desc: "开源贡献安全 · 防泄露内部代号", color: "#EF4444", icon: "🕵️" },
            { name: "Daemon 守护进程", flag: "DAEMON", desc: "Supervisor/Worker · 无头桥接", color: "#10B981", icon: "⚙️" },
            { name: "UDS 跨会话通信", flag: "UDS_INBOX", desc: "Unix Domain Socket · /peers", color: "#06B6D4", icon: "📡" },
            { name: "Voice 语音模式", flag: "VOICE_MODE", desc: "Anthropic voice_stream STT", color: "#F97316", icon: "🎙️" },
            { name: "后台会话", flag: "BG_SESSIONS", desc: "claude --bg · ps/attach/kill", color: "#A855F7", icon: "📺" },
          ].map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href="/chapter/ch13"
                className="group block rounded-xl border border-yellow-500/10 bg-zinc-900/50 p-3 no-underline transition-all hover:border-yellow-500/30 hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-yellow-400 transition-colors">{item.name}</span>
                </div>
                <div className="mb-1 font-mono text-[10px] text-yellow-500/60">{item.flag}</div>
                <div className="text-[10px] text-zinc-500 leading-relaxed">{item.desc}</div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/chapter/ch13"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 no-underline transition hover:bg-yellow-500/20"
          >
            深入 Ch13: 隐藏功能完整解析 →
          </Link>
        </div>
      </section>

      {/* ── Section: 核心源码文件速查 ── */}
      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 text-sm font-medium text-cyan-400">KEY SOURCE FILES</div>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">核心源码文件</h2>
          <p className="mb-8 max-w-2xl text-sm text-zinc-500">
            理解这些关键文件，就掌握了整个系统的脉络。文件大小反映了工程复杂度。
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { file: "QueryEngine.ts", sourceId: "QueryEngine", size: "46KB", desc: "Agentic Loop 核心循环", layer: "engine", detail: "消息构建 → API 调用 → stop_reason 判断 → 工具执行 → 循环" },
            { file: "query.ts", sourceId: "query", size: "67KB", desc: "流式消息处理与重试", layer: "engine", detail: "SSE 流解析、指数退避重试、Token 计数" },
            { file: "prompts.ts", sourceId: "prompts", size: "287KB", desc: "System Prompt 动态组装", layer: "engine", detail: "工具定义注入、上下文文件合并、权限规则嵌入" },
            { file: "Tool.ts", sourceId: "Tool", size: "29KB", desc: "工具抽象接口与注册", layer: "tools", detail: "统一的 inputSchema 定义、execute 生命周期、结果格式化" },
            { file: "bashSecurity.ts", sourceId: "bashSecurity", size: "535KB", desc: "Shell 命令安全验证", layer: "tools", detail: "AST 级命令解析、危险模式检测、沙盒策略" },
            { file: "permissions.ts", sourceId: "permissions", size: "51KB", desc: "多层权限检查", layer: "tools", detail: "allow/deny 规则引擎、语义验证、交互式审批" },
            { file: "compact.ts", sourceId: "compact", size: "59KB", desc: "上下文自动压缩", layer: "context", detail: "Token 阈值检测、消息摘要、关键信息提取" },
            { file: "mcp/client.ts", sourceId: "mcp-client", size: "116KB", desc: "MCP 协议客户端", layer: "ecosystem", detail: "JSON-RPC 传输、工具发现、OAuth 认证" },
            { file: "AgentTool.tsx", sourceId: "AgentTool", size: "300KB+", desc: "多 Agent 编排", layer: "ecosystem", detail: "Agent/Team/Swarm 三种模式、上下文隔离" },
          ].map((item, i) => (
            <motion.div
              key={item.file}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={`/source/${item.sourceId}`}
                className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 no-underline transition-all hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                <div className="flex items-center justify-between">
                  <code className="font-mono text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{item.file}</code>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${LAYER_COLORS[item.layer]}20`,
                      color: LAYER_COLORS[item.layer],
                    }}
                  >
                    {item.size}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-zinc-400">{item.desc}</p>
                <p className="mt-1 text-xs text-zinc-600">{item.detail}</p>
                <div className="mt-2 text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  点击查看源码 →
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section: 章节学习路径 ── */}
      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 text-sm font-medium text-amber-400">LEARNING PATH</div>
          <h2 className="mb-2 text-2xl font-bold sm:text-3xl">13 章源码深潜</h2>
          <p className="mb-6 max-w-2xl text-sm text-zinc-500">
            每章聚焦一个核心子系统，包含源码解析 + 架构可视化 + 可运行的最小复现。
            按架构层过滤，或按顺序学习。
          </p>
        </motion.div>

        <div className="mb-6">
          <LayerFilterTabs active={layerFilter} onChange={setLayerFilter} />
        </div>

        <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredChapters.map((id) => {
              const i = CHAPTER_ORDER.indexOf(id);
              const ch = CHAPTER_META[id];
              const layerColor = LAYER_COLORS[ch.layer];
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    href={`/chapter/${id}`}
                    className={`card border ${LAYER_BG[ch.layer]} group flex flex-col no-underline shadow-lg transition-all hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{ backgroundColor: `${layerColor}15`, color: layerColor }}
                      >
                        Ch{String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: layerColor }}
                      />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-zinc-200 group-hover:text-white">
                      {ch.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">{ch.subtitle}</p>
                    <p className="mt-3 border-l-2 pl-3 text-xs italic text-zinc-600" style={{ borderColor: `${layerColor}40` }}>
                      &ldquo;{ch.motto}&rdquo;
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M2 7h10M2 10.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        {ch.sourceSize}
                      </span>
                      <span className={ch.needsApiKey ? "text-amber-500/60" : "text-emerald-500/60"}>
                        {ch.needsApiKey ? "🔑 需要 API Key" : "▶ 可直接运行"}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 pt-8 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm text-zinc-600 italic">
            &ldquo;模型就是智能体。我们的工作就是给它工具，然后让开。&rdquo;
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            但这个&ldquo;让开&rdquo;需要{" "}
            <span className="font-mono text-zinc-400">960 个文件</span>、
            <span className="font-mono text-zinc-400">380,000+ 行 TypeScript</span> 的工程能力。
          </p>
          <div className="mt-6 flex items-center justify-center gap-6">
            <Link href="/chapter/ch01" className="text-sm text-zinc-400 no-underline hover:text-white transition">
              开始阅读 →
            </Link>
            <Link href="/architecture" className="text-sm text-zinc-400 no-underline hover:text-white transition">
              架构总览 →
            </Link>
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 no-underline hover:text-white transition"
            >
              GitHub →
            </a>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
