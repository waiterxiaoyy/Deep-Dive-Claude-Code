"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

interface AgentNode { id: string; label: string; type: "main" | "sub" | "teammate"; status: "idle" | "active" | "done"; x: number; y: number; }

const NODES_PER_STEP: AgentNode[][] = [
  [{ id: "main", label: "Main Agent", type: "main", status: "idle", x: 250, y: 50 }],
  [{ id: "main", label: "Main Agent", type: "main", status: "active", x: 250, y: 50 }],
  [
    { id: "main", label: "Main Agent", type: "main", status: "active", x: 250, y: 50 },
    { id: "sub1", label: "Subagent", type: "sub", status: "active", x: 250, y: 170 },
  ],
  [
    { id: "main", label: "Main Agent", type: "main", status: "active", x: 250, y: 50 },
    { id: "sub1", label: "Subagent", type: "sub", status: "done", x: 250, y: 170 },
  ],
  [
    { id: "main", label: "Main Agent", type: "main", status: "active", x: 250, y: 50 },
    { id: "tm1", label: "Teammate A", type: "teammate", status: "active", x: 100, y: 200 },
    { id: "tm2", label: "Teammate B", type: "teammate", status: "active", x: 400, y: 200 },
  ],
  [
    { id: "main", label: "Main Agent", type: "main", status: "active", x: 250, y: 50 },
    { id: "tm1", label: "Teammate A", type: "teammate", status: "active", x: 100, y: 200 },
    { id: "tm2", label: "Teammate B", type: "teammate", status: "active", x: 400, y: 200 },
  ],
  [
    { id: "main", label: "Coordinator", type: "main", status: "active", x: 250, y: 50 },
    { id: "sw1", label: "Worker 1", type: "teammate", status: "active", x: 80, y: 200 },
    { id: "sw2", label: "Worker 2", type: "teammate", status: "active", x: 250, y: 200 },
    { id: "sw3", label: "Worker 3", type: "teammate", status: "active", x: 420, y: 200 },
  ],
];

const TYPE_COLORS = {
  main: { fill: "#1e3a5f", stroke: "#3b82f6" },
  sub: { fill: "#1a2e1a", stroke: "#10b981" },
  teammate: { fill: "#2e1a2e", stroke: "#a855f7" },
};

const STATUS_GLOW = { idle: "none", active: "url(#glow-ma)", done: "url(#glow-done)" };

const DETAIL_PER_STEP: LocalizedText[] = [
  { zh: "三层 Agent 模型:\n  L1: Subagent — 隔离上下文的子任务\n  L2: Teammate — 持久化的队友协作\n  L3: Swarm — 集群并行执行", en: "Three-layer Agent model:\n  L1: Subagent — Isolated context sub-tasks\n  L2: Teammate — Persistent teammate collaboration\n  L3: Swarm — Cluster parallel execution" },
  { zh: "Main Agent 收到复杂任务:\n  \"重构整个认证模块\"", en: "Main Agent receives complex task:\n  \"Refactor entire auth module\"" },
  { zh: "Subagent 模式:\n  const sub = spawnAgent({\n    messages: [],  // 独立 messages[]\n    tools: parentTools,\n    task: '分析 auth.ts 依赖图',\n  });\n  // 隔离上下文，不污染主对话", en: "Subagent mode:\n  const sub = spawnAgent({\n    messages: [],  // Independent messages[]\n    tools: parentTools,\n    task: 'Analyze auth.ts dependency graph',\n  });\n  // Isolated context, no main conversation pollution" },
  { zh: "Subagent 完成:\n  result = '发现 5 个依赖文件'\n  → 摘要注入 Main Agent\n  → Subagent 上下文释放", en: "Subagent completes:\n  result = 'Found 5 dependency files'\n  → Summary injected to Main Agent\n  → Subagent context released" },
  { zh: "Teammate 模式:\n  spawnTeammate('A', {\n    task: '重写 auth.ts',\n    mailbox: '/tmp/mailbox-A',\n  });\n  spawnTeammate('B', {\n    task: '更新测试文件',\n    mailbox: '/tmp/mailbox-B',\n  });", en: "Teammate mode:\n  spawnTeammate('A', {\n    task: 'Rewrite auth.ts',\n    mailbox: '/tmp/mailbox-A',\n  });\n  spawnTeammate('B', {\n    task: 'Update test files',\n    mailbox: '/tmp/mailbox-B',\n  });" },
  { zh: "邮箱通信:\n  A → mailbox → Main: '重写完成'\n  B → mailbox → Main: '测试更新完成'\n\n  Main 读取邮箱，协调进度", en: "Mailbox communication:\n  A → mailbox → Main: 'Rewrite complete'\n  B → mailbox → Main: 'Test update complete'\n\n  Main reads mailbox, coordinates progress" },
  { zh: "Swarm 集群:\n  coordinator.dispatch([\n    { worker: 1, task: '模块 A' },\n    { worker: 2, task: '模块 B' },\n    { worker: 3, task: '模块 C' },\n  ]);\n  // 并行执行，共享任务板", en: "Swarm cluster:\n  coordinator.dispatch([\n    { worker: 1, task: 'Module A' },\n    { worker: 2, task: 'Module B' },\n    { worker: 3, task: 'Module C' },\n  ]);\n  // Parallel execution, shared task board" },
];

