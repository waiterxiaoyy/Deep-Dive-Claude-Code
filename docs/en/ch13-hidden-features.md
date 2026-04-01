# Ch13: Hidden Features & Feature Flag System

> *Behind every `feature('FLAG')` lies an unreleased product decision*

## Core Discovery

Claude Code source contains **30+ Feature Flags**, controlled via `feature()` macro (`bun:bundle` compile-time constants) to enable/disable functionality. In external builds, these flags are constant-folded to `false`, entire code blocks removed by **Dead Code Elimination (DCE)**—users never see a single line of these features.

But in source restoration, all gated code is fully preserved. Here are 8 confirmed major hidden features.

---

## 1. Buddy Virtual Pet System

**Feature Flag**: `feature('BUDDY')`  
**Core files**: `src/buddy/` (6 files, ~70KB)  
**Planned launch**: April 1, 2026 (April Fools' Day easter egg)

A Tamagotchi-style ASCII virtual pet system:

- **18 species**: duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk
- **5 rarity levels**: common(60%) / uncommon(25%) / rare(10%) / epic(4%) / legendary(1%)
- **Deterministic generation**: Based on user Account UUID hash seed (Mulberry32 PRNG), same user always gets same pet
- **ASCII sprites**: 500ms tick animation, idle sequence + fidget + blink
- **Speech bubbles**: Model observes conversation and generates reaction text
- **`/buddy` command**: Hatch pet + `/buddy pet` interact (hearts float up)

```typescript
// src/buddy/useBuddyNotification.tsx
export function isBuddyTeaserWindow(): boolean {
  const d = new Date();
  return d.getFullYear() === 2026 && d.getMonth() === 3 && d.getDate() <= 7;
}
```

## 2. Kairos Assistant Mode

**Feature Flags**: `feature('KAIROS')` + `feature('KAIROS_CHANNELS')` + `feature('KAIROS_BRIEF')`  
**Core files**: Distributed across 75+ files  
**Status**: Deeply integrated inside Anthropic

Kairos is Claude Code's most massive hidden feature—a **cross-session persistent autonomous assistant mode**:

- **Proactive loop**: Model can autonomously loop with sleep/tick scheduling
- **Channel notifications**: Receive external events via MCP channel notifications
- **Cron scheduling**: Task scheduler (`CronScheduler`) with jitter to prevent load spikes
- **Session transcripts**: Write transcript segments during compaction for recovery
- **Memory integration**: Mutually exclusive with autoDream—Kairos uses disk-skill dream
- **Brief tool**: `/brief` command generates conversation summaries

```typescript
// src/services/autoDream/autoDream.ts
function isGateOpen(): boolean {
  if (getKairosActive()) return false // KAIROS mode uses disk-skill dream
  if (getIsRemoteMode()) return false
  return isAutoDreamEnabled()
}
```

## 3. Ultraplan Deep Planning

**Feature Flag**: `feature('ULTRAPLAN')`  
**Core files**: `src/commands/ultraplan.tsx` (65KB) + `src/utils/ultraplan/` (3 files)  
**Model used**: Opus 4.6

Remote multi-agent planning system:

- **30-minute timeout**: Runs in Claude Code on the Web (CCR)
- **State machine**: `running` → `needs_input` → `plan_ready`
- **Keyword trigger**: Auto-trigger when input contains "ultraplan" (with complex exclusion logic)
- **Plan approval**: User chooses to execute in Web or transfer back to local terminal

```typescript
const ULTRAPLAN_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
function getUltraplanModel(): string {
  return getFeatureValue('tengu_ultraplan_model', ALL_MODEL_CONFIGS.opus46.firstParty);
}
```

## 4. Undercover Mode

**Feature Flag**: None (ant-only build-time DCE)  
**Core file**: `src/utils/undercover.ts` (3.5KB)

Security protection when Anthropic contributes open-source code:

- **Auto-activate**: Automatically enabled in non-internal repos
- **Leak prevention**: Commit messages and PRs cannot contain internal model codenames (Capybara, Tengu, etc.)
- **Cannot disable**: No force-OFF option—security defaults to ON
- **Integration points**: System prompt, commit commands, PR commands, Bash tool

```typescript
export function isUndercover(): boolean {
  if (process.env.USER_TYPE === 'ant') {
    if (isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER)) return true
    return getRepoClassCached() !== 'internal'  // Non-internal repo → ON
  }
  return false
}
```

## 5. Daemon

**Feature Flag**: `feature('DAEMON')`  
**Core files**: `src/entrypoints/cli.tsx` + `src/bridge/bridgeMain.ts`

Long-lived background service architecture:

- **Supervisor + Worker**: Supervisor manages lifecycle, worker executes tasks
- **Headless bridge**: No TUI, no readline, no process.exit()
- **IPC auth**: Worker gets authentication via supervisor's AuthManager
- **Session kinds**: `interactive` | `bg` | `daemon` | `daemon-worker`

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

## 6. UDS Cross-Session Communication

**Feature Flag**: `feature('UDS_INBOX')`  
**Core files**: `src/utils/udsMessaging.ts` + `src/tools/SendMessageTool/`

Unix Domain Socket messaging system:

- **Local addressing**: `"uds:/path/to.sock"` send message to local Claude session
- **Remote addressing**: `"bridge:session_..."` send to Remote Control peer
- **XML tags**: `<cross-session-message>` wraps cross-session messages
- **`/peers` command**: List all reachable sessions (UDS + Bridge)

## 7. Negative Sentiment Detection

**Core file**: `src/utils/userPromptKeywords.ts` (28 lines)

Regex matches negative sentiment keywords in user input:

```typescript
const negativePattern = /\b(wtf|wth|ffs|omfg|shit(ty|tiest)?|dumbass|...)\b/
```

**Telemetry only** (`logEvent('tengu_input_prompt', { is_negative })`), doesn't change model behavior. Also detects "keep going" pattern to judge user intent.

## 8. Other Feature Flags

| Flag | Feature | Description |
|------|---------|-------------|
| `VOICE_MODE` | Voice mode | Anthropic voice_stream WebSocket STT |
| `COORDINATOR_MODE` | Coordinator mode | Multi-agent coordination |
| `CHICAGO_MCP` | Computer Use MCP | Desktop control |
| `TRANSCRIPT_CLASSIFIER` | Transcript classifier | Auto permission mode |
| `BG_SESSIONS` | Background sessions | `claude --bg` + `claude ps/attach/kill` |
| `FORK_SUBAGENT` | Fork subagent | `/fork` command |
| `TORCH` | Torch | Unknown feature |
| `WORKFLOW_SCRIPTS` | Workflow scripts | Custom workflows |

---

## Feature Flag Architecture

```
Source code
    ↓
feature('BUDDY')  ← bun:bundle compile-time constant
    ↓
┌─────────────────────────────────┐
│  ant internal build: feature() = true  │ → Code preserved, feature available
│  external build: feature() = false     │ → Entire if block removed by DCE
└─────────────────────────────────┘
    ↓
+ GrowthBook remote flags (runtime)
    ↓
Final: Compile-time gate + runtime gradual rollout = dual control
```

This is an elegant feature release system:
1. **Compile-time elimination**: External builds have zero runtime overhead
2. **Runtime gradual rollout**: GrowthBook A/B testing controls phased release
3. **Safe default**: Hidden features cannot accidentally expose to users
