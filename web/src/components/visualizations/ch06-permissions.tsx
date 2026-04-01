"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

interface PermRule {
  pattern: string;
  access: "allow" | "deny" | "ask";
  scope: string;
}

const RULES: PermRule[] = [
  { pattern: "src/**", access: "allow", scope: "FileRead/Edit" },
  { pattern: "node_modules/**", access: "deny", scope: "FileEdit" },
  { pattern: ".env*", access: "deny", scope: "FileRead" },
  { pattern: "**/*.test.ts", access: "allow", scope: "FileEdit" },
  { pattern: "/etc/**", access: "deny", scope: "All" },
  { pattern: "~/**", access: "ask", scope: "FileRead" },
];

interface CheckResult { path: string; tool: string; result: "allow" | "deny" | "ask"; matchedRule: string; }

const CHECKS_PER_STEP: (CheckResult | null)[] = [
  null,
  null,
  { path: "src/auth.ts", tool: "FileRead", result: "allow", matchedRule: "src/**" },
  { path: "src/auth.ts", tool: "FileEdit", result: "allow", matchedRule: "src/**" },
  { path: "node_modules/lodash/index.js", tool: "FileEdit", result: "deny", matchedRule: "node_modules/**" },
  { path: ".env.local", tool: "FileRead", result: "deny", matchedRule: ".env*" },
  { path: "~/Documents/notes.txt", tool: "FileRead", result: "ask", matchedRule: "~/**" },
  null,
];

const ENV_VARS = [
  { name: "ANTHROPIC_API_KEY", status: "cleaned", desc: { zh: "API 密钥 → 已清除", en: "API key → Cleaned" } },
  { name: "DATABASE_URL", status: "cleaned", desc: { zh: "数据库连接 → 已清除", en: "DB connection → Cleaned" } },
  { name: "PATH", status: "kept", desc: { zh: "系统路径 → 保留", en: "System path → Kept" } },
  { name: "HOME", status: "kept", desc: { zh: "主目录 → 保留", en: "Home dir → Kept" } },
  { name: "AWS_SECRET_KEY", status: "cleaned", desc: { zh: "AWS 密钥 → 已清除", en: "AWS key → Cleaned" } },
];

const STEP_INFO = [
  { title: { zh: "权限引擎概览", en: "Permission Engine Overview" }, desc: { zh: "每次文件操作都经过 260KB+ 的权限系统检查", en: "Every file operation goes through 260KB+ permission system checks" } },
  { title: { zh: "规则定义", en: "Rule Definition" }, desc: { zh: "权限规则用 glob 模式匹配路径，支持 allow/deny/ask 三种策略", en: "Permission rules match paths with glob patterns, support allow/deny/ask strategies" } },
  { title: { zh: "检查: 读取 src 文件", en: "Check: Read src File" }, desc: { zh: "src/auth.ts 匹配 src/** 规则 → 允许读取", en: "src/auth.ts matches src/** rule → Allow read" } },
  { title: { zh: "检查: 编辑 src 文件", en: "Check: Edit src File" }, desc: { zh: "同一文件的编辑操作也匹配 allow 规则", en: "Edit operation on same file also matches allow rule" } },
  { title: { zh: "检查: 编辑 node_modules", en: "Check: Edit node_modules" }, desc: { zh: "node_modules 下的文件禁止编辑 → 拒绝", en: "Files under node_modules are forbidden to edit → Deny" } },
  { title: { zh: "检查: 读取 .env", en: "Check: Read .env" }, desc: { zh: ".env* 模式匹配环境变量文件 → 拒绝（防止泄露密钥）", en: ".env* pattern matches env files → Deny (prevent key leakage)" } },
  { title: { zh: "检查: 读取用户目录", en: "Check: Read User Dir" }, desc: { zh: "~/Documents 匹配 ~/** → 需询问用户", en: "~/Documents matches ~/** → Need user approval" } },
  { title: { zh: "环境变量清洗", en: "Env Var Sanitization" }, desc: { zh: "子进程启动前清除敏感环境变量，防止通过 env 泄露", en: "Clean sensitive env vars before subprocess starts, prevent leakage via env" } },
];

