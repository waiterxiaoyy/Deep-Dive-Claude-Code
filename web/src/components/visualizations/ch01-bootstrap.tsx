"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// 启动阶段节点
interface BootNode {
  id: string;
  label: string | LocalizedText;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: BootNode[] = [
  { id: "entry", label: "dev-entry.ts", x: 250, y: 30, w: 140, h: 36 },
  { id: "scan", label: { zh: "扫描缺失导入", en: "Scan Missing Imports" }, x: 250, y: 90, w: 140, h: 36 },
  { id: "cli", label: "cli.tsx", x: 250, y: 160, w: 140, h: 36 },
  { id: "fast", label: "--version", x: 80, y: 230, w: 120, h: 36 },
  { id: "main", label: "main.tsx (785KB)", x: 400, y: 230, w: 160, h: 36 },
  { id: "parallel", label: { zh: "并行预取 ×4", en: "Parallel Prefetch ×4" }, x: 400, y: 310, w: 160, h: 36 },
  { id: "feature", label: { zh: "feature() 消除", en: "feature() Elimination" }, x: 400, y: 380, w: 160, h: 36 },
  { id: "repl", label: "REPL >", x: 400, y: 450, w: 140, h: 36 },
  { id: "output", label: { zh: "输出 → 退出", en: "Output → Exit" }, x: 80, y: 310, w: 120, h: 36 },
];

const EDGES: { from: string; to: string; label?: string }[] = [
  { from: "entry", to: "scan" },
  { from: "scan", to: "cli" },
  { from: "cli", to: "fast", label: "快速路径" },
  { from: "cli", to: "main", label: "完整路径" },
  { from: "fast", to: "output" },
  { from: "main", to: "parallel" },
  { from: "parallel", to: "feature" },
  { from: "feature", to: "repl" },
];

const ACTIVE_PER_STEP: string[][] = [
  [],
  ["entry"],
  ["entry", "scan"],
  ["scan", "cli"],
  ["cli", "fast"],
  ["fast", "output"],
  ["cli", "main"],
  ["main", "parallel"],
  ["parallel", "feature"],
  ["feature", "repl"],
];

const ACTIVE_EDGES_PER_STEP: string[][] = [
  [],
  [],
  ["entry->scan"],
  ["scan->cli"],
  ["cli->fast"],
  ["fast->output"],
  ["cli->main"],
  ["main->parallel"],
  ["parallel->feature"],
  ["feature->repl"],
];

// 右侧信息面板
interface InfoBlock {
  title: LocalizedText;
  content: LocalizedText;
  color: string;
}

const INFO_PER_STEP: InfoBlock[][] = [
  [],
  [{ title: { zh: "入口文件", en: "Entry File" }, content: { zh: "dev-entry.ts — 开发模式入口点", en: "dev-entry.ts — Development mode entry point" }, color: "bg-blue-600" }],
  [{ title: { zh: "依赖检查", en: "Dependency Check" }, content: { zh: "扫描所有 import，确保 source map 还原完整", en: "Scan all imports, ensure source map restoration is complete" }, color: "bg-cyan-600" }],
  [{ title: { zh: "CLI 入口", en: "CLI Entry" }, content: { zh: "cli.tsx — 快速路径分发器\n检查 argv 是否匹配快速路径", en: "cli.tsx — Fast path dispatcher\nCheck if argv matches fast path" }, color: "bg-indigo-600" }],
  [{ title: { zh: "快速路径 #1", en: "Fast Path #1" }, content: { zh: "--version → 零模块加载\n不导入 main.tsx", en: "--version → Zero module load\nNo main.tsx import" }, color: "bg-emerald-600" }],
  [{ title: { zh: "立即退出", en: "Immediate Exit" }, content: { zh: "输出 '1.0.33' → process.exit(0)\n总耗时 < 50ms", en: "Output '1.0.33' → process.exit(0)\nTotal time < 50ms" }, color: "bg-emerald-500" }],
  [{ title: { zh: "完整启动", en: "Full Startup" }, content: { zh: "无快速路径匹配\n→ dynamic import('./main.tsx')\n→ 加载 785KB 核心", en: "No fast path match\n→ dynamic import('./main.tsx')\n→ Load 785KB core" }, color: "bg-amber-600" }],
  [
    { title: { zh: "并行预取", en: "Parallel Prefetch" }, content: { zh: "MDM 配置", en: "MDM Config" }, color: "bg-purple-600" },
    { title: { zh: "并行预取", en: "Parallel Prefetch" }, content: { zh: "Keychain 凭证", en: "Keychain Credentials" }, color: "bg-purple-500" },
    { title: { zh: "并行预取", en: "Parallel Prefetch" }, content: { zh: "GrowthBook A/B", en: "GrowthBook A/B" }, color: "bg-purple-700" },
    { title: { zh: "并行预取", en: "Parallel Prefetch" }, content: { zh: "Analytics 初始化", en: "Analytics Init" }, color: "bg-purple-800" },
  ],
  [{ title: { zh: "编译时消除", en: "Compile-time Elimination" }, content: { zh: "feature('internal') → 已移除\nfeature('beta') → 保留\n零运行时开销", en: "feature('internal') → Removed\nfeature('beta') → Preserved\nZero runtime overhead" }, color: "bg-orange-600" }],
  [{ title: { zh: "REPL 就绪", en: "REPL Ready" }, content: { zh: "> 提示符显示\n从按下回车到这里 ≈ 200ms\n启动完成!", en: "> Prompt displayed\nFrom Enter to here ≈ 200ms\nStartup complete!" }, color: "bg-green-600" }],
];

const STEP_INFO = [
  { title: { zh: "启动流程概览", en: "Startup Process Overview" }, desc: { zh: "Claude Code 从 dev-entry.ts 出发，经过快速路径分发、并行预取到 REPL 就绪", en: "Claude Code starts from dev-entry.ts, through fast path dispatch, parallel prefetch to REPL ready" } },
  { title: { zh: "开发入口", en: "Dev Entry" }, desc: { zh: "dev-entry.ts 是还原版的入口，负责检查 source map 还原是否完整", en: "dev-entry.ts is the restored entry, checks if source map restoration is complete" } },
  { title: { zh: "缺失导入扫描", en: "Missing Import Scan" }, desc: { zh: "遍历所有文件的 import 语句，统计无法解析的依赖数量", en: "Traverse all import statements, count unresolvable dependencies" } },
  { title: { zh: "CLI 分发器", en: "CLI Dispatcher" }, desc: { zh: "cli.tsx 检查 argv，--version / --dump-system-prompt 等走快速路径", en: "cli.tsx checks argv, --version / --dump-system-prompt etc. take fast path" } },
  { title: { zh: "快速路径: --version", en: "Fast Path: --version" }, desc: { zh: "匹配到 --version，不加载 main.tsx，零模块加载实现毫秒响应", en: "Match --version, no main.tsx load, zero module load for millisecond response" } },
  { title: { zh: "零加载输出", en: "Zero Load Output" }, desc: { zh: "直接输出版本号退出，避免了 785KB main.tsx 的解析和执行", en: "Direct version output and exit, avoids 785KB main.tsx parsing and execution" } },
  { title: { zh: "完整启动路径", en: "Full Startup Path" }, desc: { zh: "无快速路径匹配时，动态 import main.tsx，加载 Commander.js 参数解析", en: "When no fast path match, dynamic import main.tsx, load Commander.js argument parsing" } },
  { title: { zh: "并行预取优化", en: "Parallel Prefetch Optimization" }, desc: { zh: "4 个异步操作用 Promise.all 并行执行，不串行等待", en: "4 async operations executed in parallel with Promise.all, not sequential" } },
  { title: { zh: "编译时功能消除", en: "Compile-time Feature Elimination" }, desc: { zh: "feature() 宏在构建时决定功能开关，内部功能不进入外部构建", en: "feature() macro determines feature toggles at build time, internal features not in external builds" } },
  { title: { zh: "REPL 就绪", en: "REPL Ready" }, desc: { zh: "所有初始化完成，用户看到 > 提示符，可以开始交互", en: "All initialization complete, user sees > prompt, ready for interaction" } },
];

function getNode(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function edgePath(fromId: string, toId: string) {
  const from = getNode(fromId);
  const to = getNode(toId);
  const startX = from.x;
  const startY = from.y + from.h / 2;
  const endX = to.x;
  const endY = to.y - to.h / 2;

  if (Math.abs(startX - endX) < 10) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
  const midY = (startY + endY) / 2;
  return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
}

export default function BootstrapVisualization() {
  const { locale } = useLocale();
  const viz = useSteppedVisualization({ totalSteps: 10, autoPlayInterval: 2500 });
  const activeNodes = ACTIVE_PER_STEP[viz.currentStep];
  const activeEdges = ACTIVE_EDGES_PER_STEP[viz.currentStep];
  const infoBlocks = INFO_PER_STEP[viz.currentStep];

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "启动流程可视化" : "Bootstrap Process Visualization"}
      </h2>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* SVG 流程图 */}
          <div className="w-full lg:w-[60%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              dev-entry.ts → cli.tsx → main.tsx → REPL
            </div>
            <svg
              viewBox="0 0 580 500"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950"
              style={{ minHeight: 320 }}
            >
              <defs>
                <filter id="glow-b">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.7" />
                </filter>
                <filter id="glow-g">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.7" />
                </filter>
                <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#52525b" />
                </marker>
                <marker id="arr-a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>

