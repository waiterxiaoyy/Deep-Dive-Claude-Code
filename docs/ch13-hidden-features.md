# Ch13: 隐藏功能与 Feature Flag 体系

> *每一行 `feature('FLAG')` 背后，都是一个尚未公开的产品决策*

## 核心发现

Claude Code 源码中存在 **30+ 个 Feature Flag**，通过 `feature()` 宏（`bun:bundle` 编译时常量）控制功能的启用与禁用。外部构建中，这些 flag 被常量折叠为 `false`，整个代码块被 **Dead Code Elimination (DCE)** 移除——用户永远看不到这些功能的一行代码。

但在源码还原中，所有门控代码完整保留。以下是已确认的 8 大隐藏功能。

---

## 1. Buddy 电子宠物系统

**Feature Flag**: `feature('BUDDY')`  
**核心文件**: `src/buddy/` (6 个文件, ~70KB)  
**计划上线**: 2026 年 4 月 1 日（愚人节彩蛋）

一个 Tamagotchi 风格的 ASCII 虚拟宠物系统：

- **18 种物种**: duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk
- **5 级稀有度**: common(60%) / uncommon(25%) / rare(10%) / epic(4%) / legendary(1%)
- **确定性生成**: 基于用户 Account UUID 的 hash seed（Mulberry32 PRNG），同一用户永远获得同一只宠物
- **ASCII 精灵图**: 500ms tick 动画，idle 序列 + fidget + blink
- **气泡对话**: 模型观察对话后生成反应文本
- **`/buddy` 命令**: 孵化宠物 + `/buddy pet` 交互（飘出爱心）

```typescript
// src/buddy/useBuddyNotification.tsx
export function isBuddyTeaserWindow(): boolean {
  const d = new Date();
  return d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7;
}
```

## 2. Kairos 助手模式

**Feature Flag**: `feature('KAIROS')` + `feature('KAIROS_CHANNELS')` + `feature('KAIROS_BRIEF')`  
**核心文件**: 分布在 75+ 个文件中  
**状态**: Anthropic 内部深度集成

Kairos 是 Claude Code 最庞大的隐藏功能——一个**跨会话持久化的自主助手模式**：

- **主动循环 (Proactive)**: 模型可以自主循环执行，带 sleep/tick 调度
- **频道通知 (Channels)**: 通过 MCP 的 channel notification 接收外部事件
- **Cron 调度**: 定时任务调度器（`CronScheduler`），支持 jitter 防止负载尖峰
- **会话转录**: compaction 时写入转录段，供后续恢复
- **记忆整合**: 与 autoDream 互斥——Kairos 使用 disk-skill dream
- **简报工具 (Brief)**: `/brief` 命令生成会话摘要

```typescript
// src/services/autoDream/autoDream.ts
function isGateOpen(): boolean {
  if (getKairosActive()) return false // KAIROS mode uses disk-skill dream
  if (getIsRemoteMode()) return false
  return isAutoDreamEnabled()
}
```

## 3. Ultraplan 深度规划

**Feature Flag**: `feature('ULTRAPLAN')`  
**核心文件**: `src/commands/ultraplan.tsx` (65KB) + `src/utils/ultraplan/` (3 文件)  
**使用模型**: Opus 4.6

远程多 Agent 规划系统：

- **30 分钟超时**: 在 Claude Code on the Web (CCR) 中运行
- **状态机**: `running` → `needs_input` → `plan_ready`
- **关键词触发**: 输入中包含 "ultraplan" 自动触发（有复杂的排除逻辑）
- **方案审批**: 用户可选择在 Web 执行或传回本地终端

```typescript
const ULTRAPLAN_TIMEOUT_MS = 30 * 60 * 1000; // 30 分钟
function getUltraplanModel(): string {
  return getFeatureValue('tengu_ultraplan_model', ALL_MODEL_CONFIGS.opus46.firstParty);
}
```

## 4. Undercover 卧底模式

**Feature Flag**: 无（ant-only 构建时 DCE）  
**核心文件**: `src/utils/undercover.ts` (3.5KB)

Anthropic 内部贡献开源代码时的安全防护：

