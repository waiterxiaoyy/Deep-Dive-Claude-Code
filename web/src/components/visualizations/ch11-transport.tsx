"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

const TRANSPORT_LAYERS = [
  { id: "stdio", label: "stdio", desc: { zh: "标准输入/输出 — 本地终端默认", en: "Standard I/O — Local terminal default" }, color: "bg-blue-500", port: "stdin/stdout" },
  { id: "sse", label: "SSE", desc: { zh: "Server-Sent Events — 单向流式", en: "Server-Sent Events — One-way streaming" }, color: "bg-emerald-500", port: "HTTP :3000" },
  { id: "ws", label: "WebSocket", desc: { zh: "双向实时通信 — 远程交互", en: "Bidirectional real-time — Remote interaction" }, color: "bg-purple-500", port: "WS :3001" },
  { id: "hybrid", label: "Hybrid", desc: { zh: "SSE + WS 混合 — 生产推荐", en: "SSE + WS hybrid — Production recommended" }, color: "bg-amber-500", port: "HTTP+WS" },
];

const DETAIL_PER_STEP: LocalizedText[] = [
  {
    zh: "CLI 传输层架构:\n\n  User Terminal\n      ↕ (Transport Layer)\n  Claude Code Engine\n\n  4 种传输协议可选",
    en: "CLI Transport Architecture:\n\n  User Terminal\n      ↕ (Transport Layer)\n  Claude Code Engine\n\n  4 transport protocols available"
  },
  {
    zh: "stdio 传输:\n  process.stdin → 解析 JSON-RPC\n  process.stdout ← 输出 JSON-RPC\n\n  优点: 零配置，本地最快\n  缺点: 无法远程",
    en: "stdio transport:\n  process.stdin → Parse JSON-RPC\n  process.stdout ← Output JSON-RPC\n\n  Pros: Zero config, fastest local\n  Cons: Cannot remote"
  },
  {
    zh: "SSE 传输:\n  GET /events → 建立 SSE 连接\n  POST /message → 发送用户消息\n\n  优点: HTTP 友好，穿透防火墙\n  缺点: 单向流，需要额外 POST",
    en: "SSE transport:\n  GET /events → Establish SSE connection\n  POST /message → Send user message\n\n  Pros: HTTP-friendly, firewall bypass\n  Cons: One-way stream, requires extra POST"
  },
  {
    zh: "WebSocket 传输:\n  ws://localhost:3001\n  ↕ 双向实时通信\n\n  优点: 低延迟，真双向\n  缺点: 需要保持连接",
    en: "WebSocket transport:\n  ws://localhost:3001\n  ↕ Bidirectional real-time\n\n  Pros: Low latency, true bidirectional\n  Cons: Requires persistent connection"
  },
  {
    zh: "Hybrid 传输:\n  SSE: 引擎 → 客户端 (流式输出)\n  WS:  客户端 → 引擎 (用户输入)\n\n  结合 SSE 可靠性 + WS 实时性\n  生产环境推荐",
    en: "Hybrid transport:\n  SSE: Engine → Client (streaming output)\n  WS:  Client → Engine (user input)\n\n  Combines SSE reliability + WS real-time\n  Recommended for production"
  },
  {
    zh: "结构化 IO (SDK 模式):\n\n  输入: { type: 'user_message', content: '...' }\n  输出: [\n    { type: 'text', content: '...' },\n    { type: 'tool_use', name: '...', input: {} },\n    { type: 'tool_result', content: '...' },\n  ]\n\n  → JSON 格式，机器可解析",
    en: "Structured IO (SDK mode):\n\n  Input: { type: 'user_message', content: '...' }\n  Output: [\n    { type: 'text', content: '...' },\n    { type: 'tool_use', name: '...', input: {} },\n    { type: 'tool_result', content: '...' },\n  ]\n\n  → JSON format, machine parsable"
  },
  {
    zh: "React Ink 终端 UI:\n\n  <Box flexDirection='column'>\n    <MessageList messages={msgs} />\n    <ToolStatus active={tool} />\n    <InputBox onSubmit={send} />\n  </Box>\n\n  终端中使用 React 组件渲染!\n  108 个 hooks 管理状态",
    en: "React Ink Terminal UI:\n\n  <Box flexDirection='column'>\n    <MessageList messages={msgs} />\n    <ToolStatus active={tool} />\n    <InputBox onSubmit={send} />\n  </Box>\n\n  Render React components in terminal!\n  108 hooks manage state"
  },
];

