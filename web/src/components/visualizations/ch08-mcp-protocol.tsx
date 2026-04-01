"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

interface MCPServer { name: string; tools: string[]; status: "connecting" | "ready" | "error"; }

const SERVERS_PER_STEP: MCPServer[][] = [
  [],
  [{ name: "filesystem", tools: [], status: "connecting" }],
  [{ name: "filesystem", tools: ["readFile", "writeFile", "listDir"], status: "ready" }],
  [
    { name: "filesystem", tools: ["readFile", "writeFile", "listDir"], status: "ready" },
    { name: "github", tools: [], status: "connecting" },
  ],
  [
    { name: "filesystem", tools: ["readFile", "writeFile", "listDir"], status: "ready" },
    { name: "github", tools: ["createPR", "listIssues", "getRepo"], status: "ready" },
  ],
  [
    { name: "filesystem", tools: ["readFile", "writeFile", "listDir"], status: "ready" },
    { name: "github", tools: ["createPR", "listIssues", "getRepo"], status: "ready" },
    { name: "database", tools: ["query", "schema"], status: "ready" },
  ],
  [
    { name: "filesystem", tools: ["readFile", "writeFile", "listDir"], status: "ready" },
    { name: "github", tools: ["createPR", "listIssues", "getRepo"], status: "ready" },
    { name: "database", tools: ["query", "schema"], status: "ready" },
  ],
];

const PROTOCOL_STEPS = [
  "",
  "→ initialize { capabilities }",
  "← tools/list\n→ [\n  { name: 'readFile', schema: {...} },\n  { name: 'writeFile', schema: {...} },\n  { name: 'listDir', schema: {...} },\n]",
  "→ initialize { capabilities }\n  ← OAuth2 认证流...\n  → Authorization: Bearer <token>",
  "← tools/list\n→ [\n  { name: 'createPR', schema: {...} },\n  { name: 'listIssues', schema: {...} },\n]",
  "// 多级配置合并\nmerge(\n  ~/.claude/mcp.json,     // 全局\n  ./project/mcp.json,     // 项目级\n  CLAUDE.md 中的 MCP 定义  // 文件级\n)",
  "// 工具调用分发\ntool_use: { name: 'github.createPR' }\n→ 查找 server: 'github'\n→ 转发: tools/call { name: 'createPR', args }\n← result: { url: 'https://...' }",
];

const STATUS_CONFIG = {
  connecting: { color: "text-amber-400", bg: "bg-amber-950/30", border: "border-amber-800", label: { zh: "连接中", en: "Connecting" } },
  ready: { color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-800", label: { zh: "就绪", en: "Ready" } },
  error: { color: "text-red-400", bg: "bg-red-950/30", border: "border-red-800", label: { zh: "错误", en: "Error" } },
};

const STEP_INFO = [
  { title: { zh: "MCP 协议概览", en: "MCP Protocol Overview" }, desc: { zh: "Model Context Protocol 让任何服务都能成为 AI 的工具", en: "Model Context Protocol turns any service into AI tools" } },
  { title: { zh: "连接 MCP Server", en: "Connect MCP Server" }, desc: { zh: "客户端向 MCP Server 发送 initialize，协商能力", en: "Client sends initialize to MCP Server, negotiate capabilities" } },
  { title: { zh: "工具发现", en: "Tool Discovery" }, desc: { zh: "tools/list 获取 Server 提供的所有工具及 Schema", en: "tools/list retrieves all tools and schemas provided by Server" } },
  { title: { zh: "OAuth 认证", en: "OAuth Auth" }, desc: { zh: "需要认证的 Server（如 GitHub）走 OAuth2 流程", en: "Servers requiring auth (e.g. GitHub) go through OAuth2 flow" } },
  { title: { zh: "多 Server 并行", en: "Multi-Server Parallel" }, desc: { zh: "同时连接多个 MCP Server，工具自动合并到工具表", en: "Connect multiple MCP Servers simultaneously, tools auto-merge into tool table" } },
  { title: { zh: "多级配置合并", en: "Multi-level Config Merge" }, desc: { zh: "全局 → 项目 → 文件三级 MCP 配置，自动合并", en: "Global → Project → File three-level MCP config, auto-merge" } },
  { title: { zh: "调用分发", en: "Call Dispatch" }, desc: { zh: "模型调用 MCP 工具 → 路由到对应 Server → 返回结果", en: "Model calls MCP tool → Route to corresponding Server → Return result" } },
];

export default function MCPProtocolVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 7, autoPlayInterval: 3000 });
  const { locale } = useLocale();
  const servers = SERVERS_PER_STEP[viz.currentStep];
  const totalTools = servers.reduce((acc, s) => acc + s.tools.length, 0);

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "MCP 协议" : "MCP Protocol"}
      </h2>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[45%]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-500">MCP Servers</span>
              <span className="font-mono text-[10px] text-zinc-500">{totalTools} tools</span>
            </div>
            <div className="min-h-[340px] space-y-3 rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="popLayout">
                {servers.length === 0 && (
                  <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-16 text-center text-xs text-zinc-600">无 MCP 连接</motion.div>
                )}
                {servers.map((srv) => {
                  const st = STATUS_CONFIG[srv.status];
                  return (
                    <motion.div
                      key={srv.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg border p-3 ${st.bg} ${st.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-semibold text-zinc-100">{srv.name}</span>
                        <span className={`text-[10px] font-bold ${st.color}`}>
                          {srv.status === "connecting" ? (
                            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                              {getLocalizedText(st.label, locale)}
                            </motion.span>
                          ) : getLocalizedText(st.label, locale)}
                        </span>
                      </div>
                      {srv.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {srv.tools.map((t) => (
                            <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">{t}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full lg:w-[55%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">协议交互</div>
            <div className="min-h-[340px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="wait">
                {PROTOCOL_STEPS[viz.currentStep] ? (
                  <motion.pre key={viz.currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">
                    {PROTOCOL_STEPS[viz.currentStep]}
                  </motion.pre>
                ) : (
                  <motion.div key="e" className="flex h-full min-h-[300px] items-center justify-center text-xs text-zinc-600">
                    {locale === "zh" ? "点击播放查看 MCP 连接过程" : "Click play to view MCP connection"}
                  </motion.div>
                )}
              </AnimatePresence>
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