- **自动激活**: 在非内部仓库中自动开启
- **防泄露**: commit 消息和 PR 中不能包含内部模型代号（Capybara, Tengu 等）
- **无法关闭**: 没有 force-OFF 选项——安全默认为 ON
- **集成点**: 系统提示、commit 命令、PR 命令、Bash 工具

```typescript
export function isUndercover(): boolean {
  if (process.env.USER_TYPE === 'ant') {
    if (isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER)) return true
    return getRepoClassCached() !== 'internal'  // 非内部仓库 → ON
  }
  return false
}
```

## 5. Daemon 守护进程

**Feature Flag**: `feature('DAEMON')`  
**核心文件**: `src/entrypoints/cli.tsx` + `src/bridge/bridgeMain.ts`

长生命周期的后台服务架构：

- **Supervisor + Worker**: supervisor 管理生命周期，worker 执行任务
- **无头桥接**: 无 TUI、无 readline、无 process.exit()
- **IPC 认证**: worker 通过 supervisor 的 AuthManager 获取认证
- **会话种类**: `interactive` | `bg` | `daemon` | `daemon-worker`

```typescript
// src/entrypoints/cli.tsx
if (feature('DAEMON') && args[0] === '--daemon-worker') {
  const { runDaemonWorker } = await import('../daemon/workerRegistry.js');
  await runDaemonWorker(args[1]);
}
if (feature('DAEMON') && args[0] === 'daemon') {
  const { daemonMain } = await import('../daemon/main.js');
  await daemonMain(args.slice(1));
}
```

## 6. UDS 跨会话通信

**Feature Flag**: `feature('UDS_INBOX')`  
**核心文件**: `src/utils/udsMessaging.ts` + `src/tools/SendMessageTool/`

Unix Domain Socket 消息系统：

- **本地寻址**: `"uds:/path/to.sock"` 发送消息到本地 Claude 会话
- **远程寻址**: `"bridge:session_..."` 发送到 Remote Control 对端
- **XML 标签**: `<cross-session-message>` 包裹跨会话消息
- **`/peers` 命令**: 列出所有可达的会话（UDS + Bridge）

## 7. 负面情绪检测

**核心文件**: `src/utils/userPromptKeywords.ts` (28 行)

用正则匹配用户输入中的负面情绪关键词：

```typescript
const negativePattern = /\b(wtf|wth|ffs|omfg|shit(ty|tiest)?|dumbass|...)\b/
```

**仅用于遥测** (`logEvent('tengu_input_prompt', { is_negative })`)，不改变模型行为。同时检测 "keep going" 模式判断用户意图。

## 8. 其他 Feature Flag

| Flag | 功能 | 说明 |
|------|------|------|
| `VOICE_MODE` | 语音模式 | Anthropic voice_stream WebSocket STT |
| `COORDINATOR_MODE` | 协调器模式 | 多 Agent 协调 |
| `CHICAGO_MCP` | Computer Use MCP | 桌面控制 |
| `TRANSCRIPT_CLASSIFIER` | 转录分类器 | auto 权限模式 |
| `BG_SESSIONS` | 后台会话 | `claude --bg` + `claude ps/attach/kill` |
| `FORK_SUBAGENT` | Fork 子代理 | `/fork` 命令 |
| `TORCH` | Torch | 未知功能 |
| `WORKFLOW_SCRIPTS` | 工作流脚本 | 自定义工作流 |

---

## Feature Flag 架构

```
源码编写
    ↓
feature('BUDDY')  ← bun:bundle 编译时常量
    ↓
┌─────────────────────────────────┐
│  ant 内部构建: feature() = true │ → 代码保留，功能可用
│  external 构建: feature() = false │ → 整个 if 块被 DCE 移除
└─────────────────────────────────┘
    ↓
+ GrowthBook 远程 Flag (运行时)
    ↓
最终：编译时门控 + 运行时灰度 = 双重控制
```

这是一个优雅的功能发布体系：
1. **编译时消除**: 外部构建零运行时开销
2. **运行时灰度**: GrowthBook A/B 测试控制逐步放量
3. **安全默认**: 隐藏功能不可能意外暴露给用户
