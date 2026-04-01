"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "@/components/visualizations/shared/step-controls";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

interface Plugin { name: string; type: string; status: "scanning" | "validating" | "loaded" | "rejected"; capabilities: string[]; }

const PLUGINS_PER_STEP: Plugin[][] = [
  [],
  [{ name: "eslint-fixer", type: "DXT", status: "scanning", capabilities: [] }],
  [{ name: "eslint-fixer", type: "DXT", status: "validating", capabilities: ["BashTool", "FileRead"] }],
  [{ name: "eslint-fixer", type: "DXT", status: "loaded", capabilities: ["BashTool", "FileRead"] }],
  [
    { name: "eslint-fixer", type: "DXT", status: "loaded", capabilities: ["BashTool", "FileRead"] },
    { name: "malicious-tool", type: "npm", status: "scanning", capabilities: [] },
  ],
  [
    { name: "eslint-fixer", type: "DXT", status: "loaded", capabilities: ["BashTool", "FileRead"] },
    { name: "malicious-tool", type: "npm", status: "rejected", capabilities: ["NetworkAccess", "FileWrite(/etc)"] },
  ],
  [
    { name: "eslint-fixer", type: "DXT", status: "loaded", capabilities: ["BashTool", "FileRead"] },
    { name: "db-helper", type: "Skill", status: "loaded", capabilities: ["MCPTool.database"] },
    { name: "test-runner", type: "DXT", status: "loaded", capabilities: ["BashTool"] },
  ],
];

const PROCESS_LOG_PER_STEP: LocalizedText[] = [
  { zh: "", en: "" },
  { zh: "pluginLoader.scan()\n  发现: ~/.claude/plugins/eslint-fixer.dxt", en: "pluginLoader.scan()\n  Found: ~/.claude/plugins/eslint-fixer.dxt" },
  { zh: "验证 manifest.json:\n  ✓ name: eslint-fixer\n  ✓ version: 1.0.0\n  ✓ permissions: [BashTool, FileRead]\n  ✓ 签名验证通过\n  ✓ 沙箱约束检查通过", en: "Validate manifest.json:\n  ✓ name: eslint-fixer\n  ✓ version: 1.0.0\n  ✓ permissions: [BashTool, FileRead]\n  ✓ Signature verified\n  ✓ Sandbox constraints passed" },
  { zh: "注入能力:\n  toolRegistry.register('eslint-fix', handler)\n  permissions.grant('eslint-fixer', [\n    'BashTool:eslint --fix',\n    'FileRead:src/**'\n  ])\n  ✓ 插件加载完成", en: "Inject capabilities:\n  toolRegistry.register('eslint-fix', handler)\n  permissions.grant('eslint-fixer', [\n    'BashTool:eslint --fix',\n    'FileRead:src/**'\n  ])\n  ✓ Plugin loaded" },
  { zh: "pluginLoader.scan()\n  发现: npm:malicious-tool\n  → 开始验证...", en: "pluginLoader.scan()\n  Found: npm:malicious-tool\n  → Start validation..." },
  { zh: "验证 manifest.json:\n  ✓ name: malicious-tool\n  ✗ permissions: [NetworkAccess] — 不允许!\n  ✗ FileWrite(/etc) — 超出沙箱!\n  → 拒绝加载: 权限不安全", en: "Validate manifest.json:\n  ✓ name: malicious-tool\n  ✗ permissions: [NetworkAccess] — Not allowed!\n  ✗ FileWrite(/etc) — Outside sandbox!\n  → Rejected: Unsafe permissions" },
  { zh: "最终状态:\n  已加载: 3 个插件\n  已拒绝: 1 个插件\n\n  总工具数: 50 + 3 = 53\n  (原生工具 + 插件工具)", en: "Final state:\n  Loaded: 3 plugins\n  Rejected: 1 plugin\n\n  Total tools: 50 + 3 = 53\n  (Native tools + Plugin tools)" },
];

const STATUS_MAP = {
  scanning: { color: "text-cyan-400", bg: "border-cyan-800 bg-cyan-950/20" },
  validating: { color: "text-amber-400", bg: "border-amber-800 bg-amber-950/20" },
  loaded: { color: "text-emerald-400", bg: "border-emerald-800 bg-emerald-950/20" },
  rejected: { color: "text-red-400", bg: "border-red-800 bg-red-950/20" },
};

