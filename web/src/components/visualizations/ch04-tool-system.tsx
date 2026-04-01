"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText } from "@/lib/i18n";
import { type LocalizedText } from "@/types/agent-data";
import { useLocale } from "@/lib/locale-context";

interface ToolDef {
  name: string;
  category: string | LocalizedText;
  color: string;
}

const TOOLS: ToolDef[] = [
  { name: "FileRead", category: { zh: "文件", en: "File" }, color: "bg-blue-500" },
  { name: "FileEdit", category: { zh: "文件", en: "File" }, color: "bg-blue-500" },
  { name: "FileWrite", category: { zh: "文件", en: "File" }, color: "bg-blue-500" },
  { name: "BashTool", category: "Shell", color: "bg-red-500" },
  { name: "GrepTool", category: { zh: "搜索", en: "Search" }, color: "bg-emerald-500" },
  { name: "GlobTool", category: { zh: "搜索", en: "Search" }, color: "bg-emerald-500" },
  { name: "WebFetch", category: { zh: "网络", en: "Network" }, color: "bg-amber-500" },
  { name: "AgentTool", category: "Agent", color: "bg-purple-500" },
  { name: "TodoWrite", category: { zh: "计划", en: "Planning" }, color: "bg-cyan-500" },
  { name: "MCPTool", category: "MCP", color: "bg-pink-500" },
];

const VISIBLE_TOOLS_PER_STEP = [0, 0, 3, 4, 7, 10, 10, 10];

// 工具注册流程
const REGISTRY_STEPS: { phase: LocalizedText; code: string }[] = [
  { phase: { zh: "定义", en: "Definition" }, code: "class FileReadTool extends Tool {\n  name = 'FileRead';\n  schema = { path: z.string() };\n}" },
  { phase: { zh: "验证", en: "Validation" }, code: "// Zod schema 自动验证输入\nconst input = schema.parse(raw);\n// 无效输入 → 返回错误，不执行" },
  { phase: { zh: "权限", en: "Permission" }, code: "// 每次调用前检查权限\nif (!permissions.check(tool, input)) {\n  return { error: 'Permission denied' };\n}" },
  { phase: { zh: "执行", en: "Execute" }, code: "// 超时控制 + 错误捕获\nconst result = await Promise.race([\n  tool.execute(input),\n  timeout(30000),\n]);" },
];

const STEP_INFO = [
  { title: { zh: "工具架构总览", en: "Tool Architecture Overview" }, desc: { zh: "50+ 工具通过统一的 Tool 基类注册，由 tools.ts 分发", en: "50+ tools registered through unified Tool base class, dispatched by tools.ts" } },
  { title: { zh: "Tool 基类", en: "Tool Base Class" }, desc: { zh: "每个工具继承 Tool 类，定义 name、schema、execute 方法", en: "Each tool inherits Tool class, defines name, schema, execute methods" } },
  { title: { zh: "注册文件工具", en: "Register File Tools" }, desc: { zh: "FileRead / FileEdit / FileWrite — 文件操作三件套", en: "FileRead / FileEdit / FileWrite — File operation trio" } },
  { title: { zh: "注册 Shell 工具", en: "Register Shell Tool" }, desc: { zh: "BashTool — 最强大也最危险的工具，含 300KB 安全代码", en: "BashTool — Most powerful and dangerous tool, contains 300KB security code" } },
  { title: { zh: "注册搜索+网络", en: "Register Search+Network" }, desc: { zh: "GrepTool / GlobTool / WebFetch — 信息获取能力", en: "GrepTool / GlobTool / WebFetch — Information retrieval capabilities" } },
  { title: { zh: "注册全部工具", en: "Register All Tools" }, desc: { zh: "AgentTool / TodoWrite / MCPTool — 高级能力", en: "AgentTool / TodoWrite / MCPTool — Advanced capabilities" } },
  { title: { zh: "条件注册", en: "Conditional Registration" }, desc: { zh: "feature() 宏控制工具可见性，内部工具不暴露给外部", en: "feature() macro controls tool visibility, internal tools not exposed externally" } },
  { title: { zh: "分发流程", en: "Dispatch Flow" }, desc: { zh: "模型返回 tool_use → tools.ts 查 Map → Schema 验证 → 权限 → 执行", en: "Model returns tool_use → tools.ts lookup Map → Schema validation → Permission → Execute" } },
];

