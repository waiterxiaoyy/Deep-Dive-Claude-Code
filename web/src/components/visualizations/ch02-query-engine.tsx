"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// 双语化节点标签
const NODES = [
  { id: "user", label: { zh: "用户输入", en: "User Input" }, x: 240, y: 30, w: 130, h: 36 },
  { id: "budget", label: { zh: "Token预算", en: "Token Budget" }, x: 240, y: 100, w: 130, h: 36 },
  { id: "api", label: { zh: "API调用", en: "API Call" }, x: 240, y: 180, w: 130, h: 36 },
  { id: "check", label: "stop_reason?", x: 240, y: 270, w: 150, h: 45 },
  { id: "exec", label: { zh: "执行工具", en: "Execute Tool" }, x: 240, y: 370, w: 130, h: 36 },
  { id: "perm", label: { zh: "权限检查", en: "Permission Check" }, x: 80, y: 370, w: 140, h: 36 },
  { id: "append", label: { zh: "追加结果", en: "Append Result" }, x: 240, y: 440, w: 130, h: 36 },
  { id: "done", label: { zh: "返回用户", en: "Return to User" }, x: 440, y: 270, w: 140, h: 36 },
];

const EDGES = [
  { from: "user", to: "budget" },
  { from: "budget", to: "api" },
  { from: "api", to: "check" },
  { from: "check", to: "exec", label: "tool_use" },
  { from: "exec", to: "append" },
  { from: "append", to: "api" },
  { from: "check", to: "done", label: "end_turn" },
];

const ACTIVE_NODES: string[][] = [
  [],
  ["user"],
  ["user", "budget"],
  ["budget", "api"],
  ["api", "check"],
  ["check", "exec", "perm"],
  ["exec", "append"],
  ["append", "api"],
  ["api", "check"],
  ["check", "done"],
];

const ACTIVE_EDGES: string[][] = [
  [],
  [],
  ["user->budget"],
  ["budget->api"],
  ["api->check"],
  ["check->exec"],
  ["exec->append"],
  ["append->api"],
  ["api->check"],
  ["check->done"],
];

interface Msg { role: string; detail: { zh: string; en: string }; color: string; }

const MESSAGES: (Msg | null)[][] = [
  [],
  [{ role: "user", detail: { zh: "修复 auth.ts 的登录 bug", en: "Fix login bug in auth.ts" }, color: "bg-blue-500" }],
  [],
  [],
  [{ role: "assistant", detail: { zh: "思考中... 需要先看代码", en: "Thinking... Need to read code first" }, color: "bg-zinc-600" }],
  [{ role: "tool_call", detail: { zh: "FileRead → src/auth.ts", en: "FileRead → src/auth.ts" }, color: "bg-amber-600" }],
  [{ role: "tool_result", detail: { zh: "auth.ts 文件内容 (48 行)", en: "auth.ts file content (48 lines)" }, color: "bg-emerald-600" }],
  [],
  [{ role: "tool_call", detail: { zh: "FileEdit → 修复密码比较", en: "FileEdit → Fix password comparison" }, color: "bg-amber-600" },
   { role: "tool_result", detail: { zh: "✓ 替换了 1 处", en: "✓ Replaced 1 occurrence" }, color: "bg-emerald-600" }],
  [{ role: "assistant", detail: { zh: "已修复! 改为 bcrypt 安全比对", en: "Fixed! Changed to bcrypt secure comparison" }, color: "bg-purple-500" }],
];

