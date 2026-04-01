# Ch03: Prompt Engineering — Dynamic System Prompt Assembly

`Ch01 > Ch02 > [ Ch03 ] Ch04 > Ch05 > Ch06 | Ch07 > Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"System Prompt is not a string—it's a dynamically assembled pipeline"*

## The Problem

Tutorial agents have a one-line system prompt. But production agents need dynamic adjustment based on context: different models have different capabilities, different tool sets need different instructions, user projects have custom rules (CLAUDE.md), MCP servers provide additional directives... How do you assemble all this into a coherent prompt?

## Architecture Diagram

```
System Prompt Assembly Pipeline:

┌─────────────────────────────────────────────────────┐
│                 getSystemPrompt()                    │
│                 constants/prompts.ts                 │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Core        │  │ Tool usage   │  │ Safety     │ │
│  │ identity    │  │ rules        │  │ constraints│ │
│  │ "You are    │  │ Usage guide  │  │ What you   │ │
│  │  Claude"    │  │ for each tool│  │ can't do   │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         └────────────────┼─────────────────┘        │
│                          v                           │
│                   Base prompt array                  │
└──────────────────────────┬──────────────────────────┘
                           |
           ┌───────────────┼───────────────┐
           v               v               v
    ┌────────────┐  ┌────────────┐  ┌────────────────┐
    │ CLAUDE.md  │  │ MCP servers│  │ User Context   │
    │ Project    │  │ Additional │  │ Env/Model/     │
    │ rules      │  │ directives │  │ Workspace info │
    │ (claudemd  │  │            │  │                │
    │  .ts 45KB) │  │            │  │                │
    └─────┬──────┘  └──────┬─────┘  └───────┬────────┘
          └────────────────┼─────────────────┘
                           v
                   Final system prompt
                   (passed to API as array)
```

## Source Code Guide

### 1. prompts.ts — Core Prompt Builder (53KB)

File path: `src/constants/prompts.ts`

This is one of the most important files in the project. The `getSystemPrompt()` function assembles the complete system prompt:

```typescript
// Usage (src/entrypoints/cli.tsx:67)
const prompt = await getSystemPrompt([], model);
```

Prompts are built as **arrays** (not single strings) to facilitate concatenation and manipulation.

### 2. CLAUDE.md — Project-Level Configuration

File path: `src/utils/claudemd.ts` (45KB)

CLAUDE.md is Claude Code's killer feature—users can customize agent behavior by placing a Markdown file in the project root:

```markdown
# CLAUDE.md example
- Use pnpm instead of npm
- Code style: use 4-space indentation
- Commit message format: feat(scope): description
```

`claudemd.ts` handles:
- Multi-level search: project root → parent dirs → user global → team shared
- Support for `@include` syntax to import other files
- Frontmatter metadata parsing
- Security filtering (prevent injection attacks)

### 3. messages.ts — Message Construction (189KB)

File path: `src/utils/messages.ts`

The second-largest file in the project. Responsible for building messages sent to the API, including:

- `createSystemMessage()` — system messages
- `createUserMessage()` — user messages
- `normalizeMessagesForAPI()` — message normalization (handle edge cases)
- `getMessagesAfterCompactBoundary()` — message trimming after compaction
- `createToolUseSummaryMessage()` — tool use summary
- `createMicrocompactBoundaryMessage()` — micro-compact boundary

### 4. queryContext.ts — Context Assembly

File path: `src/utils/queryContext.ts`

`fetchSystemPromptParts()` assembles prompt fragments from various sources:

```typescript
// src/QueryEngine.ts:288-299
const {
  defaultSystemPrompt,
  userContext: baseUserContext,
  systemContext,
} = await fetchSystemPromptParts({
  tools,
  mainLoopModel: initialMainLoopModel,
  additionalWorkingDirectories: [...],
  mcpClients,
  customSystemPrompt: customPrompt,
})
```

Returns three parts:
- `defaultSystemPrompt` — core prompt
- `userContext` — user-related context (injected into user messages)
- `systemContext` — system context (appended to end of system prompt)

## Layered Design of System Prompt

```
Layer 1: Core identity (immutable)
  "You are Claude, an AI programming assistant..."
  "You have access to the following tools..."

Layer 2: Tool instructions (varies with tool set)
  "When using the Bash tool..."
  "When using the FileEdit tool..."
  Each tool's prompt.ts file provides its own usage guide

Layer 3: Project rules (varies with CLAUDE.md)
  User-defined coding standards, build commands, etc.

Layer 4: Environment context (changes each time)
  Current working directory, Git branch, OS, model name
  Additional directives from MCP servers
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Prompt stored as array not string | Easier segmented operations, caching, token counting |
| Each tool has independent `prompt.ts` | Tool additions/removals don't affect core prompt |
| CLAUDE.md multi-level search | Monorepo subdirs can have different rules |
| User Context separate from System Prompt | User Context injected into user messages, doesn't occupy system prompt cache slots |

## Practice Exercises

1. **View tool prompts**: Open `src/tools/BashTool/prompt.ts` and `src/tools/FileEditTool/prompt.ts`, compare the usage guides for these two tools
2. **Understand CLAUDE.md parsing**: Create a `CLAUDE.md` in the repo root, then find the parsing logic in `src/utils/claudemd.ts`
3. **Trace prompt assembly**: Start from `fetchSystemPromptParts()` in `QueryEngine.ts`, trace to `getSystemPrompt()` in `prompts.ts`, draw the complete data flow
