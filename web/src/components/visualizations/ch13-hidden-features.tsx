"use client";

import { useState, useMemo } from "react";
import { useSteppedVisualization } from "@/hooks/useSteppedVisualization";
import { StepControls } from "./shared/step-controls";

/* ═══════════════════════════════════════════════════════════════
   Buddy 电子宠物 — 生成流程 + 宠物卡片
   ═══════════════════════════════════════════════════════════════ */

const BUDDY_SPECIES = ["🦆duck","🪿goose","🫧blob","🐱cat","🐉dragon","🐙octopus","🦉owl","🐧penguin","🐢turtle","🐌snail","👻ghost","🦎axolotl","🦫capybara","🌵cactus","🤖robot","🐰rabbit","🍄mushroom","🐾chonk"];
const BUDDY_RARITIES = [
  { name: "common", weight: 60, stars: "★", color: "#71717a" },
  { name: "uncommon", weight: 25, stars: "★★", color: "#22c55e" },
  { name: "rare", weight: 10, stars: "★★★", color: "#3b82f6" },
  { name: "epic", weight: 4, stars: "★★★★", color: "#a855f7" },
  { name: "legendary", weight: 1, stars: "★★★★★", color: "#f59e0b" },
];

const BUDDY_STEPS = [
  { title: "用户 ID → Hash Seed", desc: "取 Account UUID + 固定盐值 'friend-2026-401'，通过 FNV-1a 生成 32 位种子" },
  { title: "Mulberry32 PRNG 生成", desc: "确定性伪随机：同一用户永远生成同一只宠物，换设备也不变" },
  { title: "物种 × 稀有度 × 属性", desc: "18 种物种随机选取，加权稀有度抽取，5 项属性根据稀有度浮动" },
  { title: "ASCII 精灵渲染", desc: "500ms tick 动画帧，idle 序列 + 随机 fidget + 稀有眨眼" },
  { title: "愚人节窗口", desc: "2026.4.1-4.7 预告期 → 4.1 后永久可用 → /buddy 命令孵化" },
];