const STEP_INFO = [
  { 
    title: { zh: "QueryEngine 循环", en: "QueryEngine Loop" },
    desc: { zh: "核心循环: 用户输入 → API 调用 → 工具执行 → 回传结果，直到模型 stop", en: "Core loop: User input → API call → Tool execution → Return result, until model stops" }
  },
  { 
    title: { zh: "用户输入", en: "User Input" },
    desc: { zh: "用户消息加入 messages[] 数组", en: "User message added to messages[] array" }
  },
  { 
    title: { zh: "Token 预算", en: "Token Budget" },
    desc: { zh: "analyzeContext() 计算可用 Token，裁剪超预算的历史消息", en: "analyzeContext() calculates available tokens, trims over-budget history" }
  },
  { 
    title: { zh: "API 调用", en: "API Call" },
    desc: { zh: "发送 messages[] 到 Claude API，包含 system prompt + 工具定义", en: "Send messages[] to Claude API, including system prompt + tool definitions" }
  },
  { 
    title: { zh: "响应解析", en: "Response Parsing" },
    desc: { zh: "检查 stop_reason：'tool_use' → 继续循环，'end_turn' → 退出", en: "Check stop_reason: 'tool_use' → continue loop, 'end_turn' → exit" }
  },
  { 
    title: { zh: "工具执行 + 权限检查", en: "Tool Execution + Permission Check" },
    desc: { zh: "每个工具调用先经过 Permission Engine 验证路径和安全性", en: "Each tool call first goes through Permission Engine for path and security validation" }
  },
  { 
    title: { zh: "结果追加", en: "Append Result" },
    desc: { zh: "工具执行结果追加到 messages[]，作为下一轮 API 调用的上下文", en: "Tool execution result appended to messages[], as context for next API call" }
  },
  { 
    title: { zh: "循环回 API", en: "Loop Back to API" },
    desc: { zh: "带着新的工具结果回到 API 调用，模型看到完整上下文", en: "Return to API call with new tool results, model sees full context" }
  },
  { 
    title: { zh: "第二轮工具调用", en: "Second Tool Call" },
    desc: { zh: "模型决定编辑文件，FileEdit 工具执行并返回结果", en: "Model decides to edit file, FileEdit tool executes and returns result" }
  },
  { 
    title: { zh: "循环退出", en: "Exit Loop" },
    desc: { zh: "stop_reason = 'end_turn'，模型完成任务，响应返回用户", en: "stop_reason = 'end_turn', model completes task, response returns to user" }
  },
];

function getNode(id: string) { return NODES.find((n) => n.id === id)!; }

function edgePath(fromId: string, toId: string) {
  const f = getNode(fromId), t = getNode(toId);
  // loop-back: append -> api
  if (fromId === "append" && toId === "api") {
    return `M ${f.x - f.w/2} ${f.y} L ${f.x - f.w/2 - 50} ${f.y} L ${t.x - t.w/2 - 50} ${t.y} L ${t.x - t.w/2} ${t.y}`;
  }
  // horizontal: check -> done
  if (fromId === "check" && toId === "done") {
    return `M ${f.x + f.w/2} ${f.y} L ${t.x - t.w/2} ${t.y}`;
  }
  return `M ${f.x} ${f.y + f.h/2} L ${t.x} ${t.y - t.h/2}`;
}

