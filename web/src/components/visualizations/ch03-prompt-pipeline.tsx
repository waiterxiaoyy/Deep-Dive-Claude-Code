"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// 4 层 Prompt 管线
interface PipelineLayer {
  id: string;
  label: LocalizedText;
  desc: LocalizedText;
  color: string;
  tokens: string;
}

const LAYERS: PipelineLayer[] = [
  { id: "base", label: { zh: "L1: 基础身份", en: "L1: Base Identity" }, desc: { zh: "你是 Claude，一个 AI 编程助手...", en: "You are Claude, an AI programming assistant..." }, color: "bg-blue-600", tokens: "~2K" },
  { id: "tools", label: { zh: "L2: 工具定义", en: "L2: Tool Definitions" }, desc: { zh: "50+ 工具 Schema (FileRead, BashTool, ...)", en: "50+ tool schemas (FileRead, BashTool, ...)" }, color: "bg-emerald-600", tokens: "~15K" },
  { id: "claudemd", label: { zh: "L3: CLAUDE.md", en: "L3: CLAUDE.md" }, desc: { zh: "项目配置: 代码风格、约定、自定义规则", en: "Project config: code style, conventions, custom rules" }, color: "bg-purple-600", tokens: "~5K" },
  { id: "context", label: { zh: "L4: 动态上下文", en: "L4: Dynamic Context" }, desc: { zh: "打开的文件、git 状态、LSP 诊断", en: "Open files, git status, LSP diagnostics" }, color: "bg-amber-600", tokens: "~8K" },
];

// 每步展示哪些层 + 输出
const VISIBLE_LAYERS_PER_STEP: number[] = [0, 1, 2, 3, 4, 4, 4];

// CLAUDE.md 查找路径
const CLAUDEMD_SEARCH = [
  "~/.claude/CLAUDE.md",
  "~/project/CLAUDE.md",
  "~/project/.claude/CLAUDE.md",
  "~/project/src/CLAUDE.md",
];

const OUTPUT_PER_STEP: LocalizedText[] = [
  { zh: "", en: "" },
  { zh: "identity: \"You are Claude, an AI assistant...\"", en: "identity: \"You are Claude, an AI assistant...\"" },
  { zh: "tools: [FileRead, FileEdit, BashTool, ...]\n  schemas: 50+ JSON Schema definitions", en: "tools: [FileRead, FileEdit, BashTool, ...]\n  schemas: 50+ JSON Schema definitions" },
  { zh: "CLAUDE.md found at: ~/project/CLAUDE.md\n  rules: [\"Use TypeScript strict mode\",\n          \"Run tests before commit\",\n          \"Prefer functional style\"]", en: "CLAUDE.md found at: ~/project/CLAUDE.md\n  rules: [\"Use TypeScript strict mode\",\n          \"Run tests before commit\",\n          \"Prefer functional style\"]" },
  { zh: "context: {\n  openFiles: [\"auth.ts\", \"index.ts\"],\n  gitBranch: \"fix/login-bug\",\n  diagnostics: 2 errors, 1 warning\n}", en: "context: {\n  openFiles: [\"auth.ts\", \"index.ts\"],\n  gitBranch: \"fix/login-bug\",\n  diagnostics: 2 errors, 1 warning\n}" },
  { zh: "// 最终组装\nsystemPrompt = [\n  baseIdentity,     // 2K tokens\n  toolDefinitions,  // 15K tokens\n  claudeMdRules,    // 5K tokens\n  dynamicContext,   // 8K tokens\n].join('\\n');      // 总计 ~30K", en: "// Final assembly\nsystemPrompt = [\n  baseIdentity,     // 2K tokens\n  toolDefinitions,  // 15K tokens\n  claudeMdRules,    // 5K tokens\n  dynamicContext,   // 8K tokens\n].join('\\n');      // Total ~30K" },
  { zh: "// Token 预算裁剪\nif (totalTokens > budget) {\n  // 优先保留: L1 > L2 > L3 > L4\n  trimDynamicContext();\n  if (still > budget) truncateClaudeMd();\n}", en: "// Token budget trimming\nif (totalTokens > budget) {\n  // Priority: L1 > L2 > L3 > L4\n  trimDynamicContext();\n  if (still > budget) truncateClaudeMd();\n}" },
];

