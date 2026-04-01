# Ch05: Shell Security System — 300KB+ of Security Validation Code

`Ch01 > Ch02 > Ch03 > Ch04 > [ Ch05 ] Ch06 | Ch07 > Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"The most powerful tool needs the tightest protection—BashTool is the ceiling of capabilities, and the biggest security threat"*

## The Problem

The tutorial version uses a simple blacklist to block dangerous commands: `if any(d in command for d in ["rm -rf /", "sudo"])`. But in the real world, users can bypass blacklists through variable substitution, pipe combinations, encoding tricks, etc. How do you prevent dangerous operations without over-restricting the model's capabilities?

## Architecture Diagram

```
User request "run bash command"
        |
        v
BashTool.tsx (157KB)
        |
        ├──(1) Mode validation ─── modeValidation.ts
        │   "No execution in plan mode"
        │
        ├──(2) Security classification ─── bashSecurity.ts (100KB)
        │   command → [safe | readonly | destructive | dangerous]
        │   Based on AST parsing, pattern matching, semantic analysis
        │
        ├──(3) Permission decision ─── bashPermissions.ts (96KB)
        │   security level × permission mode → [allow | deny | ask]
        │
        ├──(4) Readonly validation ─── readOnlyValidation.ts (67KB)
        │   Ensure "readonly" commands are truly readonly
        │
        ├──(5) Path validation ─── pathValidation.ts (43KB)
        │   Workspace sandbox + path traversal protection
        │
        ├──(6) sed validation ──── sedValidation.ts (21KB)
        │   Special security handling for sed commands
        │
        └──(7) AI classifier ────── yoloClassifier.ts (51KB)
            Let the model judge command safety
            (for "auto-accept" mode)

        Total: 300KB+ security-related code
```

## Source Code Guide

### 1. Security Classification Engine — bashSecurity.ts (100KB)

This is the core of cores. Classifies each command into security levels:

```
safe        → Readonly operations (ls, cat, grep, git status)
readonly    → Explicitly no side effects (head, tail, wc, diff)
destructive → Side effects but controllable (mkdir, touch, git commit)
dangerous   → High-risk operations (rm -rf, chmod 777, curl | sh)
```

Classification isn't simple string matching—it's based on **semantic analysis** of commands:

- Parse pipes: `cat file | grep pattern` → final command is grep (safe)
- Identify redirects: `echo hello > file` → has write operation (destructive)
- Track variables: `CMD="rm -rf /"; $CMD` → detect variable expansion
- Analyze command combinations: `&&`, `||`, `;` split and analyze individually

### 2. Bash Command AST Parsing

File path: `src/utils/bash/` directory

This subdirectory contains a complete **Bash command parser**:

```
bash/
├── ast.ts              (109KB) — AST node definitions
├── bashParser.ts       (128KB) — Recursive descent parser
├── commands.ts         (50KB)  — Command semantic database
├── bashPipeCommand.ts  (10KB)  — Pipe command handling
├── heredoc.ts          (31KB)  — Here-document parsing
├── shellQuote.ts       (11KB)  — Shell quote handling
└── treeSitterAnalysis.ts (17KB) — Tree-sitter integration
```

Yes, Claude Code has a **built-in Bash parser** (128KB) that parses commands into AST for security analysis. This is not simple regex matching.

### 3. Permission Modes — User-Configurable Security Levels

File path: `src/utils/permissions/PermissionMode.ts`

```typescript
// Three permission modes:
type PermissionMode =
  | 'default'        // Default: destructive operations need confirmation
  | 'plan'           // Plan mode: can only think, cannot execute
  | 'bypassPermissions' // Full auto mode (dangerous!)
```

### 4. YOLO Classifier — Let AI Judge Safety

File path: `src/utils/permissions/yoloClassifier.ts` (51KB)

In "auto-accept" mode, the system uses another AI call to judge command safety.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| AST parsing instead of regex | Handles complex command structures (pipes, variables, quotes) |
| Multi-layer validation | modeValidation → bashSecurity → permissions → readonly validation |
| AI-based classification fallback | Handle edge cases that static analysis misses |
| 300KB+ security code | Security is not an afterthought—it's the foundation |

## Practice Exercises

1. **Read the AST parser**: Open `src/utils/bash/bashParser.ts`, find the pipe command parsing logic
2. **Understand security levels**: Open `src/utils/bash/bashSecurity.ts`, list commands in each security category
3. **Trace a dangerous command**: From user input `rm -rf /tmp`, trace through the entire validation pipeline