const STEP_INFO = [
  { title: { zh: "CLI 传输层概览", en: "CLI Transport Layer Overview" }, desc: { zh: "4 种传输协议支持本地终端到远程会话的所有场景", en: "4 transport protocols support all scenarios from local terminal to remote sessions" } },
  { title: { zh: "stdio — 本地默认", en: "stdio — Local Default" }, desc: { zh: "标准输入/输出，零配置，本地终端最快的方式", en: "Standard I/O, zero config, fastest way for local terminal" } },
  { title: { zh: "SSE — HTTP 流式", en: "SSE — HTTP Streaming" }, desc: { zh: "Server-Sent Events，单向流式输出，HTTP 友好", en: "Server-Sent Events, one-way streaming output, HTTP-friendly" } },
  { title: { zh: "WebSocket — 双向实时", en: "WebSocket — Bidirectional Real-time" }, desc: { zh: "全双工通信，低延迟，适合交互密集场景", en: "Full-duplex communication, low latency, ideal for interaction-intensive scenarios" } },
  { title: { zh: "Hybrid — 生产推荐", en: "Hybrid — Production Recommended" }, desc: { zh: "SSE + WS 混合模式，兼顾可靠性和实时性", en: "SSE + WS hybrid mode, balancing reliability and real-time" } },
  { title: { zh: "结构化 IO", en: "Structured IO" }, desc: { zh: "SDK 模式下输出 JSON 格式，便于程序解析和集成", en: "Output JSON format in SDK mode, easy for program parsing and integration" } },
  { title: { zh: "React Ink", en: "React Ink" }, desc: { zh: "终端 UI 使用 React 组件渲染，108 个 hooks 管理状态", en: "Terminal UI rendered with React components, 108 hooks manage state" } },
];

export default function TransportVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 7, autoPlayInterval: 3000 });
  const { locale } = useLocale();

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "CLI 传输层" : "CLI Transport Layer"}
      </h2>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[40%]">
            <div className="mb-3 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "传输协议" : "Transport Protocols"}
            </div>
            <div className="space-y-2">
              {TRANSPORT_LAYERS.map((t, i) => {
                const isActive = i + 1 === viz.currentStep || (viz.currentStep === 4 && i === 3);
                return (
                  <motion.div
                    key={t.id}
                    animate={{ borderColor: isActive ? "#3b82f6" : "#27272a", scale: isActive ? 1.02 : 1 }}
                    className={`rounded-lg border p-3 ${isActive ? "bg-blue-950/30 border-blue-700" : "bg-zinc-950 border-zinc-800"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                        <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-zinc-500"}`}>{t.label}</span>
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500">{t.port}</span>
                    </div>
                    <p className={`text-xs ${isActive ? "text-zinc-300" : "text-zinc-600"}`}>{getLocalizedText(t.desc, locale)}</p>
                  </motion.div>
                );
              })}

              {/* 额外模块 */}
              {viz.currentStep >= 5 && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-2 mt-4">
                  {[
                    { label: "Structured IO", desc: { zh: "JSON 格式输入输出", en: "JSON format I/O" }, active: viz.currentStep === 5 },
                    { label: "React Ink", desc: { zh: "终端 React 渲染", en: "Terminal React rendering" }, active: viz.currentStep === 6 },
                  ].map((m) => (
                    <motion.div key={m.label}
                      animate={{ borderColor: m.active ? "#f59e0b" : "#27272a" }}
                      className={`rounded-lg border p-3 ${m.active ? "bg-amber-950/30 border-amber-700" : "bg-zinc-950 border-zinc-800"}`}
                    >
                      <span className={`text-sm font-semibold ${m.active ? "text-white" : "text-zinc-500"}`}>{m.label}</span>
                      <p className={`text-xs mt-0.5 ${m.active ? "text-zinc-300" : "text-zinc-600"}`}>
                        {getLocalizedText(m.desc, locale)}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[60%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "协议细节" : "Protocol Details"}
            </div>
            <div className="min-h-[380px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <motion.pre key={viz.currentStep} initial={{opacity:0}} animate={{opacity:1}}
                className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">
                {getLocalizedText(DETAIL_PER_STEP[viz.currentStep]!, locale)}
              </motion.pre>
            </div>
          </div>
        </div>
      </div>
      <StepControls currentStep={viz.currentStep} totalSteps={viz.totalSteps}
        onPrev={viz.prev} onNext={viz.next} onReset={viz.reset}
        isPlaying={viz.isPlaying} onToggleAutoPlay={viz.toggleAutoPlay}
        stepTitle={getLocalizedText(STEP_INFO[viz.currentStep].title, locale)}
        stepDescription={getLocalizedText(STEP_INFO[viz.currentStep].desc, locale)} />
    </section>
  );
}
