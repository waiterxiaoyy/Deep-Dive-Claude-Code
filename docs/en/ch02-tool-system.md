# Ch04: Tool Architecture — Registry & Dispatch of 50+ Tools

`Ch01 > Ch02 > Ch03 > [ Ch04 ] Ch05 > Ch06 | Ch07 > Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"Register a handler, add a capability—the loop never changes"*

## The Problem

The tutorial version uses a `TOOL_HANDLERS` dictionary for tool dispatch. But 50+ tools means 50+ permission policies, 50+ UI rendering methods, 50+ error handling strategies. How do you make each tool self-contained, testable, and independently evolvable?

## Architecture Diagram

```
src/tools.ts (registry)
    |
    |  getTools() → collect all tool instances
    |
    ├── BashTool          (157KB main file + security subsystem)
    ├── FileReadTool      (38KB)
    ├── FileEditTool      (20KB + 22KB utils)
    ├── FileWriteTool     (15KB)
    ├── GrepTool          (20KB)
    ├── GlobTool          (6KB)
    ├── AgentTool         (228KB — subagent system)
    ├── WebFetchTool      (9KB + 16KB utils)
    ├── WebSearchTool     (13KB)
    ├── TodoWriteTool     (4KB)
    ├── MCPTool           (dynamic — loaded from MCP servers)
    ├── SkillTool         (37KB)
    ├── TeamCreate/Delete (collaboration tools)
    ├── SendMessageTool   (27KB)
    ├── Task* (CRUD)      (task management tool group)
    ├── LSPTool           (25KB)
    └── ... (50+ tools)

Each tool directory structure:
  tools/BashTool/
  ├── BashTool.tsx       # main implementation (extends Tool base class)
  ├── prompt.ts          # system prompt fragment for this tool
  ├── UI.tsx             # terminal rendering component (React Ink)
  ├── constants.ts       # tool name constants
  └── *.ts               # security validation, helper functions, etc.
```

## Source Code Guide

### 1. Tool Base Class — The Contract

File path: `src/Tool.ts` (29KB)

The interface every tool must implement (simplified):

```typescript
// src/Tool.ts core types
export type ToolInputJSONSchema = {
  type: 'object'
  properties?: { [x: string]: unknown }
}

// Capabilities a tool must provide:
// - name: tool identifier
// - description: description for the model
// - input_schema: JSON Schema parameter definition
// - call(): execution function
// - prompt(): usage guide in system prompt
// - renderToolUseMessage(): UI rendering
```

### 2. tools.ts — Registry

File path: `src/tools.ts` (17KB)

The `getTools()` function collects all tools. Note the conditional loading pattern:

```typescript
// src/tools.ts:16-53 — conditional loading (compile-time elimination + runtime check)
const REPLTool = process.env.USER_TYPE === 'ant'
  ? require('./tools/REPLTool/REPLTool.js').REPLTool : null

const SleepTool = feature('PROACTIVE') || feature('KAIROS')
  ? require('./tools/SleepTool/SleepTool.js').SleepTool : null

const cronTools = feature('AGENT_TRIGGERS')
  ? [CronCreateTool, CronDeleteTool, CronListTool] : []
```

Team collaboration tools use `lazy require` to break circular dependencies:

```typescript
// src/tools.ts:63-72
const getTeamCreateTool = () =>
  require('./tools/TeamCreateTool/TeamCreateTool.js').TeamCreateTool
const getTeamDeleteTool = () =>
  require('./tools/TeamDeleteTool/TeamDeleteTool.js').TeamDeleteTool
const getSendMessageTool = () =>
  require('./tools/SendMessageTool/SendMessageTool.js').SendMessageTool
```

### 3. Tool Categories

| Category | Tools | Notes |
|----------|-------|-------|
| **Filesystem** | FileRead, FileEdit, FileWrite, Glob, Grep | Core code operations |
| **Shell** | BashTool, PowerShellTool | Command execution (most complex security surface) |
| **Search** | GrepTool, WebSearchTool, ToolSearchTool | Information retrieval |
| **Network** | WebFetchTool | URL content fetching |
| **AI Subagents** | AgentTool | Subagent spawning (228KB) |
| **Collaboration** | TeamCreate, TeamDelete, SendMessage | Multi-agent communication |
| **Task Mgmt** | TaskCreate/Get/List/Update/Stop/Output | Task CRUD |
| **Planning** | TodoWriteTool, EnterPlanMode, ExitPlanMode | Plan management |
| **IDE** | LSPTool, NotebookEditTool | Editor integration |
| **MCP** | MCPTool, McpAuthTool, ListMcpResources | MCP protocol tools |
| **Worktree** | EnterWorktree, ExitWorktree | Git worktree isolation |
| **Other** | SkillTool, ConfigTool, BriefTool, SleepTool | Auxiliary features |

### 4. Comparison with learn-claude-code's Dispatch Map

```python
# learn-claude-code: one dictionary does it all
TOOL_HANDLERS = {
    "bash":       lambda **kw: run_bash(kw["command"]),
    "read_file":  lambda **kw: run_read(kw["path"]),
    "write_file": lambda **kw: run_write(kw["path"], kw["content"]),
}
```

```typescript
// Claude Code: each tool is a class with independent:
// - permission policy (canUseTool)
// - UI rendering (renderToolUseMessage)
// - system prompt (prompt.ts)
// - security validation (pathValidation, readOnlyValidation, etc.)
// - progress reporting (ToolProgressData)
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| One directory per tool | Tool code, prompt, UI, tests self-contained |
| Conditional compilation loading | External builds exclude internal tools |
| lazy require | Break circular dependencies (tool→state→tool) |
| Independent tool prompts | Add/remove tools without changing core prompt |

## Practice Exercises

1. **Count tools**: In `src/tools.ts`, count how many tools `getTools()` returns
2. **Read the simplest tool**: Open `src/tools/GlobTool/GlobTool.ts` (6KB), understand the minimal tool implementation
3. **Compare the most complex tools**: Open `src/tools/BashTool/BashTool.tsx` (157KB) and `src/tools/AgentTool/AgentTool.tsx` (228KB), think about why they're so large