const STEP_INFO = [
  { title: { zh: "Prompt 组装管线", en: "Prompt Assembly Pipeline" }, desc: { zh: "System Prompt 不是一个字符串，而是 4 层动态组装的管线", en: "System Prompt is not a string, but a 4-layer dynamically assembled pipeline" } },
  { title: { zh: "L1: 基础身份", en: "L1: Base Identity" }, desc: { zh: "定义 Claude 的角色和核心行为规范，约 2K tokens", en: "Define Claude's role and core behavioral norms, ~2K tokens" } },
  { title: { zh: "L2: 工具定义", en: "L2: Tool Definitions" }, desc: { zh: "50+ 工具的 JSON Schema 注入，让模型知道可以用什么工具", en: "Inject JSON schemas for 50+ tools, let the model know available tools" } },
  { title: { zh: "L3: CLAUDE.md 配置", en: "L3: CLAUDE.md Config" }, desc: { zh: "从项目目录逐级向上搜索 CLAUDE.md，注入项目级规则", en: "Search for CLAUDE.md upward from project directory, inject project-level rules" } },
  { title: { zh: "L4: 动态上下文", en: "L4: Dynamic Context" }, desc: { zh: "注入当前打开的文件、git 状态、LSP 诊断信息", en: "Inject currently open files, git status, LSP diagnostics" } },
  { title: { zh: "最终组装", en: "Final Assembly" }, desc: { zh: "4 层内容拼接成完整 System Prompt，约 30K tokens", en: "4 layers concatenated into complete System Prompt, ~30K tokens" } },
  { title: { zh: "预算裁剪", en: "Budget Trimming" }, desc: { zh: "如果超出 Token 预算，按优先级从 L4 → L3 逐步裁剪", en: "If exceeds token budget, trim progressively from L4 → L3 by priority" } },
];

export default function PromptPipelineVisualization() {
  const { locale } = useLocale();
  const viz = useSteppedVisualization({ totalSteps: 7, autoPlayInterval: 2500 });
  const visibleCount = VISIBLE_LAYERS_PER_STEP[viz.currentStep];

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "Prompt 组装管线" : "Prompt Assembly Pipeline"}
      </h2>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 左侧：管线层 */}
          <div className="w-full lg:w-[50%]">
            <div className="mb-3 font-mono text-xs text-zinc-500">System Prompt Pipeline</div>
            <div className="space-y-3">
              {LAYERS.map((layer, i) => {
                const isVisible = i < visibleCount;
                const isActive = i === visibleCount - 1 && viz.currentStep <= 4;

                return (
                  <motion.div
                    key={layer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: isVisible ? 1 : 0.2,
                      x: isVisible ? 0 : -20,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.4, delay: isActive ? 0 : 0.1 }}
                    className={`rounded-lg border p-3 ${isActive ? "border-white/30 ring-1 ring-white/10" : "border-zinc-800"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${layer.color}`} />
                        <span className={`text-sm font-semibold ${isVisible ? "text-zinc-100" : "text-zinc-600"}`}>
                          {getLocalizedText(layer.label, locale)}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">{layer.tokens}</span>
                    </div>
                    <p className={`mt-1 text-xs ${isVisible ? "text-zinc-400" : "text-zinc-700"}`}>
                      {getLocalizedText(layer.desc, locale)}
                    </p>

                    {/* CLAUDE.md 搜索路径 */}
                    {layer.id === "claudemd" && isActive && (
                      <div className="mt-2 space-y-1">
                        {CLAUDEMD_SEARCH.map((path, j) => (
                          <motion.div
                            key={path}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: j * 0.2 }}
                            className={`flex items-center gap-2 font-mono text-[10px] ${j === 1 ? "text-emerald-400" : "text-zinc-600"}`}
                          >
                            <span>{j === 1 ? "✓" : "✗"}</span>
                            <span>{path}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Token 总计 */}
              {viz.currentStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                >
                  <span className="text-xs text-zinc-400">
                    {locale === "zh" ? "System Prompt 总计" : "Total System Prompt"}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">~30K tokens</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* 右侧：输出 */}
          <div className="w-full lg:w-[50%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "组装输出" : "Assembly Output"}
            </div>
            <div className="min-h-[360px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="wait">
                {getLocalizedText(OUTPUT_PER_STEP[viz.currentStep], locale) ? (
                  <motion.pre
                    key={viz.currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300"
                  >
                    {getLocalizedText(OUTPUT_PER_STEP[viz.currentStep], locale)}
                  </motion.pre>
                ) : (
                  <motion.div
                    key="empty"
                    className="flex h-full min-h-[300px] items-center justify-center text-xs text-zinc-600"
                  >
                    {locale === "zh" ? "点击播放查看组装过程" : "Click play to view assembly process"}
                  </motion.div>
                )}
              </AnimatePresence>
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
