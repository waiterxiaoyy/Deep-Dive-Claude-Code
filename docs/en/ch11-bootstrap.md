# Ch01: Bootstrap — From Enter to Prompt

`[ Ch01 ] Ch02 > Ch03 > Ch04 > Ch05 > Ch06 | Ch07 > Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"Fast path determines user experience, full path determines system capability"*

## The Problem

A CLI tool's first impression comes from startup speed. `claude --version` should return instantly, but the full REPL needs to load hundreds of modules, initialize auth, connect to MCP servers. How to make both coexist?

## Architecture Diagram

```
bun run dev
    |
    v
dev-entry.ts                          (Restored version entry)
    |  Scan src/ and vendor/ for missing imports
    |  missing=0 → forward to cli.tsx
    v
entrypoints/cli.tsx                    (Fast path dispatch)
    |
    ├── --version         → console.log(MACRO.VERSION)   [zero module load]
    ├── --dump-system-prompt → dynamic import prompts.ts  [minimal load]
    ├── --claude-in-chrome-mcp → Chrome MCP server
    ├── --daemon-worker   → daemon worker thread
    └── (others)          → dynamic import main.tsx       [full load]
                               |
                               v
main.tsx (785KB)
    |  Parallel prefetch: MDM config + Keychain creds + GrowthBook
    |  Commander.js argument parsing
    |  init() chain
    v
  REPL started
```

## Source Code Guide

### 1. dev-entry.ts — Restored Version Startup Guard (146 lines)

File path: `src/dev-entry.ts`

This file is specific to the restored version. It solves a problem: source map-restored code may have missing modules, direct startup would crash.

```typescript
// src/dev-entry.ts:26-29
// Inject compile-time macros, official version inlined by bun:bundle during build
if (!('MACRO' in globalThis)) {
  (globalThis as typeof globalThis & { MACRO: MacroConfig }).MACRO = defaultMacro
}
```

`collectMissingRelativeImports()` recursively scans all `.ts/.tsx` files, uses regex to match relative imports, checks if target files exist:

```typescript
// src/dev-entry.ts:73-74
const pattern =
  /(?:import|export)\s+[\s\S]*?from\s+['"](\.\.?\/[^'"]+)['"]|require\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g
```

Only when missing imports = 0, forward to real entry:

```typescript
// src/dev-entry.ts:145
await import('./entrypoints/cli.tsx')
```

### 2. cli.tsx — Fast Path Dispatch (303 lines)

File path: `src/entrypoints/cli.tsx`

Core design philosophy: **load on demand**. `--version` needs zero modules, only read compile-time constants:

```typescript
// src/entrypoints/cli.tsx:37-42
if (args.length === 1 && (args[0] === '--version' || args[0] === '-v')) {
  // MACRO.VERSION inlined at build time, zero runtime import
  console.log(`${MACRO.VERSION} (Claude Code)`);
  return;
}
```

All other paths use **dynamic `import()`**, avoiding loading unrelated modules on fast path:

```typescript
// src/entrypoints/cli.tsx:45-48
// Only non --version paths load startupProfiler
const { profileCheckpoint } = await import('../utils/startupProfiler.js');
profileCheckpoint('cli_entry');
```

`feature()` macro implements **compile-time feature elimination** (Dead Code Elimination):

```typescript
// src/entrypoints/cli.tsx:21-26
// feature('ABLATION_BASELINE') replaced with false in external builds
// Entire if block removed at build time, doesn't enter final artifact
if (feature('ABLATION_BASELINE') && process.env.CLAUDE_CODE_ABLATION_BASELINE) {
  // Ablation experiment: disable thinking, compact, auto memory, etc.
}
```

### 3. main.tsx — Full Bootstrap (785KB, 4691 lines)

File path: `src/main.tsx`

The **largest file** in the project. First 20 lines contain critical performance optimizations—three parallel prefetches:

```typescript
// src/main.tsx:1-20
// These side effects must execute before all other imports:
// 1. profileCheckpoint marks entry time
// 2. startMdmRawRead launches MDM subprocess (plutil/reg query), parallel with subsequent 135ms import
// 3. startKeychainPrefetch parallel read macOS keychain (OAuth + API key), saves ~65ms

import { profileCheckpoint } from './utils/startupProfiler.js';
profileCheckpoint('main_tsx_entry');

import { startMdmRawRead } from './utils/settings/mdm/rawRead.js';
startMdmRawRead();

import { startKeychainPrefetch } from './utils/secureStorage/keychainPrefetch.js';
startKeychainPrefetch();
```

**Why put side effects between imports?** Because ES module imports are evaluated sequentially. After `startMdmRawRead()` executes on line 16, imports on lines 17-66 still need ~135ms to evaluate—during this time, the MDM subprocess is already running in the background.

## Key Design Decisions

| Decision | Rationale | Alternative |
|----------|-----------|-------------|
| `--version` zero load | UX: instant return | Load then output (200ms+ slower) |
| Dynamic `import()` | Fast path doesn't pay full load cost | Top-level import (all paths slow) |
| `feature()` compile-time elimination | External builds exclude internal feature code | Runtime if check (code still in artifact) |
| Parallel prefetch (MDM + Keychain) | Use import evaluation time for I/O | Serial execution (65ms+ slower startup) |
| `require()` lazy load | Break circular dependencies | Refactor dependency graph (high cost) |

## Practice Exercises

1. **Trace startup flow**: Add `console.time('startup')` at `dev-entry.ts` line 98, add `console.timeEnd('startup')` before entering `main()` in `cli.tsx`, observe startup time
2. **View missing imports**: Run `bun run version`, check if output has `missing_relative_imports`
3. **Understand feature() macro**: Search `feature(` in source code, list all feature gates, think which are internal features, which are experimental
