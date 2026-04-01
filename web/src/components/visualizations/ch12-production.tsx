"use client";

import { motion } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

type LocalizedText = { zh: string; en: string };

interface PatternCard { title: LocalizedText; code: string; color: string; }

const PATTERNS_PER_STEP: PatternCard[][] = [
  [],
  [{ title: { zh: "指数退避重试", en: "Exponential Backoff Retry" }, code: "async function retry<T>(fn, maxRetries = 3) {\n  for (let i = 0; i < maxRetries; i++) {\n    try { return await fn(); }\n    catch (e) {\n      if (i === maxRetries - 1) throw e;\n      await sleep(Math.pow(2, i) * 1000);\n      // 1s → 2s → 4s\n    }\n  }\n}", color: "border-blue-700 bg-blue-950/20" }],
  [{ title: { zh: "优雅关机", en: "Graceful Shutdown" }, code: "process.on('SIGTERM', async () => {\n  // 1. 停止接受新任务\n  acceptingRequests = false;\n\n  // 2. 等待进行中的任务 (30s 超时)\n  await Promise.race([\n    waitForPending(),\n    timeout(30000),\n  ]);\n\n  // 3. 保存会话状态\n  await sessionStorage.save(state);\n\n  // 4. 关闭 MCP 连接\n  await mcpClient.disconnect();\n\n  process.exit(0);\n});", color: "border-emerald-700 bg-emerald-950/20" }],
  [{ title: { zh: "会话持久化", en: "Session Persistence" }, code: "class SessionStorage {\n  // 176KB 的会话管理\n  async save(session) {\n    const data = {\n      messages: session.messages,\n      tools: session.toolState,\n      timestamp: Date.now(),\n    };\n    await fs.writeFile(\n      sessionPath,\n      JSON.stringify(data)\n    );\n  }\n\n  async resume(sessionId) {\n    const data = await fs.readFile(...);\n    return JSON.parse(data);\n    // → 完美恢复之前的对话\n  }\n}", color: "border-purple-700 bg-purple-950/20" }],
  [{ title: { zh: "A/B 测试", en: "A/B Testing" }, code: "const gb = new GrowthBook({\n  features: await fetchFeatures(),\n});\n\n// 编译时 feature() 之外的运行时开关\nif (gb.isOn('new_compact_algo')) {\n  // 10% 用户使用新压缩算法\n  compactor = new V2Compactor();\n} else {\n  compactor = new V1Compactor();\n}\n\n// 数据驱动的产品决策", color: "border-amber-700 bg-amber-950/20" }],
  [{ title: { zh: "错误边界 + 遥测", en: "Error Boundary + Telemetry" }, code: "try {\n  await queryEngine.run(input);\n} catch (error) {\n  // 1. 分类错误\n  const category = classifyError(error);\n\n  // 2. 用户友好提示\n  display(ERROR_MESSAGES[category]);\n\n  // 3. 上报遥测 (匿名)\n  telemetry.report({\n    type: category,\n    stack: error.stack,\n    // 不包含用户代码/对话内容\n  });\n\n  // 4. 自动恢复 (如果可以)\n  if (canRecover(category)) {\n    await attemptRecovery();\n  }\n}", color: "border-red-700 bg-red-950/20" }],
  [{ title: { zh: "启动性能优化全景", en: "Complete Startup Optimization" }, code: "// 生产级 vs Demo 的差距总结:\n\n// 1. 启动: 并行预取 + 零加载快速路径\n// 2. 引擎: AsyncGenerator + 流式 + 重试\n// 3. 安全: 300KB 多层分类 + 路径沙箱\n// 4. 上下文: 三层压缩 + 做梦整合\n// 5. 协议: MCP + 多级配置合并\n// 6. 协作: 子代理 + 队友 + 集群\n// 7. 传输: 4 种协议 + 结构化 IO\n// 8. 工程: 重试 + 关机 + 持久化 + A/B\n\n// 教学版: 30 行 Python\n// 生产版: 960 个 TypeScript 文件\n// 差距在这 13 章中。", color: "border-zinc-600 bg-zinc-950" }],
];

