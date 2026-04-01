"use client";

import { useState, useMemo } from "react";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "./shared/step-controls";
import { getLocalizedText, type LocalizedText } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

/* ═══════════════════════════════════════════════════════════════
   Buddy 电子宠物 — 生成流程 + 宠物卡片
   ═══════════════════════════════════════════════════════════════ */

const BUDDY_SPECIES = ["🦆duck", "🪿goose", "🫧blob", "🐱cat", "🐉dragon", "🐙octopus", "🦉owl", "🐧penguin", "🐢turtle", "🐌snail", "👻ghost", "🦎axolotl", "🦫capybara", "🌵cactus", "🤖robot", "🐰rabbit", "🍄mushroom", "🐾chonk"];
const BUDDY_RARITIES = [
  { name: "common", weight: 60, stars: "★", color: "#71717a" },
  { name: "uncommon", weight: 25, stars: "★★", color: "#22c55e" },
  { name: "rare", weight: 10, stars: "★★★", color: "#3b82f6" },
  { name: "epic", weight: 4, stars: "★★★★", color: "#a855f7" },
  { name: "legendary", weight: 1, stars: "★★★★★", color: "#f59e0b" },
];

const BUDDY_STEPS = [
  { title: { zh: "用户 ID → Hash Seed", en: "User ID → Hash Seed" }, desc: { zh: "取 Account UUID + 固定盐值 'friend-2026-401'，通过 FNV-1a 生成 32 位种子", en: "Take Account UUID + fixed salt 'friend-2026-401', generate 32-bit seed via FNV-1a" } },
  { title: { zh: "Mulberry32 PRNG 生成", en: "Mulberry32 PRNG Generation" }, desc: { zh: "确定性伪随机：同一用户永远生成同一只宠物，换设备也不变", en: "Deterministic pseudo-random: same user always generates same buddy, device-independent" } },
  { title: { zh: "物种 × 稀有度 × 属性", en: "Species × Rarity × Stats" }, desc: { zh: "18 种物种随机选取，加权稀有度抽取，5 项属性根据稀有度浮动", en: "18 species randomly selected, weighted rarity draw, 5 stats float based on rarity" } },
  { title: { zh: "ASCII 精灵渲染", en: "ASCII Sprite Rendering" }, desc: { zh: "500ms tick 动画帧，idle 序列 + 随机 fidget + 稀有眨眼", en: "500ms tick animation frames, idle sequence + random fidget + rare blink" } },
  { title: { zh: "愚人节窗口", en: "April Fools Window" }, desc: { zh: "2026.4.1-4.7 预告期 → 4.1 后永久可用 → /buddy 命令孵化", en: "2026.4.1-4.7 preview period → Permanent after 4.1 → /buddy command to hatch" } },
];