export default function QueryEngineVisualization() {
  const { locale } = useLocale();
  const viz = useSteppedVisualization({ totalSteps: 10, autoPlayInterval: 2500 });
  const an = ACTIVE_NODES[viz.currentStep];
  const ae = ACTIVE_EDGES[viz.currentStep];

  const visibleMessages: Msg[] = [];
  for (let s = 0; s <= viz.currentStep; s++) {
    for (const m of MESSAGES[s]) { if (m) visibleMessages.push(m); }
  }

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "查询引擎循环" : "Query Engine Loop"}
      </h2>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 流程图 */}
          <div className="w-full lg:w-[60%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              while (stop_reason === &quot;tool_use&quot;)
            </div>
            <svg viewBox="0 0 580 490" className="w-full rounded-md border border-zinc-800 bg-zinc-950" style={{ minHeight: 300 }}>
              <defs>
                <filter id="gl-b2"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.7" /></filter>
                <filter id="gl-p2"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" floodOpacity="0.7" /></filter>
                <marker id="a2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#52525b" /></marker>
                <marker id="a2a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#3b82f6" /></marker>
              </defs>

              {EDGES.map((e) => {
                const key = `${e.from}->${e.to}`;
                const active = ae.includes(key);
                return (
                  <g key={key}>
                    <motion.path d={edgePath(e.from, e.to)} fill="none"
                      stroke={active ? "#3b82f6" : "#3f3f46"} strokeWidth={active ? 2.5 : 1.5}
                      markerEnd={active ? "url(#a2a)" : "url(#a2)"}
                      animate={{ stroke: active ? "#3b82f6" : "#3f3f46" }} transition={{ duration: 0.4 }} />
                    {e.label && (
                      <text x={(getNode(e.from).x + getNode(e.to).x)/2 + (e.to === "done" ? 0 : 80)}
                        y={(getNode(e.from).y + getNode(e.to).y)/2 + (e.to === "done" ? -10 : 0)}
                        textAnchor="middle" className="fill-zinc-500 text-[10px]">{e.label}</text>
                    )}
                  </g>
                );
              })}

              {/* Permission Check 虚线连接 */}
              {an.includes("perm") && (
                <motion.line x1={getNode("exec").x - getNode("exec").w/2} y1={getNode("exec").y}
                  x2={getNode("perm").x + getNode("perm").w/2} y2={getNode("perm").y}
                  stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
              )}

              {NODES.map((n) => {
                const active = an.includes(n.id);
                const isDone = n.id === "done";
                const isPerm = n.id === "perm";
                const fillActive = isDone ? "#581c87" : isPerm ? "#78350f" : "#1e3a5f";
                const strokeActive = isDone ? "#a855f7" : isPerm ? "#f59e0b" : "#3b82f6";
                const filterStr = active ? (isDone ? "url(#gl-p2)" : "url(#gl-b2)") : "none";
                const labelText = typeof n.label === "string" ? n.label : getLocalizedText(n.label, locale);

                // diamond for check
                if (n.id === "check") {
                  const cx = n.x, cy = n.y, hw = n.w/2, hh = n.h/2;
                  return (
                    <g key={n.id}>
                      <motion.polygon points={`${cx},${cy-hh} ${cx+hw},${cy} ${cx},${cy+hh} ${cx-hw},${cy}`}
                        fill={active ? fillActive : "#18181b"} stroke={active ? strokeActive : "#3f3f46"}
                        strokeWidth={1.5} filter={filterStr}
                        animate={{ fill: active ? fillActive : "#18181b", stroke: active ? strokeActive : "#3f3f46" }}
                        transition={{ duration: 0.4 }} />
                      <motion.text x={cx} y={cy+4} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="monospace"
                        animate={{ fill: active ? "#fff" : "#a1a1aa" }} transition={{ duration: 0.4 }}>{labelText}</motion.text>
                    </g>
                  );
                }

                return (
                  <g key={n.id}>
                    <motion.rect x={n.x-n.w/2} y={n.y-n.h/2} width={n.w} height={n.h} rx={8}
                      fill={active ? fillActive : "#18181b"} stroke={active ? strokeActive : "#3f3f46"}
                      strokeWidth={1.5} filter={filterStr}
                      animate={{ fill: active ? fillActive : "#18181b", stroke: active ? strokeActive : "#3f3f46" }}
                      transition={{ duration: 0.4 }} />
                    <motion.text x={n.x} y={n.y+4} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily="monospace"
                      animate={{ fill: active ? "#fff" : "#a1a1aa" }} transition={{ duration: 0.4 }}>{labelText}</motion.text>
                  </g>
                );
              })}

              {viz.currentStep >= 7 && (
                <motion.text x={55} y={240} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#3b82f6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>iter #2</motion.text>
              )}
            </svg>
          </div>

          {/* messages[] */}
          <div className="w-full lg:w-[40%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">messages[]</div>
            <div className="min-h-[300px] space-y-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="popLayout">
                {visibleMessages.length === 0 && (
                  <motion.div key="e" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="py-8 text-center text-xs text-zinc-600">[ empty ]</motion.div>
                )}
                {visibleMessages.map((m, i) => (
                  <motion.div key={`${m.role}-${i}`}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35, type: "spring", bounce: 0.3 }}
                    className={`rounded-md px-3 py-2 ${m.color}`}>
                    <div className="font-mono text-[11px] font-semibold text-white">{m.role}</div>
                    <div className="mt-0.5 text-[10px] text-white/80">{getLocalizedText(m.detail, locale)}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleMessages.length > 0 && (
                <div className="mt-3 border-t border-zinc-700 pt-2">
                  <span className="font-mono text-[10px] text-zinc-500">length: {visibleMessages.length}</span>
                </div>
              )}
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
