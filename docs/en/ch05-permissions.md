# Ch06: File Operations & Permissions — Every Read and Write Goes Through Permission Checks

`Ch01 > Ch02 > Ch03 > Ch04 > Ch05 > [ Ch06 ] | Ch07 > Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"Permissions aren't a feature added later—they're the skeleton of the architecture"*

## The Problem

AI agents can read and write arbitrary files. How do you prevent them from reading `/etc/passwd`, modifying `~/.ssh/authorized_keys`, or overwriting code the user didn't ask them to touch?

## Architecture Diagram

```
File operation request
    |
    v
┌─────────────────────────────────────────────┐
│           permissions/permissions.ts (51KB)   │
│                                               │
│  PermissionRule[] (from CLAUDE.md + settings) │
│  ┌─────────────────────────────────────────┐ │
│  │ Allow: ["src/**", "tests/**"]           │ │
│  │ Deny:  [".env", "*.key", "/etc/**"]     │ │
│  │ Ask:   ["package.json", "*.config.*"]   │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   |
                   v
┌─────────────────────────────────────────────┐
│        permissions/filesystem.ts (61KB)       │
│                                               │
│  Path validation:                             │
│  ├── Relative to workspace?                   │
│  ├── Matches deny rule?                       │
│  ├── Matches allow rule?                      │
│  └── Need to ask user?                        │
│                                               │
│  Path normalization:                          │
│  ├── Resolve symlinks                         │
│  ├── Prevent ../ traversal                    │
│  └── Unify Windows/macOS/Linux paths          │
└──────────────────┬──────────────────────────┘
                   |
          allow / deny / ask
                   |
                   v
┌─────────────────────────────────────────────┐
│       fsOperations.ts (24KB) — Abstraction   │
│                                               │
│  readFileSync()   writeFileSync()             │
│  copyFileSync()   unlinkSync()                │
│  renameSync()     mkdirSync()                 │
│  readdirSync()                                │
│                                               │
│  All fs operations go through this layer      │
│  Easy to test, mock, and intercept            │
└───────────────────────────────────────────── ┘
```

## Source Code Guide

### 1. Permission Engine — permissions.ts (51KB)

File path: `src/utils/permissions/permissions.ts`

Permission rules support glob pattern matching:

```typescript
// Rule examples (from CLAUDE.md or user settings)
// allow: "src/**"          → Allow operations on all files under src
// deny: ".env"             → Prohibit operations on .env
// ask: "package.json"      → Ask user when modifying package.json
```

### 2. Filesystem Permissions — filesystem.ts (61KB)

File path: `src/utils/permissions/filesystem.ts`

The largest file in the permission system, handles:
- Workspace boundary checks (files must be within allowed directories)
- Scratchpad directory (agent's dedicated temp directory)
- Additional working directory management
- Symlink security (prevent sandbox escape via soft links)

### 3. File Operation Abstraction — fsOperations.ts (24KB)

File path: `src/utils/fsOperations.ts`

All filesystem operations go through unified abstraction:

```typescript
// src/utils/fsOperations.ts — interface definition
interface FsOperations {
  readFileSync(path: string, options?: { encoding?: string }): string | Buffer
  writeFileSync(path: string, data: string | Buffer): void
  copyFileSync(src: string, dest: string): void
  unlinkSync(path: string): void
  renameSync(oldPath: string, newPath: string): void
  mkdirSync(path: string, options?: { recursive?: boolean }): void
  readdirSync(path: string): Dirent[]
  // ...
}
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Glob patterns in rules | User-friendly, matches .gitignore conventions |
| Scratchpad directory | Agent-owned space for intermediate files |
| All fs ops through abstraction | Easy to mock, test, and add monitoring |
| Workspace boundary enforcement | Prevent access outside allowed directories |

## Practice Exercises

1. **Understand permission rules**: Open `src/utils/permissions/permissions.ts`, find the glob matching logic
2. **Trace a file read**: From FileReadTool → permissions check → fsOperations → actual fs.readFileSync
3. **Test sandbox escape**: Try reading `/etc/passwd` or `~/.ssh/id_rsa`, trace how the system blocks it
