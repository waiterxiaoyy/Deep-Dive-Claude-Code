# Ch07: Context Management — Doing Infinite Work in a Finite Window

`Ch01 > Ch02 > Ch03 > Ch04 > Ch05 > Ch06 | [ Ch07 ] Ch08 > Ch09 > Ch10 > Ch11 > Ch12`

> *"Context will always fill up—the key is when to compress, how to compress, and how to recover memory after compression"*

## The Problem

Model context windows are limited (128K-200K tokens). A long conversation quickly fills up with tool output—reading a large file costs 50K tokens, a few grep executions add another 30K tokens. When context is full, you either lose early information or get errors.

## Architecture Diagram

```
Message list growth over time:

Turn 1:  [user] [assistant] [tool_result]                    ~5K tokens
Turn 5:  [user] [assistant] [tool×3] [assistant] [tool×2]   ~30K tokens
Turn 10: [...lots of tool output...]                         ~80K tokens
Turn 15: [...approaching limit...]                           ~120K tokens ⚠️
                                                              |
         Three-layer compression strategy auto-activates:     |
         ==========================================             |
                                                              v
Layer 1: Micro-compact (microCompact)       ← Single message level
         Truncate overly long tool outputs
         e.g. 50K file content → keep head + tail + summary

Layer 2: Auto-compact (autoCompact)         ← Session level
         Triggered when tokens exceed threshold
         Use model to summarize first half of conversation → replace with compressed summary

Layer 3: Session Memory (SessionMemory)     ← Cross-compression level
         Extract key memories before compression
         Re-inject after compression
         + "dreaming" (autoDream) background consolidation

Compressed message list:
[compact_boundary] [memory_injection] [recent_messages...]
```

## Source Code Guide

### 1. Auto-Compact — autoCompact.ts (13KB)

File path: `src/services/compact/autoCompact.ts`

Compression trigger conditions:

```typescript
// Triggers when token usage exceeds threshold
// TOKEN_THRESHOLD in s_full.py is 100000
// Production version has more refined calculation
function calculateTokenWarningState(usage) {
  // Calculate warning level based on current token usage
  // warning → auto-compact → forced-compact
}
```

### 2. Compact Execution — compact.ts (59KB)

File path: `src/services/compact/compact.ts`

This is the core of context management. `buildPostCompactMessages()` builds the compressed message list:

```typescript
// src/query.ts:13 — used in query loop
import { buildPostCompactMessages } from './services/compact/compact.js'
```

Compression strategy:
1. Find compression boundary (keep last N messages)
2. Send messages before boundary to model for summarization
3. Replace original messages with summary
4. Insert `compact_boundary` marker

### 3. Micro-Compact — microCompact.ts (19KB)

File path: `src/services/compact/microCompact.ts`

Micro-compaction happens at **single message level**, no API call needed:

```typescript
// src/query.ts:54 — micro-compact boundary marker
import { createMicrocompactBoundaryMessage } from './utils/messages.js'
```

For example, a 50K token file content gets micro-compacted:
- Keep first 1000 lines
- Keep last 100 lines
- Replace middle with `... (N lines omitted) ...`

### 4. Session Memory — SessionMemory/

File path: `src/services/SessionMemory/`

```
SessionMemory/
├── sessionMemory.ts       (16KB) — Memory management
├── sessionMemoryUtils.ts  (6KB)  — Helper functions
└── prompts.ts             (12KB) — Memory extraction prompt
```

Memory extraction happens before compression, re-injection after. "Dreaming" consolidates memories in background.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Three-layer compression | Handle different scales: message / session / cross-session |
| Micro-compact without API | Fast, no cost, handles 80% of cases |
| Session memory extraction | Preserve key info across compressions |
| Auto-dream background consolidation | Reduce repeated memory extraction overhead |

## Practice Exercises

1. **Understand auto-compact triggers**: Open `src/services/compact/autoCompact.ts`, find the token threshold calculation
2. **Trace a compression**: From `buildPostCompactMessages()`, trace to model summarization and message replacement
3. **Test memory persistence**: In a long conversation, check if info from early turns survives compression