export default function ToolSystemVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 8, autoPlayInterval: 2500 });
  const { locale } = useLocale();
  const toolCount = VISIBLE_TOOLS_PER_STEP[viz.currentStep];
  const visibleTools = TOOLS.slice(0, toolCount);
  const registryStep = viz.currentStep >= 1 && viz.currentStep <= 4
    ? REGISTRY_STEPS[viz.currentStep - 1] : viz.currentStep >= 7 ? REGISTRY_STEPS[3] : null;

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "工具注册与分发" : "Tool Registration & Dispatch"}
      </h2>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 左侧：工具注册表 */}
          <div className="w-full lg:w-[45%]">
            <div className="mb-3 font-mono text-xs text-zinc-500">
              toolRegistry: Map&lt;string, Tool&gt; ({toolCount}/50+)
            </div>
            <div className="min-h-[320px] space-y-1.5 rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="popLayout">
                {visibleTools.length === 0 && (
                  <motion.div key="e" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="py-16 text-center text-xs text-zinc-600">
                    {locale === "zh" ? "工具注册表为空" : "Tool registry empty"}
                  </motion.div>
                )}
                {visibleTools.map((tool, i) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                    className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${tool.color}`} />
                      <span className="font-mono text-xs font-medium text-zinc-200">{tool.name}</span>
                    </div>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-500">
                      {typeof tool.category === "string" ? tool.category : getLocalizedText(tool.category, locale)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 条件注册提示 */}
              {viz.currentStep === 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 rounded border border-amber-800 bg-amber-950/30 p-2 text-[10px] text-amber-300"
                >
                  if (feature(&quot;internal&quot;)) register(InternalDebugTool)
                  <br />→ 外部构建: 编译时已移除
                </motion.div>
              )}
            </div>
          </div>

          {/* 右侧：注册/分发流程 */}
          <div className="w-full lg:w-[55%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {viz.currentStep >= 7 ? (locale === "zh" ? "分发流程" : "Dispatch Flow") : (locale === "zh" ? "注册流程" : "Registration Flow")}
            </div>
            <div className="min-h-[320px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              {registryStep ? (
                <motion.div key={viz.currentStep} initial={{opacity:0}} animate={{opacity:1}}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded bg-blue-900 px-2 py-0.5 text-xs font-bold text-blue-300">
                      {getLocalizedText(registryStep.phase, locale)}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">
                    {registryStep.code}
                  </pre>
                </motion.div>
              ) : viz.currentStep >= 5 ? (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
                  <div className="text-sm text-zinc-300">
                    {locale === "zh" ? "工具分发 4 步流程：" : "Tool Dispatch 4-Step Flow:"}
                  </div>
                  {[
                    { zh: "1. 模型返回 tool_use → 查询 toolRegistry Map", en: "1. Model returns tool_use → Query toolRegistry Map" },
                    { zh: "2. Zod Schema 验证输入参数", en: "2. Zod Schema validates input parameters" },
                    { zh: "3. Permission Engine 权限检查", en: "3. Permission Engine checks permissions" },
                    { zh: "4. 执行工具 (30s 超时保护)", en: "4. Execute tool (30s timeout protection)" }
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300"
                    >
                      {getLocalizedText(step, locale)}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center text-xs text-zinc-600">
                  {locale === "zh" ? "点击播放查看工具注册过程" : "Click play to view tool registration"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StepControls
        currentStep={viz.currentStep} totalSteps={viz.totalSteps}
        onPrev={viz.prev} onNext={viz.next} onReset={viz.reset}
        isPlaying={viz.isPlaying} onToggleAutoPlay={viz.toggleAutoPlay}
        stepTitle={getLocalizedText(STEP_INFO[viz.currentStep].title, locale)}
        stepDescription={getLocalizedText(STEP_INFO[viz.currentStep].desc, locale)}
      />
    </section>
  );
}