const STEP_INFO: { title: LocalizedText; desc: LocalizedText }[] = [
  { title: { zh: "多 Agent 协作", en: "Multi-Agent Collaboration" }, desc: { zh: "三层模型：Subagent / Teammate / Swarm，从简单到复杂", en: "Three-layer model: Subagent / Teammate / Swarm, from simple to complex" } },
  { title: { zh: "任务触发", en: "Task Triggered" }, desc: { zh: "Main Agent 收到超出单 Agent 能力的复杂任务", en: "Main Agent receives complex task beyond single agent capability" } },
  { title: { zh: "L1: Subagent 模式", en: "L1: Subagent Mode" }, desc: { zh: "隔离 messages[]，子任务独立执行，不污染主上下文", en: "Isolated messages[], subtasks execute independently, no pollution to main context" } },
  { title: { zh: "Subagent 返回", en: "Subagent Returns" }, desc: { zh: "子任务完成，摘要注入主对话，上下文释放", en: "Subtask completed, summary injected to main conversation, context released" } },
  { title: { zh: "L2: Teammate 模式", en: "L2: Teammate Mode" }, desc: { zh: "持久化队友，各自独立运行，通过文件邮箱异步通信", en: "Persistent teammates, run independently, communicate asynchronously via file mailbox" } },
  { title: { zh: "邮箱通信", en: "Mailbox Communication" }, desc: { zh: "Teammate 通过文件系统邮箱交换消息和协调进度", en: "Teammates exchange messages and coordinate progress via filesystem mailbox" } },
  { title: { zh: "L3: Swarm 集群", en: "L3: Swarm Cluster" }, desc: { zh: "Coordinator 分发任务，Workers 并行执行，共享任务板", en: "Coordinator dispatches tasks, Workers execute in parallel, shared task board" } },
];

export default function MultiAgentVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 7, autoPlayInterval: 3000 });
  const { locale } = useLocale();
  const nodes = NODES_PER_STEP[viz.currentStep];

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">多 Agent 协作</h2>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[45%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "Agent 拓扑" : "Agent Topology"}
            </div>
            <svg viewBox="0 0 500 300" className="w-full rounded-md border border-zinc-800 bg-zinc-950" style={{minHeight:240}}>
              <defs>
                <filter id="glow-ma"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.6"/></filter>
                <filter id="glow-done"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.6"/></filter>
              </defs>
              {/* 连线 */}
              {nodes.filter(n => n.type !== "main").map(n => {
                const main = nodes.find(m => m.type === "main")!;
                return (
                  <motion.line key={`${n.id}-line`} x1={main.x} y1={main.y+20} x2={n.x} y2={n.y-20}
                    stroke={n.status === "done" ? "#10b981" : "#3f3f46"} strokeWidth={1.5} strokeDasharray={n.type === "teammate" ? "4 4" : "none"}
                    initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}} />
                );
              })}
              {/* 邮箱图标 */}
              {viz.currentStep === 5 && nodes.filter(n => n.type === "teammate").map(n => (
                <motion.text key={`${n.id}-mail`} x={(250 + n.x)/2} y={(50 + n.y)/2 + 5}
                  textAnchor="middle" fontSize={12} initial={{opacity:0}} animate={{opacity:[0,1,0,1]}} transition={{repeat:Infinity, duration:1.5}}>
                  📨
                </motion.text>
              ))}
              {nodes.map(n => {
                const c = TYPE_COLORS[n.type];
                return (
                  <g key={n.id}>
                    <motion.rect x={n.x-55} y={n.y-18} width={110} height={36} rx={8}
                      fill={n.status === "done" ? "#052e16" : c.fill}
                      stroke={n.status === "done" ? "#10b981" : c.stroke}
                      strokeWidth={1.5} filter={STATUS_GLOW[n.status]}
                      initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}} transition={{type:"spring"}} />
                    <motion.text x={n.x} y={n.y+4} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="monospace"
                      fill={n.status === "idle" ? "#71717a" : "#fff"}
                      initial={{opacity:0}} animate={{opacity:1}}>
                      {n.label}
                    </motion.text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full lg:w-[55%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "执行细节" : "Execution Details"}
            </div>
            <div className="min-h-[240px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <motion.pre key={viz.currentStep} initial={{opacity:0}} animate={{opacity:1}}
                className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">
                {getLocalizedText(DETAIL_PER_STEP[viz.currentStep], locale)}
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
