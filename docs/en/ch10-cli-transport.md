# Ch11: CLI Transport Layer — Bridge from Terminal to Remote

`Ch01 > Ch02 > Ch03 > Ch04 > Ch05 > Ch06 | Ch07 > Ch08 > Ch09 > Ch10 > [ Ch11 ] Ch12`

> *"The transport layer determines where the agent can run—terminal, IDE, remote server, or browser"*

## The Problem

Claude Code isn't just a terminal tool. It needs to serve as VS Code extension backend, as remote server, as SDK embedded in other applications. Same core logic, multiple input/output methods.

## Architecture Diagram

```
User interface layer:
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Terminal     │  │   VS Code    │  │   SDK/API    │
  │  (React Ink)  │  │ (IDE integ.) │  │  (headless)  │
  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │                 │                  │
         v                 v                  v
Transport layer:
  ┌──────────────────────────────────────────────────┐
  │                cli/transports/                    │
  │  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
  │  │  SSE    │  │WebSocket │  │    Hybrid       │  │
  │  │Transport│  │Transport │  │   Transport     │  │
  │  │ (23KB)  │  │ (28KB)   │  │   (11KB)       │  │
  │  └─────────┘  └──────────┘  └────────────────┘  │
  └──────────────────────┬───────────────────────────┘
                         │
                         v
Core logic layer:
  ┌──────────────────────────────────────────────────┐
  │  QueryEngine → query() → tools → API             │
  │  (transport-agnostic)                             │
  └──────────────────────────────────────────────────┘
```

## Source Code Guide

### 1. React Ink — Terminal UI Framework

File path: `src/ink.ts` (4KB)

Claude Code's terminal UI isn't traditional `console.log`, but rendered with **React Ink**—using React components in the terminal:

```
components/
├── Spinner.tsx          — Loading animation
├── MessageSelector.tsx  — Message filtering
├── ToolRenderer.tsx     — Tool output rendering
└── ... (100+ components)

hooks/
├── useTextInput.ts      (17KB)  — Text input
├── useTypeahead.tsx     (208KB) — Auto-completion
├── useVirtualScroll.ts  (34KB)  — Virtual scrolling
├── useVoice.ts          (45KB)  — Voice input
└── ... (108 hooks)
```

### 2. Transport Protocols

```
cli/transports/
├── Transport.ts              (234B)  — Interface definition
├── SSETransport.ts           (23KB)  — Server-Sent Events
├── WebSocketTransport.ts     (28KB)  — WebSocket bi-directional
├── HybridTransport.ts        (11KB)  — SSE + WS hybrid
├── SerialBatchEventUploader.ts (9KB) — Batch event upload
└── ccrClient.ts              (33KB)  — CCR client
```

### 3. Structured IO

File path: `src/cli/structuredIO.ts` (28KB)

In SDK mode, input/output is transmitted via stdio in JSON format (NDJSON format).

### 4. Remote Sessions

File path: `src/remote/` directory

Supports remote sessions—agent runs on remote server, communicates with local terminal via WebSocket.

### 5. Print System

File path: `src/cli/print.ts` (208KB)

One of the **largest files** in the project, responsible for formatting agent's various outputs into terminal-readable forms.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| React Ink instead of raw stdout | Complex UI (progress bars, tables, diff highlighting) needs componentization |
| Multiple transport protocols | Adapt to different deployment scenarios |
| NDJSON structured output | SDK integration needs machine-readable format |
| Remote session support | Cloud development environments (like Codespaces) |

## Practice Exercises

1. **View transport interface**: Open `src/cli/transports/Transport.ts`, understand what the transport layer must implement
2. **Understand Ink components**: Open `src/components/` directory, browse a few component implementations, feel how React is used in terminal
3. **Trace output rendering**: When the model returns a code snippet, how is it formatted and highlighted by `print.ts`?