function BuddyViz({ step }: { step: number }) {
  const { locale } = useLocale();
  const demoSpecies = BUDDY_SPECIES[7]!; // penguin
  const demoRarity = BUDDY_RARITIES[2]!; // rare
  return (
    <div className="space-y-3">
      {/* 生成流程图 */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className={`rounded px-2 py-1 transition-all duration-300 ${step >= 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-zinc-900 text-zinc-600"}`}>
          👤 Account UUID
        </span>
        <span className={`transition-opacity ${step >= 0 ? "text-zinc-400" : "text-zinc-800"}`}>→</span>
        <span className={`rounded px-2 py-1 font-mono transition-all duration-300 ${step >= 1 ? "bg-blue-500/10 text-blue-400" : "bg-zinc-900 text-zinc-600"}`}>
          mulberry32(hash)
        </span>
        <span className={`transition-opacity ${step >= 1 ? "text-zinc-400" : "text-zinc-800"}`}>→</span>
        <span className={`rounded px-2 py-1 transition-all duration-300 ${step >= 2 ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-900 text-zinc-600"}`}>
          {locale === "zh" ? "物种 + 稀有度 + 属性" : "Species + Rarity + Stats"}
        </span>
        <span className={`transition-opacity ${step >= 2 ? "text-zinc-400" : "text-zinc-800"}`}>→</span>
        <span className={`rounded px-2 py-1 transition-all duration-300 ${step >= 3 ? "bg-purple-500/10 text-purple-400" : "bg-zinc-900 text-zinc-600"}`}>
          {locale === "zh" ? "ASCII 精灵" : "ASCII Sprite"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 左: 物种池 + 稀有度 */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">
            {step >= 2
              ? (locale === "zh" ? "✓ 抽取结果" : "✓ Draw Result")
              : (locale === "zh" ? "物种池 (18 种)" : "Species Pool (18)")}
          </div>
          <div className="flex flex-wrap gap-1">
            {BUDDY_SPECIES.map((s, i) => (
              <span key={i} className={`rounded px-1.5 py-0.5 text-[10px] transition-all duration-500 ${step >= 2 && i === 7 ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40" : step >= 2 ? "bg-zinc-900 text-zinc-700" : "bg-zinc-900 text-zinc-400"
                }`}>{s}</span>
            ))}
          </div>
          {step >= 2 && (
            <div className="mt-2 space-y-1">
              <div className="text-[10px] text-zinc-500">
                {locale === "zh" ? "稀有度加权抽取:" : "Weighted Rarity Draw:"}
              </div>
              {BUDDY_RARITIES.map((r) => (
                <div key={r.name} className="flex items-center gap-2 text-[10px]">
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${r.weight}%`, backgroundColor: r.name === "rare" && step >= 2 ? r.color : r.color + "40" }} />
                  <span style={{ color: r.name === "rare" && step >= 2 ? r.color : "#52525b" }}>{r.stars} {r.weight}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右: 宠物卡片 */}
        <div className={`rounded-lg border p-3 transition-all duration-500 ${step >= 3 ? "border-blue-500/30 bg-zinc-900" : "border-zinc-800 bg-zinc-950"}`}>
          <div className="mb-2 text-[10px] font-medium text-zinc-500">
            {step >= 3
              ? (locale === "zh" ? "🎉 你的宠物" : "🎉 Your Buddy")
              : (locale === "zh" ? "等待生成..." : "Generating...")}
          </div>
          {step >= 3 ? (
            <div className="text-center space-y-1">
              <div className="text-3xl">{demoSpecies.slice(0, 2)}</div>
              <div className="text-xs font-semibold text-zinc-200">Inky</div>
              <div className="text-[10px]" style={{ color: demoRarity.color }}>{demoRarity.stars} {demoRarity.name}</div>
              <div className="text-[10px] text-zinc-500">eye: ✦ · hat: wizard · shiny: ✗</div>
              <div className="flex justify-center gap-1 mt-1">
                {["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"].map((stat, i) => (
                  <div key={stat} className="text-center">
                    <div className="h-8 w-3 rounded-full bg-zinc-800 relative overflow-hidden">
                      <div className="absolute bottom-0 w-full rounded-full transition-all duration-700" style={{
                        height: step >= 3 ? `${30 + i * 15}%` : "0%",
                        backgroundColor: demoRarity.color + "80",
                      }} />
                    </div>
                    <div className="text-[7px] text-zinc-600 mt-0.5">{stat.slice(0, 3)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-zinc-700 text-xs">
              {step === 0
                ? (locale === "zh" ? "需要用户 ID..." : "Need User ID...")
                : step === 1
                  ? (locale === "zh" ? "PRNG 初始化中..." : "PRNG Initializing...")
                  : (locale === "zh" ? "等待抽取..." : "Waiting for Draw...")}
            </div>
          )}
          {step >= 4 && (
            <div className="mt-2 rounded bg-emerald-500/10 px-2 py-1 text-center text-[10px] text-emerald-400">
              {locale === "zh" ? "📅 2026.4.1 愚人节上线 → /buddy 孵化" : "📅 April Fools 2026.4.1 → /buddy hatch"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Kairos 助手模式 — 子系统架构 + 循环流程
   ═══════════════════════════════════════════════════════════════ */

const KAIROS_STEPS = [
  { title: { zh: "模式激活", en: "Mode Activation" }, desc: { zh: "GrowthBook gate + 信任检查 → kairosEnabled 单一状态源", en: "GrowthBook gate + trust check → kairosEnabled single source of truth" } },
  { title: { zh: "主动循环", en: "Proactive Loop" }, desc: { zh: "模型自主执行 sleep/tick 调度，队列空时自动注入 proactive_tick", en: "Model autonomously executes sleep/tick scheduling, auto-inject proactive_tick when queue empty" } },
  { title: { zh: "频道通知", en: "Channel Notification" }, desc: { zh: "MCP server 推送事件 → 注入消息队列 → 模型决定用哪个工具回复", en: "MCP server pushes events → Inject into message queue → Model decides which tool to reply with" } },
  { title: { zh: "Cron 定时调度", en: "Cron Scheduled Tasks" }, desc: { zh: "cron 表达式触发 → jitter 防负载尖峰 → 一次性 vs 循环任务", en: "Cron expression triggered → Jitter prevents load spikes → One-time vs recurring tasks" } },
  { title: { zh: "记忆整合", en: "Memory Integration" }, desc: { zh: "autoDream 与 Kairos 互斥 → Kairos 用 disk-skill dream 独立策略", en: "autoDream and Kairos mutually exclusive → Kairos uses disk-skill dream independent strategy" } },
];

const KAIROS_SUBSYSTEMS = [
  { id: "proactive", label: { zh: "主动循环", en: "Proactive Loop" }, icon: "🔄", desc: { zh: "sleep/tick 自主执行", en: "sleep/tick autonomous execution" } },
  { id: "channels", label: { zh: "频道通知", en: "Channel Notify" }, icon: "📨", desc: { zh: "MCP 事件推送", en: "MCP event push" } },
  { id: "cron", label: { zh: "Cron 调度", en: "Cron Scheduler" }, icon: "⏰", desc: { zh: "定时任务触发", en: "Scheduled task trigger" } },
  { id: "transcript", label: { zh: "会话转录", en: "Transcript" }, icon: "📝", desc: { zh: "压缩时写入段", en: "Write segments on compaction" } },
  { id: "dream", label: { zh: "记忆整合", en: "Memory Merge" }, icon: "💭", desc: { zh: "disk-skill dream", en: "disk-skill dream" } },
  { id: "brief", label: { zh: "简报命令", en: "Brief Command" }, icon: "📋", desc: { zh: "/brief 生成摘要", en: "/brief generate summary" } },
];

function KairosViz({ step }: { step: number }) {
  const { locale } = useLocale();
  const activeSubsystems = step === 0 ? [] : step === 1 ? ["proactive"] : step === 2 ? ["proactive", "channels"] : step === 3 ? ["proactive", "channels", "cron"] : ["proactive", "channels", "cron", "transcript", "dream", "brief"];
  return (
    <div className="space-y-3">
      {/* 核心循环图 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">
          {locale === "zh" ? "Kairos 运行循环" : "Kairos Runtime Loop"}
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className={`rounded px-2 py-1 transition-all ${step >= 0 ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30" : "bg-zinc-900 text-zinc-600"}`}>
            kairosEnabled=true
          </span>
          <span className="text-zinc-600">→</span>
          <span className={`rounded px-2 py-1 transition-all ${step >= 1 ? "bg-blue-500/10 text-blue-400" : "bg-zinc-900 text-zinc-600"}`}>
            {locale === "zh" ? "proactive tick 注入" : "proactive tick injection"}
          </span>
          <span className="text-zinc-600">→</span>
          <span className={`rounded px-2 py-1 transition-all ${step >= 1 ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-900 text-zinc-600"}`}>
            {locale === "zh" ? "模型自主执行" : "model autonomous execution"}
          </span>
          <span className={`text-zinc-600 ${step >= 1 ? "" : "opacity-0"}`}>↻</span>
        </div>
      </div>

      {/* 子系统网格 */}
      <div className="grid grid-cols-3 gap-2">
        {KAIROS_SUBSYSTEMS.map((sub) => {
          const isActive = activeSubsystems.includes(sub.id);
          return (
            <div key={sub.id} className={`rounded-lg border p-2.5 text-center transition-all duration-500 ${isActive ? "border-purple-500/30 bg-purple-500/5" : "border-zinc-800/50 bg-zinc-950 opacity-40"}`}>
              <div className="text-lg">{sub.icon}</div>
              <div className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-purple-300" : "text-zinc-600"}`}>
                {getLocalizedText(sub.label, locale)}
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5">
                {getLocalizedText(sub.desc, locale)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 互斥说明 */}
      {step >= 4 && (
        <div className="rounded bg-yellow-500/5 border border-yellow-500/20 px-3 py-2 text-[10px] text-yellow-400/80">
          {locale === "zh"
            ? <>⚠️ autoDream 与 Kairos 互斥: <code className="bg-zinc-800 px-1 rounded">getKairosActive() → return false</code> — Kairos 用自己的 disk-skill dream 策略</>
            : <>⚠️ autoDream and Kairos are mutually exclusive: <code className="bg-zinc-800 px-1 rounded">getKairosActive() → return false</code> — Kairos uses its own disk-skill dream strategy</>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Ultraplan 深度规划 — 状态机 + 执行路径
   ═══════════════════════════════════════════════════════════════ */

const ULTRAPLAN_STEPS = [
  { title: { zh: "触发检测", en: "Trigger Detection" }, desc: { zh: "输入包含 'ultraplan' → 排除引号/路径/问句 → 触发远程规划", en: "Input contains 'ultraplan' → Exclude quotes/paths/questions → Trigger remote planning" } },
  { title: { zh: "远程会话创建", en: "Remote Session Creation" }, desc: { zh: "teleportToRemote() → CCR (Claude Code on Web) → Opus 4.6 模型", en: "teleportToRemote() → CCR (Claude Code on Web) → Opus 4.6 model" } },
  { title: { zh: "状态机轮询", en: "State Machine Polling" }, desc: { zh: "running ↔ needs_input → plan_ready，30 分钟超时", en: "running ↔ needs_input → plan_ready, 30-minute timeout" } },
  { title: { zh: "方案审批分叉", en: "Plan Approval Fork" }, desc: { zh: "用户选择: Web 上执行 (PR) 或传回本地终端执行", en: "User choice: Execute on Web (PR) or pass back to local terminal" } },
];

function UltraplanViz({ step }: { step: number }) {
  const { locale } = useLocale();
  const phases = ["running", "needs_input", "plan_ready", "approved"] as const;
  const activePhase = step === 0 ? -1 : step === 1 ? 0 : step === 2 ? 2 : 3;
  return (
    <div className="space-y-3">
      {/* 触发条件 */}
      {step === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">
            {locale === "zh" ? "关键词触发逻辑" : "Keyword Trigger Logic"}
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="text-emerald-400">{locale === "zh" ? '✓ "please ultraplan the auth module" → 触发' : '✓ "please ultraplan the auth module" → Triggered'}</div>
            <div className="text-red-400">{locale === "zh" ? '✗ "src/ultraplan/foo.ts" → 路径上下文，不触发' : '✗ "src/ultraplan/foo.ts" → Path context, not triggered'}</div>
            <div className="text-red-400">{locale === "zh" ? '✗ "what is ultraplan?" → 问句，不触发' : '✗ "what is ultraplan?" → Question, not triggered'}</div>
            <div className="text-red-400">{locale === "zh" ? "✗ `ultraplan` → 在反引号内，不触发" : "✗ `ultraplan` → Inside backticks, not triggered"}</div>
            <div className="text-red-400">{locale === "zh" ? '✗ "/rename ultraplan foo" → slash 命令，不触发' : '✗ "/rename ultraplan foo" → Slash command, not triggered'}</div>
          </div>
        </div>
      )}

      {/* 状态机 */}
      {step >= 1 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">
            {locale === "zh" ? "Ultraplan 状态机" : "Ultraplan State Machine"}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {phases.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <span className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all duration-500 ${i <= activePhase ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30" : "bg-zinc-900 text-zinc-600"
                  } ${i === activePhase ? "scale-105" : ""}`}>
                  {p === "running" ? "🔄 running" : p === "needs_input" ? "⏸️ needs_input" : p === "plan_ready" ? "✅ plan_ready" : "🎉 approved"}
                </span>
                {i < phases.length - 1 && <span className="text-zinc-600 text-xs">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-zinc-500">
            <span>{locale === "zh" ? "模型: Opus 4.6" : "Model: Opus 4.6"}</span>
            <span>{locale === "zh" ? "超时: 30 min" : "Timeout: 30 min"}</span>
            <span>{locale === "zh" ? "需要: /login OAuth" : "Requires: /login OAuth"}</span>
          </div>
        </div>
      )}

      {/* 执行路径分叉 */}
      {step >= 3 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="text-xs font-semibold text-emerald-400 mb-1">
              {locale === "zh" ? "路径 A: Web 执行" : "Path A: Web Execution"}
            </div>
            <div className="text-[10px] text-zinc-400 space-y-0.5">
              <div>{locale === "zh" ? "→ 远程 session 继续编码" : "→ Remote session continues coding"}</div>
              <div>{locale === "zh" ? "→ 结果作为 PR 提交" : "→ Results submitted as PR"}</div>
              <div>→ {locale === "zh" ? '本地通知: "Results will land as PR"' : 'Local notification: "Results will land as PR"'}</div>
            </div>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="text-xs font-semibold text-blue-400 mb-1">
              {locale === "zh" ? "路径 B: 传回本地" : "Path B: Pass Back to Local"}
            </div>
            <div className="text-[10px] text-zinc-400 space-y-0.5">
              <div>{locale === "zh" ? '→ 浏览器点击 "teleport back"' : '→ Browser clicks "teleport back"'}</div>
              <div>{locale === "zh" ? "→ plan 通过 feedback 传回" : "→ Plan passed back via feedback"}</div>
              <div>{locale === "zh" ? "→ 本地 REPL 弹出确认对话框" : "→ Local REPL pops up confirmation dialog"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Undercover 卧底模式 — 判断流程 + 注入链路
   ═══════════════════════════════════════════════════════════════ */

const UNDERCOVER_STEPS = [
  { title: { zh: "仓库分类检测", en: "Repository Classification" }, desc: { zh: "解析 git remote → 匹配内部仓库白名单 → 判断 internal/external", en: "Parse git remote → Match internal repo whitelist → Determine internal/external" } },
  { title: { zh: "激活决策", en: "Activation Decision" }, desc: { zh: "非内部仓库自动 ON，无 force-OFF → 安全默认", en: "Auto ON for non-internal repos, no force-OFF → Safe default" } },
  { title: { zh: "指令注入链路", en: "Instruction Injection Chain" }, desc: { zh: "系统提示 + commit + PR + Bash 四个集成点全链路防护", en: "System prompt + commit + PR + Bash four integration points full-chain protection" } },
];

function UndercoverViz({ step }: { step: number }) {
  const { locale } = useLocale();
  return (
    <div className="space-y-3">
      {/* 判断流程 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">
          {locale === "zh" ? "isUndercover() 判断流程" : "isUndercover() Decision Flow"}
        </div>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 0 ? "opacity-100" : "opacity-30"}`}>
            <span className="rounded bg-zinc-800 px-2 py-1 font-mono">USER_TYPE === &apos;ant&apos;?</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded bg-red-500/10 px-2 py-1 text-red-400">
              {locale === "zh" ? "external: return false (DCE)" : "external: return false (DCE)"}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 0 ? "opacity-100" : "opacity-30"}`}>
            <span className="text-zinc-600 pl-4">
              {locale === "zh" ? "↓ ant 构建" : "↓ ant build"}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 0 ? "opacity-100" : "opacity-30"}`}>
            <span className="rounded bg-zinc-800 px-2 py-1 font-mono">CLAUDE_CODE_UNDERCOVER=1?</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded bg-yellow-500/10 px-2 py-1 text-yellow-400">
              {locale === "zh" ? "强制 ON" : "Force ON"}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 1 ? "opacity-100" : "opacity-30"}`}>
            <span className="text-zinc-600 pl-4">
              {locale === "zh" ? "↓ 未强制" : "↓ Not forced"}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 1 ? "opacity-100" : "opacity-30"}`}>
            <span className="rounded bg-zinc-800 px-2 py-1 font-mono">getRepoClassCached()</span>
            <span className="text-zinc-500">→</span>
            <div className="flex gap-1">
              <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">
                {locale === "zh" ? "'internal' → OFF" : "'internal' → OFF"}
              </span>
              <span className="rounded bg-red-500/10 px-2 py-1 text-red-400">
                {locale === "zh" ? "其他 → ON" : "Others → ON"}
              </span>
            </div>
          </div>
        </div>
        {step >= 1 && (
          <div className="mt-2 rounded bg-red-500/5 border border-red-500/20 px-2 py-1 text-[10px] text-red-400/80">
            {locale === "zh"
              ? "⚠️ 没有 force-OFF — 不确定时永远开启"
              : "⚠️ No force-OFF — Always ON when uncertain"}
          </div>
        )}
      </div>

      {/* 注入链路 */}
      {step >= 2 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: { zh: "系统提示", en: "System Prompt" }, file: "prompts.ts", icon: "📝" },
            { label: { zh: "commit", en: "commit" }, file: "commit.ts", icon: "📦" },
            { label: { zh: "PR", en: "PR" }, file: "commit-push-pr.ts", icon: "🔀" },
            { label: { zh: "Bash", en: "Bash" }, file: "BashTool/prompt.ts", icon: "💻" },
          ].map((point) => (
            <div key={typeof point.label === "string" ? point.label : point.label.zh} className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-center">
              <div className="text-lg">{point.icon}</div>
              <div className="text-[10px] font-semibold text-red-300 mt-0.5">
                {getLocalizedText(point.label, locale)}
              </div>
              <div className="text-[8px] text-zinc-500 font-mono mt-0.5">{point.file}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Daemon 守护进程 — 架构图 + 进程树
   ═══════════════════════════════════════════════════════════════ */

const DAEMON_STEPS = [
  { title: { zh: "进程架构", en: "Process Architecture" }, desc: { zh: "用户启动 claude daemon → Supervisor 管理 Worker 生命周期", en: "User starts claude daemon → Supervisor manages Worker lifecycle" } },
  { title: { zh: "Worker 种类", en: "Worker Types" }, desc: { zh: "remoteControl (无头桥接) + cron (定时任务) + 可扩展", en: "remoteControl (headless bridge) + cron (scheduled tasks) + extensible" } },
  { title: { zh: "崩溃恢复", en: "Crash Recovery" }, desc: { zh: "Worker 崩溃 → Supervisor 检查退出码 → 瞬态重试 / 永久放弃", en: "Worker crashes → Supervisor checks exit code → Transient retry / permanent abandon" } },
];

function DaemonViz({ step }: { step: number }) {
  const { locale } = useLocale();
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">
          {locale === "zh" ? "Daemon 进程树" : "Daemon Process Tree"}
        </div>
        <div className="space-y-1 font-mono text-xs">
          <div className={`transition-all ${step >= 0 ? "text-emerald-400" : "text-zinc-600"}`}>
            $ claude daemon start
          </div>
          <div className={`pl-2 transition-all ${step >= 0 ? "text-zinc-300" : "text-zinc-700"}`}>
            ├── <span className="text-yellow-400">Supervisor</span> (PID 12345)
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-300" : "text-zinc-700"}`}>
            {locale === "zh" ? "│   ├── 配置: daemon.json" : "│   ├── Config: daemon.json"}
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-300" : "text-zinc-700"}`}>
            {locale === "zh" ? "│   └── 认证: AuthManager (OAuth)" : "│   └── Auth: AuthManager (OAuth)"}
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-blue-400" : "text-zinc-700"}`}>
            ├── Worker[remoteControl]
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            │   ├── runBridgeHeadless()
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            {locale === "zh" ? "│   ├── 无 TUI · 无 readline · 无 process.exit" : "│   ├── No TUI · No readline · No process.exit"}
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            {locale === "zh" ? "│   └── 认证: IPC ← Supervisor" : "│   └── Auth: IPC ← Supervisor"}
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-purple-400" : "text-zinc-700"}`}>
            └── Worker[cron]
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            {"    "}└── filter: t =&gt; t.permanent
          </div>
        </div>
      </div>

      {step >= 2 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">
            {locale === "zh" ? "崩溃恢复机制" : "Crash Recovery Mechanism"}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded bg-emerald-500/5 border border-emerald-500/20 p-2 text-center">
              <div className="text-xs font-semibold text-emerald-400">
                {locale === "zh" ? "瞬态错误" : "Transient Error"}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                {locale === "zh" ? "网络超时 / API 429" : "Network timeout / API 429"}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {locale === "zh" ? "→ 指数退避重试" : "→ Exponential backoff retry"}
              </div>
            </div>
            <div className="flex-1 rounded bg-red-500/5 border border-red-500/20 p-2 text-center">
              <div className="text-xs font-semibold text-red-400">
                {locale === "zh" ? "永久错误" : "Permanent Error"}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                {locale === "zh" ? "信任未接受 / HTTPS 错误" : "Trust not accepted / HTTPS error"}
              </div>
              <div className="text-[10px] text-red-400 mt-0.5">
                {locale === "zh" ? "→ 停止重试，Worker 休眠" : "→ Stop retry, Worker sleeps"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UDS 跨会话通信 — 寻址方式 + 消息流
   ═══════════════════════════════════════════════════════════════ */

const UDS_STEPS = [
  { title: { zh: "Socket 创建", en: "Socket Creation" }, desc: { zh: "启动时创建 UDS socket → 路径写入 PID 文件 → 其他会话可发现", en: "Create UDS socket on startup → Path written to PID file → Discoverable by other sessions" } },
  { title: { zh: "三种寻址", en: "Three Addressing Modes" }, desc: { zh: "teammate 名字 / UDS 本地路径 / Bridge 远程会话 ID", en: "Teammate name / UDS local path / Bridge remote session ID" } },
  { title: { zh: "消息流转", en: "Message Flow" }, desc: { zh: "发送方 SendMessageTool → UDS/Bridge 传输 → 接收方消息队列注入", en: "Sender SendMessageTool → UDS/Bridge transport → Receiver message queue injection" } },
];

function UdsViz({ step }: { step: number }) {
  const { locale } = useLocale();
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">
          {locale === "zh" ? "跨会话通信架构" : "Cross-Session Communication Architecture"}
        </div>

        {/* 会话示意 */}
        <div className="flex items-start gap-4">
          <div className={`flex-1 rounded border p-2 transition-all ${step >= 0 ? "border-blue-500/30 bg-blue-500/5" : "border-zinc-800"}`}>
            <div className="text-[10px] font-semibold text-blue-400">Session A</div>
            <div className="text-[9px] text-zinc-500 font-mono mt-1">PID: 12345</div>
            <div className={`text-[9px] font-mono mt-0.5 transition-all ${step >= 0 ? "text-cyan-400" : "text-zinc-600"}`}>
              socket: /tmp/claude-a.sock
            </div>
          </div>

          <div className={`flex flex-col items-center gap-1 pt-3 transition-all ${step >= 2 ? "opacity-100" : "opacity-30"}`}>
            <div className="text-[9px] text-zinc-500">SendMessageTool</div>
            <div className="text-zinc-500">⇄</div>
            <div className="text-[9px] text-zinc-500">&lt;cross-session-message&gt;</div>
          </div>

          <div className={`flex-1 rounded border p-2 transition-all ${step >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800"}`}>
            <div className="text-[10px] font-semibold text-emerald-400">Session B</div>
            <div className="text-[9px] text-zinc-500 font-mono mt-1">PID: 67890</div>
            <div className={`text-[9px] font-mono mt-0.5 transition-all ${step >= 0 ? "text-cyan-400" : "text-zinc-600"}`}>
              socket: /tmp/claude-b.sock
            </div>
          </div>
        </div>
      </div>

      {/* 寻址方式 */}
      {step >= 1 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { addr: '"teammate-name"', label: locale === "zh" ? "Swarm 内部" : "Swarm Internal", icon: "👥", color: "emerald" },
            { addr: '"uds:/path.sock"', label: locale === "zh" ? "本地 (同机器)" : "Local (same machine)", icon: "🔌", color: "cyan" },
            { addr: '"bridge:session_..."', label: locale === "zh" ? "远程 (跨机器)" : "Remote (cross-machine)", icon: "🌐", color: "purple" },
          ].map((a) => (
            <div key={a.addr} className={`rounded-lg border border-${a.color}-500/20 bg-${a.color}-500/5 p-2 text-center`} style={{ borderColor: `var(--${a.color}, #27272a)20` }}>
              <div className="text-sm">{a.icon}</div>
              <div className="text-[10px] font-semibold text-zinc-300 mt-0.5">{a.label}</div>
              <div className="text-[8px] text-zinc-500 font-mono mt-0.5">{a.addr}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   主组件 — Tab 切换 + 各功能独立 Viz
   ═══════════════════════════════════════════════════════════════ */

interface FeatureTab {
  id: string;
  name: string;
  icon: string;
  color: string;
  flag: string;
  steps: { title: LocalizedText; desc: LocalizedText }[];
  Viz: React.ComponentType<{ step: number }>;
}

const TABS: FeatureTab[] = [
  { id: "buddy", name: "Buddy", icon: "🐾", color: "#F59E0B", flag: "BUDDY", steps: BUDDY_STEPS, Viz: BuddyViz },
  { id: "kairos", name: "Kairos", icon: "🧠", color: "#8B5CF6", flag: "KAIROS", steps: KAIROS_STEPS, Viz: KairosViz },
  { id: "ultraplan", name: "Ultraplan", icon: "📋", color: "#3B82F6", flag: "ULTRAPLAN", steps: ULTRAPLAN_STEPS, Viz: UltraplanViz },
  { id: "undercover", name: "Undercover", icon: "🕵️", color: "#EF4444", flag: "ant-only", steps: UNDERCOVER_STEPS, Viz: UndercoverViz },
  { id: "daemon", name: "Daemon", icon: "⚙️", color: "#10B981", flag: "DAEMON", steps: DAEMON_STEPS, Viz: DaemonViz },
  { id: "uds", name: "UDS", icon: "📡", color: "#06B6D4", flag: "UDS_INBOX", steps: UDS_STEPS, Viz: UdsViz },
];

export default function Ch13HiddenFeatures() {
  const [activeTab, setActiveTab] = useState(0);
  const { locale } = useLocale();
  const tab = TABS[activeTab]!;
  const { currentStep, totalSteps, next, prev, reset, isPlaying, toggleAutoPlay } =
    useSteppedVisualization({ totalSteps: tab.steps.length });

  // 切换 Tab 时重置步进
  const handleTabChange = (i: number) => { setActiveTab(i); reset(); };

  const VizComponent = tab.Viz;

  return (
    <div className="space-y-4">
      {/* Feature Tab 选择 */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(i)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${i === activeTab
              ? "text-white border-transparent"
              : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-zinc-800"
              }`}
            style={i === activeTab ? { backgroundColor: t.color + "15", color: t.color, borderColor: t.color + "40" } : {}}
          >
            <span>{t.icon}</span>
            <span>{t.name}</span>
            <span className="font-mono text-[9px] opacity-60">{t.flag}</span>
          </button>
        ))}
      </div>

      {/* 步进控制 */}
      <StepControls
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrev={prev}
        onNext={next}
        onReset={reset}
        isPlaying={isPlaying}
        onToggleAutoPlay={toggleAutoPlay}
        stepTitle={getLocalizedText(tab.steps[currentStep]?.title ?? { zh: "", en: "" }, locale)}
        stepDescription={getLocalizedText(tab.steps[currentStep]?.desc ?? { zh: "", en: "" }, locale)}
      />

      {/* 可视化区域 */}
      <VizComponent step={currentStep} />

      {/* 底部统计 */}
      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-600">
        <span>30+ Feature Flags</span>
        <span>·</span>
        <span>{locale === "zh" ? "209 处 feature() 调用" : "209 feature() calls"}</span>
        <span>·</span>
        <span>{locale === "zh" ? "199 个文件涉及" : "199 files involved"}</span>
      </div>
    </div>
  );
}