const STEP_INFO = [
  { title: { zh: "插件生态概览", en: "Plugin Ecosystem Overview" }, desc: { zh: "pluginLoader (108KB) 负责发现、验证、加载插件，扩展 Agent 能力", en: "pluginLoader (108KB) discovers, validates, loads plugins to extend Agent capabilities" } },
  { title: { zh: "插件发现", en: "Plugin Discovery" }, desc: { zh: "扫描 ~/.claude/plugins/ 和项目配置，发现 DXT / npm / Skill 插件", en: "Scan ~/.claude/plugins/ and project config, discover DXT / npm / Skill plugins" } },
  { title: { zh: "安全验证", en: "Security Validation" }, desc: { zh: "检查 manifest 声明、权限请求、签名验证、沙箱约束", en: "Check manifest declarations, permission requests, signature verification, sandbox constraints" } },
  { title: { zh: "能力注入", en: "Capability Injection" }, desc: { zh: "验证通过 → 注册工具到 toolRegistry + 授予受限权限", en: "Validation passed → Register tool to toolRegistry + Grant limited permissions" } },
  { title: { zh: "发现可疑插件", en: "Suspicious Plugin Found" }, desc: { zh: "继续扫描发现另一个插件，进入验证流程", en: "Continue scanning finds another plugin, enter validation process" } },
  { title: { zh: "拒绝不安全插件", en: "Reject Unsafe Plugin" }, desc: { zh: "请求了 NetworkAccess 和 /etc 写入权限 → 拒绝加载", en: "Requested NetworkAccess and /etc write permissions → Reject loading" } },
  { title: { zh: "最终插件表", en: "Final Plugin Table" }, desc: { zh: "3 个插件成功加载，1 个被拒绝，工具总数 53", en: "3 plugins loaded successfully, 1 rejected, total 53 tools" } },
];

export default function PluginLoaderVisualization() {
  const viz = useSteppedVisualization({ totalSteps: 7, autoPlayInterval: 3000 });
  const { locale } = useLocale();
  const plugins = PLUGINS_PER_STEP[viz.currentStep];

  return (
    <section className="min-h-[520px] space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">
        {locale === "zh" ? "插件加载器" : "Plugin Loader"}
      </h2>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[45%]">
            <div className="mb-3 font-mono text-xs text-zinc-500">Loaded Plugins</div>
            <div className="min-h-[340px] space-y-2 rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="popLayout">
                {plugins.length === 0 && (
                  <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-16 text-center text-xs text-zinc-600">Empty</motion.div>
                )}
                {plugins.map((p) => {
                  const st = STATUS_MAP[p.status];
                  return (
                    <motion.div key={p.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg border p-3 ${st.bg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-zinc-100">{p.name}</span>
                          <span className="rounded bg-zinc-800 px-1 py-0.5 text-[8px] text-zinc-500">{p.type}</span>
                        </div>
                        <span className={`text-[10px] font-bold ${st.color}`}>{p.status.toUpperCase()}</span>
                      </div>
                      {p.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.capabilities.map((c) => (
                            <span key={c} className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${p.status === "rejected" ? "bg-red-900/40 text-red-300" : "bg-zinc-800 text-zinc-400"
                              }`}>{c}</span>
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
            <div className="mb-2 font-mono text-xs text-zinc-500">
              {locale === "zh" ? "加载日志" : "Loading Log"}
            </div>
            <div className="min-h-[340px] rounded-md border border-zinc-800 bg-zinc-950 p-3">
              <AnimatePresence mode="wait">
                {getLocalizedText(PROCESS_LOG_PER_STEP[viz.currentStep], locale) ? (
                  <motion.pre key={viz.currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300">
                    {getLocalizedText(PROCESS_LOG_PER_STEP[viz.currentStep], locale)}
                  </motion.pre>
                ) : (
                  <motion.div key="e" className="flex h-full min-h-[300px] items-center justify-center text-xs text-zinc-600">
                    {locale === "zh" ? "点击播放查看插件加载过程" : "Click play to view plugin loading"}
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