function BuddyViz({ step }: { step: number }) {
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
          物种 + 稀有度 + 属性
        </span>
        <span className={`transition-opacity ${step >= 2 ? "text-zinc-400" : "text-zinc-800"}`}>→</span>
        <span className={`rounded px-2 py-1 transition-all duration-300 ${step >= 3 ? "bg-purple-500/10 text-purple-400" : "bg-zinc-900 text-zinc-600"}`}>
          ASCII 精灵
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 左: 物种池 + 稀有度 */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">
            {step >= 2 ? "✓ 抽取结果" : "物种池 (18 种)"}
          </div>
          <div className="flex flex-wrap gap-1">
            {BUDDY_SPECIES.map((s, i) => (
              <span key={i} className={`rounded px-1.5 py-0.5 text-[10px] transition-all duration-500 ${
                step >= 2 && i === 7 ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40" : step >= 2 ? "bg-zinc-900 text-zinc-700" : "bg-zinc-900 text-zinc-400"
              }`}>{s}</span>
            ))}
          </div>
          {step >= 2 && (
            <div className="mt-2 space-y-1">
              <div className="text-[10px] text-zinc-500">稀有度加权抽取:</div>
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
            {step >= 3 ? "🎉 你的宠物" : "等待生成..."}
          </div>
          {step >= 3 ? (
            <div className="text-center space-y-1">
              <div className="text-3xl">{demoSpecies.slice(0,2)}</div>
              <div className="text-xs font-semibold text-zinc-200">Inky</div>
              <div className="text-[10px]" style={{ color: demoRarity.color }}>{demoRarity.stars} {demoRarity.name}</div>
              <div className="text-[10px] text-zinc-500">eye: ✦ · hat: wizard · shiny: ✗</div>
              <div className="flex justify-center gap-1 mt-1">
                {["DEBUGGING","PATIENCE","CHAOS","WISDOM","SNARK"].map((stat, i) => (
                  <div key={stat} className="text-center">
                    <div className="h-8 w-3 rounded-full bg-zinc-800 relative overflow-hidden">
                      <div className="absolute bottom-0 w-full rounded-full transition-all duration-700" style={{
                        height: step >= 3 ? `${30 + i * 15}%` : "0%",
                        backgroundColor: demoRarity.color + "80",
                      }}/>
                    </div>
                    <div className="text-[7px] text-zinc-600 mt-0.5">{stat.slice(0,3)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-zinc-700 text-xs">
              {step === 0 ? "需要用户 ID..." : step === 1 ? "PRNG 初始化中..." : "等待抽取..."}
            </div>
          )}
          {step >= 4 && (
            <div className="mt-2 rounded bg-emerald-500/10 px-2 py-1 text-center text-[10px] text-emerald-400">
              📅 2026.4.1 愚人节上线 → /buddy 孵化
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
  { title: "模式激活", desc: "GrowthBook gate + 信任检查 → kairosEnabled 单一状态源" },
  { title: "主动循环", desc: "模型自主执行 sleep/tick 调度，队列空时自动注入 proactive_tick" },
  { title: "频道通知", desc: "MCP server 推送事件 → 注入消息队列 → 模型决定用哪个工具回复" },
  { title: "Cron 定时调度", desc: "cron 表达式触发 → jitter 防负载尖峰 → 一次性 vs 循环任务" },
  { title: "记忆整合", desc: "autoDream 与 Kairos 互斥 → Kairos 用 disk-skill dream 独立策略" },
];

const KAIROS_SUBSYSTEMS = [
  { id: "proactive", label: "主动循环", icon: "🔄", desc: "sleep/tick 自主执行" },
  { id: "channels", label: "频道通知", icon: "📨", desc: "MCP 事件推送" },
  { id: "cron", label: "Cron 调度", icon: "⏰", desc: "定时任务触发" },
  { id: "transcript", label: "会话转录", icon: "📝", desc: "压缩时写入段" },
  { id: "dream", label: "记忆整合", icon: "💭", desc: "disk-skill dream" },
  { id: "brief", label: "简报命令", icon: "📋", desc: "/brief 生成摘要" },
];

function KairosViz({ step }: { step: number }) {
  const activeSubsystems = step === 0 ? [] : step === 1 ? ["proactive"] : step === 2 ? ["proactive","channels"] : step === 3 ? ["proactive","channels","cron"] : ["proactive","channels","cron","transcript","dream","brief"];
  return (
    <div className="space-y-3">
      {/* 核心循环图 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">Kairos 运行循环</div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className={`rounded px-2 py-1 transition-all ${step >= 0 ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30" : "bg-zinc-900 text-zinc-600"}`}>
            kairosEnabled=true
          </span>
          <span className="text-zinc-600">→</span>
          <span className={`rounded px-2 py-1 transition-all ${step >= 1 ? "bg-blue-500/10 text-blue-400" : "bg-zinc-900 text-zinc-600"}`}>
            proactive tick 注入
          </span>
          <span className="text-zinc-600">→</span>
          <span className={`rounded px-2 py-1 transition-all ${step >= 1 ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-900 text-zinc-600"}`}>
            模型自主执行
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
              <div className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-purple-300" : "text-zinc-600"}`}>{sub.label}</div>
              <div className="text-[9px] text-zinc-500 mt-0.5">{sub.desc}</div>
            </div>
          );
        })}
      </div>

      {/* 互斥说明 */}
      {step >= 4 && (
        <div className="rounded bg-yellow-500/5 border border-yellow-500/20 px-3 py-2 text-[10px] text-yellow-400/80">
          ⚠️ autoDream 与 Kairos 互斥: <code className="bg-zinc-800 px-1 rounded">getKairosActive() → return false</code> — Kairos 用自己的 disk-skill dream 策略
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Ultraplan 深度规划 — 状态机 + 执行路径
   ═══════════════════════════════════════════════════════════════ */

const ULTRAPLAN_STEPS = [
  { title: "触发检测", desc: "输入包含 'ultraplan' → 排除引号/路径/问句 → 触发远程规划" },
  { title: "远程会话创建", desc: "teleportToRemote() → CCR (Claude Code on Web) → Opus 4.6 模型" },
  { title: "状态机轮询", desc: "running ↔ needs_input → plan_ready，30 分钟超时" },
  { title: "方案审批分叉", desc: "用户选择: Web 上执行 (PR) 或传回本地终端执行" },
];

function UltraplanViz({ step }: { step: number }) {
  const phases = ["running", "needs_input", "plan_ready", "approved"] as const;
  const activePhase = step === 0 ? -1 : step === 1 ? 0 : step === 2 ? 2 : 3;
  return (
    <div className="space-y-3">
      {/* 触发条件 */}
      {step === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">关键词触发逻辑</div>
          <div className="space-y-1 text-[10px]">
            <div className="text-emerald-400">✓ &quot;please ultraplan the auth module&quot; → 触发</div>
            <div className="text-red-400">✗ &quot;src/ultraplan/foo.ts&quot; → 路径上下文，不触发</div>
            <div className="text-red-400">✗ &quot;what is ultraplan?&quot; → 问句，不触发</div>
            <div className="text-red-400">✗ `ultraplan` → 在反引号内，不触发</div>
            <div className="text-red-400">✗ &quot;/rename ultraplan foo&quot; → slash 命令，不触发</div>
          </div>
        </div>
      )}

      {/* 状态机 */}
      {step >= 1 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="mb-2 text-[10px] font-medium text-zinc-500">Ultraplan 状态机</div>
          <div className="flex items-center gap-2 flex-wrap">
            {phases.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <span className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all duration-500 ${
                  i <= activePhase ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30" : "bg-zinc-900 text-zinc-600"
                } ${i === activePhase ? "scale-105" : ""}`}>
                  {p === "running" ? "🔄 running" : p === "needs_input" ? "⏸️ needs_input" : p === "plan_ready" ? "✅ plan_ready" : "🎉 approved"}
                </span>
                {i < phases.length - 1 && <span className="text-zinc-600 text-xs">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-zinc-500">
            <span>模型: Opus 4.6</span>
            <span>超时: 30 min</span>
            <span>需要: /login OAuth</span>
          </div>
        </div>
      )}

      {/* 执行路径分叉 */}
      {step >= 3 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="text-xs font-semibold text-emerald-400 mb-1">路径 A: Web 执行</div>
            <div className="text-[10px] text-zinc-400 space-y-0.5">
              <div>→ 远程 session 继续编码</div>
              <div>→ 结果作为 PR 提交</div>
              <div>→ 本地通知: &quot;Results will land as PR&quot;</div>
            </div>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="text-xs font-semibold text-blue-400 mb-1">路径 B: 传回本地</div>
            <div className="text-[10px] text-zinc-400 space-y-0.5">
              <div>→ 浏览器点击 &quot;teleport back&quot;</div>
              <div>→ plan 通过 feedback 传回</div>
              <div>→ 本地 REPL 弹出确认对话框</div>
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
  { title: "仓库分类检测", desc: "解析 git remote → 匹配内部仓库白名单 → 判断 internal/external" },
  { title: "激活决策", desc: "非内部仓库自动 ON，无 force-OFF → 安全默认" },
  { title: "指令注入链路", desc: "系统提示 + commit + PR + Bash 四个集成点全链路防护" },
];

function UndercoverViz({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      {/* 判断流程 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">isUndercover() 判断流程</div>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 0 ? "opacity-100" : "opacity-30"}`}>
            <span className="rounded bg-zinc-800 px-2 py-1 font-mono">USER_TYPE === &apos;ant&apos;?</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded bg-red-500/10 px-2 py-1 text-red-400">external: return false (DCE)</span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 0 ? "opacity-100" : "opacity-30"}`}>
            <span className="text-zinc-600 pl-4">↓ ant 构建</span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 0 ? "opacity-100" : "opacity-30"}`}>
            <span className="rounded bg-zinc-800 px-2 py-1 font-mono">CLAUDE_CODE_UNDERCOVER=1?</span>
            <span className="text-zinc-500">→</span>
            <span className="rounded bg-yellow-500/10 px-2 py-1 text-yellow-400">强制 ON</span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 1 ? "opacity-100" : "opacity-30"}`}>
            <span className="text-zinc-600 pl-4">↓ 未强制</span>
          </div>
          <div className={`flex items-center gap-2 text-xs transition-all ${step >= 1 ? "opacity-100" : "opacity-30"}`}>
            <span className="rounded bg-zinc-800 px-2 py-1 font-mono">getRepoClassCached()</span>
            <span className="text-zinc-500">→</span>
            <div className="flex gap-1">
              <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">&apos;internal&apos; → OFF</span>
              <span className="rounded bg-red-500/10 px-2 py-1 text-red-400">其他 → ON</span>
            </div>
          </div>
        </div>
        {step >= 1 && (
          <div className="mt-2 rounded bg-red-500/5 border border-red-500/20 px-2 py-1 text-[10px] text-red-400/80">
            ⚠️ 没有 force-OFF — 不确定时永远开启
          </div>
        )}
      </div>

      {/* 注入链路 */}
      {step >= 2 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "系统提示", file: "prompts.ts", icon: "📝" },
            { label: "commit", file: "commit.ts", icon: "📦" },
            { label: "PR", file: "commit-push-pr.ts", icon: "🔀" },
            { label: "Bash", file: "BashTool/prompt.ts", icon: "💻" },
          ].map((point) => (
            <div key={point.label} className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-center">
              <div className="text-lg">{point.icon}</div>
              <div className="text-[10px] font-semibold text-red-300 mt-0.5">{point.label}</div>
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
  { title: "进程架构", desc: "用户启动 claude daemon → Supervisor 管理 Worker 生命周期" },
  { title: "Worker 种类", desc: "remoteControl (无头桥接) + cron (定时任务) + 可扩展" },
  { title: "崩溃恢复", desc: "Worker 崩溃 → Supervisor 检查退出码 → 瞬态重试 / 永久放弃" },
];

function DaemonViz({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">Daemon 进程树</div>
        <div className="space-y-1 font-mono text-xs">
          <div className={`transition-all ${step >= 0 ? "text-emerald-400" : "text-zinc-600"}`}>
            $ claude daemon start
          </div>
          <div className={`pl-2 transition-all ${step >= 0 ? "text-zinc-300" : "text-zinc-700"}`}>
            ├── <span className="text-yellow-400">Supervisor</span> (PID 12345)
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-300" : "text-zinc-700"}`}>
            │   ├── 配置: daemon.json
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-300" : "text-zinc-700"}`}>
            │   └── 认证: AuthManager (OAuth)
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-blue-400" : "text-zinc-700"}`}>
            ├── Worker[remoteControl]
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            │   ├── runBridgeHeadless()
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            │   ├── 无 TUI · 无 readline · 无 process.exit
          </div>
          <div className={`pl-2 transition-all ${step >= 1 ? "text-zinc-400" : "text-zinc-700"}`}>
            │   └── 认证: IPC ← Supervisor
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
          <div className="mb-2 text-[10px] font-medium text-zinc-500">崩溃恢复机制</div>
          <div className="flex gap-2">
            <div className="flex-1 rounded bg-emerald-500/5 border border-emerald-500/20 p-2 text-center">
              <div className="text-xs font-semibold text-emerald-400">瞬态错误</div>
              <div className="text-[10px] text-zinc-500 mt-1">网络超时 / API 429</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">→ 指数退避重试</div>
            </div>
            <div className="flex-1 rounded bg-red-500/5 border border-red-500/20 p-2 text-center">
              <div className="text-xs font-semibold text-red-400">永久错误</div>
              <div className="text-[10px] text-zinc-500 mt-1">信任未接受 / HTTPS 错误</div>
              <div className="text-[10px] text-red-400 mt-0.5">→ 停止重试，Worker 休眠</div>
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
  { title: "Socket 创建", desc: "启动时创建 UDS socket → 路径写入 PID 文件 → 其他会话可发现" },
  { title: "三种寻址", desc: "teammate 名字 / UDS 本地路径 / Bridge 远程会话 ID" },
  { title: "消息流转", desc: "发送方 SendMessageTool → UDS/Bridge 传输 → 接收方消息队列注入" },
];

function UdsViz({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <div className="mb-2 text-[10px] font-medium text-zinc-500">跨会话通信架构</div>

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
            { addr: '"teammate-name"', label: "Swarm 内部", icon: "👥", color: "emerald" },
            { addr: '"uds:/path.sock"', label: "本地 (同机器)", icon: "🔌", color: "cyan" },
            { addr: '"bridge:session_..."', label: "远程 (跨机器)", icon: "🌐", color: "purple" },
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
  steps: { title: string; desc: string }[];
  Viz: React.ComponentType<{ step: number }>;
}

const TABS: FeatureTab[] = [
  { id: "buddy", name: "Buddy 宠物", icon: "🐾", color: "#F59E0B", flag: "BUDDY", steps: BUDDY_STEPS, Viz: BuddyViz },
  { id: "kairos", name: "Kairos 助手", icon: "🧠", color: "#8B5CF6", flag: "KAIROS", steps: KAIROS_STEPS, Viz: KairosViz },
  { id: "ultraplan", name: "Ultraplan", icon: "📋", color: "#3B82F6", flag: "ULTRAPLAN", steps: ULTRAPLAN_STEPS, Viz: UltraplanViz },
  { id: "undercover", name: "Undercover", icon: "🕵️", color: "#EF4444", flag: "ant-only", steps: UNDERCOVER_STEPS, Viz: UndercoverViz },
  { id: "daemon", name: "Daemon", icon: "⚙️", color: "#10B981", flag: "DAEMON", steps: DAEMON_STEPS, Viz: DaemonViz },
  { id: "uds", name: "UDS 通信", icon: "📡", color: "#06B6D4", flag: "UDS_INBOX", steps: UDS_STEPS, Viz: UdsViz },
];

export default function Ch13HiddenFeatures() {
  const [activeTab, setActiveTab] = useState(0);
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
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              i === activeTab
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
        stepTitle={tab.steps[currentStep]?.title ?? ""}
        stepDescription={tab.steps[currentStep]?.desc ?? ""}
      />

      {/* 可视化区域 */}
      <VizComponent step={currentStep} />

      {/* 底部统计 */}
      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-600">
        <span>30+ Feature Flags</span>
        <span>·</span>
        <span>209 处 feature() 调用</span>
        <span>·</span>
        <span>199 个文件涉及</span>
      </div>
    </div>
  );
}
