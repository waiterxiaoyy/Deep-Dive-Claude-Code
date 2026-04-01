# Ch10: Multi-Agent Collaboration — Agent/Team/Swarm

`Ch01 > Ch02 > Ch03 > Ch04 > Ch05 > Ch06 | Ch07 > Ch08 > Ch09 > [ Ch10 ] Ch11 > Ch12`

> *"Scale comes from division of labor, not from bigger context windows"*

## The Problem

An agent's context is limited. Large refactors, multi-file modifications, tasks requiring different expertise... one agent struggles. The solution is the same as humans: build a team.

## Architecture Diagram

```
Three-layer collaboration model:

Layer 1: Subagent (one-shot)
  ┌──────────┐     spawn      ┌──────────────┐
  │  Parent  │ ──────────────>│  Subagent    │
  │  Agent   │     summary    │  fresh ctx   │
  │          │ <──────────────│  discarded   │
  └──────────┘                └──────────────┘

Layer 2: Teammate (persistent)
  ┌──────────┐     spawn      ┌──────────────┐
  │   Lead   │ ──────────────>│  Teammate A  │──┐
  │  Agent   │                │  persistent  │  │ JSONL mailbox
  │          │     spawn      ├──────────────┤  │
  │          │ ──────────────>│  Teammate B  │──┤
  │          │                │  persistent  │  │
  │          │ <──────────────│              │<─┘
  └──────────┘   messaging    └──────────────┘

Layer 3: Swarm (autonomous)
  ┌─────────────────────────────────────────┐
  │           .tasks/ task board            │
  │  task_1: pending (unclaimed)            │
  │  task_2: in_progress (owner: alice)     │
  │  task_3: completed                      │
  └─────────────────────────────────────────┘
        ↑              ↑              ↑
     auto-claim     auto-claim     auto-claim
   ┌───────┐      ┌───────┐      ┌───────┐
   │ Alice │      │  Bob  │      │ Carol │
   │ WORK  │      │ IDLE  │      │ WORK  │
   │ → IDLE│      │ → scan│      │       │
   │ → scan│      │ → claim│     │       │
   └───────┘      └───────┘      └───────┘
```

## Source Code Guide

### 1. AgentTool — Subagent Spawner (228KB)

File path: `src/tools/AgentTool/AgentTool.tsx`

The **largest tool** in the project, responsible for:
- Spawning subagents (fresh context)
- Managing subagent lifecycle
- Collecting subagent results

```
tools/AgentTool/
├── AgentTool.tsx        (228KB) — Main implementation
├── UI.tsx               (122KB) — Terminal rendering
├── runAgent.ts          (35KB)  — Agent execution logic
├── forkSubagent.ts      (8KB)   — Fork mode
├── loadAgentsDir.ts     (26KB)  — Agent definition loading
├── prompt.ts            (16KB)  — Agent prompts
└── built-in/                    — Built-in agent definitions
    ├── exploreAgent.ts          — Code exploration agent
    ├── planAgent.ts             — Planning agent
    └── verificationAgent.ts     — Verification agent
```

### 2. Multi-Agent Parallel — spawnMultiAgent.ts (35KB)

File path: `src/tools/shared/spawnMultiAgent.ts`

Supports spawning multiple subagents in parallel for different tasks.

### 3. Team Communication — Mailbox System

```
utils/
├── teammateMailbox.ts   (33KB) — Mailbox communication core
├── teammate.ts          (9KB)  — Teammate lifecycle
├── teammateContext.ts   (3KB)  — Teammate context
├── teamDiscovery.ts     (2KB)  — Team discovery
└── swarm/                      — Swarm cluster communication
    ├── reconnection.ts         — Reconnection logic
    ├── teammatePromptAddendum.ts — Teammate prompt
    └── backends/               — Communication backends
```

### 4. Task System

File path: `src/tasks.ts` + `src/utils/tasks.ts` (26KB)

Six background task types:
- **LocalShellTask** — Local shell tasks
- **LocalAgentTask** — Local agent tasks
- **RemoteAgentTask** — Remote agent tasks
- **DreamTask** — Memory consolidation tasks
- **LocalWorkflowTask** — Local workflows
- **MonitorMcpTask** — MCP monitoring tasks

## Practice Exercises

1. **Read built-in agents**: Open `src/tools/AgentTool/built-in/exploreAgent.ts`, understand the prompts and behavior definition of the "code exploration" agent
2. **Trace team messaging**: From `src/tools/SendMessageTool/SendMessageTool.ts`, trace how a message reaches the target teammate
3. **Understand task types**: Open `src/tasks.ts`, list all task types, think about why so many types are needed