              {EDGES.map((edge) => {
                const key = `${edge.from}->${edge.to}`;
                const isActive = activeEdges.includes(key);
                const d = edgePath(edge.from, edge.to);
                const labelText = edge.label ? (typeof edge.label === "string" ? edge.label : getLocalizedText(edge.label, locale)) : undefined;
                return (
                  <g key={key}>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={isActive ? "#3b82f6" : "#3f3f46"}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      markerEnd={isActive ? "url(#arr-a)" : "url(#arr)"}
                      animate={{ stroke: isActive ? "#3b82f6" : "#3f3f46", strokeWidth: isActive ? 2.5 : 1.5 }}
                      transition={{ duration: 0.4 }}
                    />
                    {labelText && (
                      <text
                        x={(getNode(edge.from).x + getNode(edge.to).x) / 2}
                        y={(getNode(edge.from).y + getNode(edge.to).y) / 2 + 10}
                        textAnchor="middle"
                        className="fill-zinc-500 text-[9px]"
                      >
                        {labelText}
                      </text>
                    )}
                  </g>
                );
              })}

              {NODES.map((node) => {
                const isActive = activeNodes.includes(node.id);
                const isGreen = node.id === "repl" || node.id === "output";
                const labelText = typeof node.label === "string" ? node.label : getLocalizedText(node.label, locale);
                return (
                  <g key={node.id}>
                    <motion.rect
                      x={node.x - node.w / 2}
                      y={node.y - node.h / 2}
                      width={node.w}
                      height={node.h}
                      rx={8}
                      fill={isActive ? (isGreen ? "#065f46" : "#1e3a5f") : "#18181b"}
                      stroke={isActive ? (isGreen ? "#10b981" : "#3b82f6") : "#3f3f46"}
                      strokeWidth={1.5}
                      filter={isActive ? (isGreen ? "url(#glow-g)" : "url(#glow-b)") : "none"}
                      animate={{
                        fill: isActive ? (isGreen ? "#065f46" : "#1e3a5f") : "#18181b",
                        stroke: isActive ? (isGreen ? "#10b981" : "#3b82f6") : "#3f3f46",
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    <motion.text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fontFamily="monospace"
                      animate={{ fill: isActive ? "#ffffff" : "#a1a1aa" }}
                      transition={{ duration: 0.4 }}
                    >
                      {labelText}
                    </motion.text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 右侧信息面板 */}
          <div className="w-full lg:w-[40%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "执行细节" : "Execution Details"}
            </div>
            <div className="min-h-[320px] space-y-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="popLayout">
                {infoBlocks.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 text-center text-xs text-zinc-600"
                  >
                    {locale === "zh" ? "点击播放查看启动流程" : "Click play to view startup process"}
                  </motion.div>
                )}
                {infoBlocks.map((block, i) => (
                  <motion.div
                    key={`${viz.currentStep}-${i}`}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35, type: "spring", bounce: 0.3, delay: i * 0.1 }}
                    className={`rounded-md px-3 py-2.5 ${block.color}`}
                  >
                    <div className="font-mono text-[11px] font-semibold text-white">
                      {getLocalizedText(block.title, locale)}
                    </div>
                    <div className="mt-1 whitespace-pre-line text-[10px] text-white/80">
                      {getLocalizedText(block.content, locale)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <StepControls
        currentStep={viz.currentStep}
        totalSteps={viz.totalSteps}
        onPrev={viz.prev}
        onNext={viz.next}
        onReset={viz.reset}
        isPlaying={viz.isPlaying}
        onToggleAutoPlay={viz.toggleAutoPlay}
        stepTitle={getLocalizedText(STEP_INFO[viz.currentStep].title, locale)}
        stepDescription={getLocalizedText(STEP_INFO[viz.currentStep].desc, locale)}
      />
    </section>
  );
}