const PATTERN_LABELS: LocalizedText[] = [
  { zh: "错误重试", en: "Error Retry" },
  { zh: "优雅关机", en: "Graceful Shutdown" },
  { zh: "会话持久化", en: "Session Persistence" },
  { zh: "A/B 测试", en: "A/B Testing" },
  { zh: "错误边界", en: "Error Boundary" },
  { zh: "全景总结", en: "Complete Overview" },
];

const STEP_INFO = [
  { title: { zh: "生产级工程模式", en: "Production Engineering Patterns" }, desc: { zh: "从 Demo 到 Production 的距离 — 需要十倍工程量", en: "Distance from Demo to Production — requires 10x engineering effort" } },
  { title: { zh: "错误重试", en: "Error Retry" }, desc: { zh: "指数退避重试：API 调用失败 → 1s → 2s → 4s 重试", en: "Exponential backoff retry: API call fails → 1s → 2s → 4s retry" } },
  { title: { zh: "优雅关机", en: "Graceful Shutdown" }, desc: { zh: "SIGTERM → 停止新任务 → 等待完成 → 保存状态 → 退出", en: "SIGTERM → Stop new tasks → Wait completion → Save state → Exit" } },
  { title: { zh: "会话持久化", en: "Session Persistence" }, desc: { zh: "176KB 的 sessionStorage 实现完美的对话恢复", en: "176KB sessionStorage enables perfect conversation recovery" } },
  { title: { zh: "A/B 测试", en: "A/B Testing" }, desc: { zh: "GrowthBook 集成，数据驱动的产品决策", en: "GrowthBook integration, data-driven product decisions" } },
  { title: { zh: "错误边界 + 遥测", en: "Error Boundary + Telemetry" }, desc: { zh: "分类错误、用户提示、匿名上报、自动恢复", en: "Classify errors, user prompts, anonymous reporting, auto-recovery" } },
  { title: { zh: "全景总结", en: "Complete Overview" }, desc: { zh: "12 章覆盖的所有生产级工程模式汇总", en: "Summary of all production engineering patterns covered in 12 chapters" } },
];

export default function ProductionPatternsVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 7, autoPlayInterval: 4000 });
  const { locale } = useLocale();
  const patterns = PATTERNS_PER_STEP[viz.currentStep];

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "生产级工程模式" : "Production Engineering Patterns"}
      </h2>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[35%]">
            <div className="mb-3 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "工程模式清单" : "Engineering Pattern List"}
            </div>
            <div className="space-y-2">
              {PATTERN_LABELS.map((label, i) => {
                const isActive = i + 1 === viz.currentStep;
                const isDone = i + 1 < viz.currentStep;
                return (
                  <motion.div key={getLocalizedText(label, locale)}
                    animate={{ borderColor: isActive ? "#3b82f6" : isDone ? "#047857" : "#27272a" }}
                    className={`rounded border p-2 ${isActive ? "bg-blue-950/30 border-blue-700" : isDone ? "bg-emerald-950/10 border-emerald-800" : "bg-zinc-950 border-zinc-800"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isActive ? "text-white" : isDone ? "text-emerald-400" : "text-zinc-600"}`}>
                        {getLocalizedText(label, locale)}
                      </span>
                      {isDone && <span className="text-emerald-400 text-[10px]">✓</span>}
                      {isActive && <span className="text-blue-400 text-[10px]">→</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:w-[65%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "代码模式" : "Code Pattern"}
            </div>
            <div className="min-h-[380px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              {patterns.length > 0 ? patterns.map((p, i) => (
                <motion.div key={`${viz.currentStep}-${i}`} initial={{opacity:0, y:12}} animate={{opacity:1, y:0}}
                  className={`rounded-lg border p-4 ${p.color}`}>
                  <div className="mb-2 text-sm font-semibold text-zinc-100">
                    {getLocalizedText(p.title, locale)}
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-300">{p.code}</pre>
                </motion.div>
              )) : (
                <div className="flex h-full min-h-[350px] items-center justify-center text-xs text-zinc-600">
                  {locale === "zh" ? "点击播放查看生产级模式" : "Click play to view production patterns"}
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