const RESULT_COLORS = {
  allow: { bg: "bg-emerald-950/40", border: "border-emerald-700", text: "text-emerald-400" },
  deny: { bg: "bg-red-950/40", border: "border-red-700", text: "text-red-400" },
  ask: { bg: "bg-amber-950/40", border: "border-amber-700", text: "text-amber-400" },
};

export default function PermissionsVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 8, autoPlayInterval: 2500 });
  const { locale } = useLocale();
  const currentCheck = CHECKS_PER_STEP[viz.currentStep];
  const checkedResults = CHECKS_PER_STEP.slice(0, viz.currentStep + 1).filter(Boolean) as CheckResult[];

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "权限引擎" : "Permission Engine"}
      </h2>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 左侧：规则表 + 当前检查 */}
          <div className="w-full lg:w-[55%]">
            <div className="mb-3 font-mono text-xs text-zinc-500">Permission Rules</div>
            <div className="space-y-1.5 mb-4">
              {RULES.map((rule, i) => {
                const isMatched = currentCheck?.matchedRule === rule.pattern;
                return (
                  <motion.div
                    key={rule.pattern}
                    animate={{
                      borderColor: isMatched ? (rule.access === "allow" ? "#047857" : rule.access === "deny" ? "#b91c1c" : "#b45309") : "#27272a",
                      scale: isMatched ? 1.02 : 1,
                    }}
                    className={`flex items-center justify-between rounded border p-2 ${isMatched ? RESULT_COLORS[rule.access].bg : "bg-zinc-950"}`}
                  >
                    <span className="font-mono text-[11px] text-zinc-300">{rule.pattern}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-500">{rule.scope}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${RESULT_COLORS[rule.access].text} ${RESULT_COLORS[rule.access].bg}`}>
                        {rule.access.toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 环境变量清洗 */}
            {viz.currentStep === 7 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-1.5">
                <div className="font-mono text-xs text-zinc-500 mb-2">
                  subprocessEnv — {locale === "zh" ? "环境变量清洗" : "Environment Variable Sanitization"}
                </div>
                {ENV_VARS.map((v, i) => (
                  <motion.div
                    key={v.name}
                    initial={{opacity:0, x:-10}}
                    animate={{opacity:1, x:0}}
                    transition={{delay: i*0.1}}
                    className={`flex items-center justify-between rounded border p-2 ${v.status === "cleaned" ? "border-red-800 bg-red-950/20" : "border-zinc-800 bg-zinc-950"}`}
                  >
                    <span className="font-mono text-[11px] text-zinc-300">{v.name}</span>
                    <span className={`text-[10px] ${v.status === "cleaned" ? "text-red-400" : "text-emerald-400"}`}>{getLocalizedText(v.desc, locale)}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* 右侧：检查历史 */}
          <div className="w-full lg:w-[45%]">
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "检查记录" : "Check History"}
            </div>
            <div className="min-h-[320px] space-y-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="popLayout">
                {checkedResults.length === 0 && (
                  <motion.div key="e" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="py-16 text-center text-xs text-zinc-600">
                    {locale === "zh" ? "点击播放查看权限检查" : "Click play to view permission checks"}
                  </motion.div>
                )}
                {checkedResults.map((chk, i) => (
                  <motion.div
                    key={`${chk.path}-${i}`}
                    initial={{opacity:0, y:12}}
                    animate={{opacity:1, y:0}}
                    className={`rounded-lg border p-3 ${RESULT_COLORS[chk.result].bg} ${RESULT_COLORS[chk.result].border}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-zinc-200">{chk.tool}</span>
                      <span className={`text-xs font-bold ${RESULT_COLORS[chk.result].text}`}>
                        {chk.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">{chk.path}</div>
                    <div className="text-[9px] text-zinc-500 mt-1">matched: {chk.matchedRule}</div>
                  </motion.div>
                ))}
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
