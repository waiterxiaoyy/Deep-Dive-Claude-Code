# Ch02: Query Engine — Heart of the Conversation Loop

`Ch01 > [ Ch02 ] Ch03 > Ch04 > Ch05 > Ch06 | Ch07 > Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"The essence of all Agents is a loop: call model → execute tools → feed back results"*

## The Problem

A tutorial-level agent loop is just 30 lines. But production needs to handle: streaming output, tool permission checks, token budgets, auto-compression, error retry, abort signals, session persistence, SDK compatibility... How do you support all these features while keeping the core loop simple?

## Architecture Diagram

```
                        QueryEngine (one instance per session)
                        ============================
                        |  mutableMessages: Message[]  |  ← session state
                        |  totalUsage: Usage           |
                        |  readFileState: FileStateCache|
                        |  config: QueryEngineConfig    |
                        +==============================+
                                     |
                          submitMessage(prompt)
                                     |
                                     v
┌──────────────────────────────────────────────────────────┐
│                    query() function (query.ts)            │
│                                                           │
│  ┌─────────┐    ┌──────────┐    ┌───────────────────┐    │
│  │ Build    │    │ API call │    │ Tool execution    │    │
│  │ system   │───>│ Claude   │───>│ canUseTool()      │    │
│  │ prompt   │    │ streaming│    │ tool.call()       │    │
│  └─────────┘    └────┬─────┘    │ append(result)    │    │
│                      │          └────────┬──────────┘    │
│                      │                   │               │
│                      │    ┌──────────────┘               │
│                      │    │                              │
│                      v    v                              │
│              stop_reason != "tool_use"?                   │
│                 /              \                          │
│               yes               no ──> continue loop      │
│                |                                         │
│            ┌───┴────────────────────┐                    │
│            │ Auto-compact check     │                    │
│            │ Session persistence    │                    │
│            │ Token usage stats      │                    │
│            │ yield SDKMessage       │                    │
│            └────────────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

## Source Code Guide

### 1. QueryEngine Class — Session Manager

File path: `src/QueryEngine.ts`

QueryEngine is designed as **one instance per session**. Each `submitMessage()` is a new conversation turn, but state persists across turns:

```typescript
// src/QueryEngine.ts:184-207
export class QueryEngine {
  private config: QueryEngineConfig
  private mutableMessages: Message[]        // session message history (cross-turn)
  private abortController: AbortController  // abort signal
  private permissionDenials: SDKPermissionDenial[]
  private totalUsage: NonNullableUsage      // cumulative token usage
  private readFileState: FileStateCache     // file state cache
  private discoveredSkillNames = new Set<string>()

  constructor(config: QueryEngineConfig) {
    this.mutableMessages = config.initialMessages ?? []
    this.abortController = config.abortController ?? createAbortController()
    this.totalUsage = EMPTY_USAGE
  }
}
```

`QueryEngineConfig` defines everything the engine needs:

```typescript
// src/QueryEngine.ts:130-173
export type QueryEngineConfig = {
  cwd: string                    // working directory
  tools: Tools                   // available tool set
  commands: Command[]            // slash commands
  mcpClients: MCPServerConnection[]  // MCP connections
  agents: AgentDefinition[]      // agent definitions
  canUseTool: CanUseToolFn       // permission check function
  getAppState: () => AppState    // application state
  thinkingConfig?: ThinkingConfig // thinking mode config
  maxTurns?: number              // max turns
  maxBudgetUsd?: number          // max budget (USD)
  // ...
}
```

### 2. submitMessage() — Conversation Turn Entry Point

```typescript
// src/QueryEngine.ts:209-212
async *submitMessage(
  prompt: string | ContentBlockParam[],
  options?: { uuid?: string; isMeta?: boolean },
): AsyncGenerator<SDKMessage, void, unknown> {
```

Note the return type is `AsyncGenerator<SDKMessage>`—this is an **async generator** that can stream messages. This allows callers to:
- Display model responses in real-time
- Show tool execution progress step by step
- Abort at any moment

Permission checks are wrapped as an interceptor layer, tracking all denied tool calls:

```typescript
// src/QueryEngine.ts:244-271
const wrappedCanUseTool: CanUseToolFn = async (tool, input, ...) => {
  const result = await canUseTool(tool, input, ...)
  // Track permission denials for SDK reporting
  if (result.behavior !== 'allow') {
    this.permissionDenials.push({
      tool_name: sdkCompatToolName(tool.name),
      tool_use_id: toolUseID,
      tool_input: input,
    })
  }
  return result
}
```

### 3. query() Function — Core Loop

File path: `src/query.ts`

This is where the real agent loop lives. Compare with the tutorial version:

**Tutorial version (learn-claude-code, 30 lines):**
```python
def agent_loop(messages):
    while True:
        response = client.messages.create(model=MODEL, messages=messages, tools=TOOLS)
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "tool_use":
            return
        results = []
        for block in response.content:
            if block.type == "tool_use":
                output = TOOL_HANDLERS[block.name](**block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
        messages.append({"role": "user", "content": results})
```

**Production version (query.ts, 67KB) layers on top of the same loop:**

| Layer | Feature | Tutorial | Production |
|-------|---------|----------|------------|
| API call | Model request | Sync call | Streaming + retry + fallback model |
| Tool execution | Run tools | Direct handler call | Permission check → tool exec → progress report |
| Message mgmt | Append results | Simple append | Normalize + truncate + micro-compact |
| Context | Send to model | Raw messages | Auto-compact + context collapse + attachments |
| Stop condition | Loop exit | `stop_reason` | + maxTurns + maxBudget + abort |
| Error handling | Exceptions | None | Categorized retry + prompt-too-long recovery |
| Observability | Monitoring | None | Event logs + token stats + profiler |

Key imports in `query.ts` reveal its complexity:

```typescript
// src/query.ts:8-13
import { calculateTokenWarningState, isAutoCompactEnabled } from './services/compact/autoCompact.js'
import { buildPostCompactMessages } from './services/compact/compact.js'
// Conditional compilation: reactive compaction and context collapse
const reactiveCompact = feature('REACTIVE_COMPACT') ? require('./services/compact/reactiveCompact.js') : null
const contextCollapse = feature('CONTEXT_COLLAPSE') ? require('./services/contextCollapse/index.js') : null
```

### 4. Message Type System

File path: `src/types/message.ts`

Production messages aren't simple `{role, content}`, but a **union type**:

```
Message = UserMessage
        | AssistantMessage
        | SystemMessage
        | AttachmentMessage
        | ProgressMessage
        | ToolUseSummaryMessage
        | TombstoneMessage        // tombstone for compacted-out messages
        | SystemLocalCommandMessage
```

Each message type carries different metadata (token usage, timestamps, tool call summaries, etc.), which are the foundation for compression and persistence.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `AsyncGenerator` return type | Streaming output + abort support |
| QueryEngine class vs bare function | Cross-turn state persistence |
| `canUseTool` injection vs hardcoded | Different permission strategies for REPL/SDK/headless |
| Message union types | Compression, persistence, UI rendering each need different metadata |

## Practice Exercises

1. **Understand QueryEngineConfig**: Open `src/QueryEngine.ts:130-173`, list all config options, categorize which are required vs optional
2. **Compare tutorial vs production**: Open `src/query.ts`, search for `stop_reason`, find all loop exit conditions (not just `!= "tool_use"`)
3. **Trace a tool call**: In `query.ts`, find the `tool_use` handling logic, trace the full path from `canUseTool` → `tool.call()` → `tool_result`
