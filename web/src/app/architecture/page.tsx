"use client";

import Link from "next/link";

const ARCH_LAYERS = [
  { name: "CLI 入口", color: "#3B82F6", files: "cli.tsx → main.tsx", size: "~800KB", y: 0 },
  { name: "查询引擎", color: "#3B82F6", files: "QueryEngine.ts + query.ts", size: "113KB", y: 1 },
  { name: "Prompt 管线", color: "#3B82F6", files: "prompts.ts + claudemd.ts + messages.ts", size: "287KB", y: 2 },
  { name: "工具系统", color: "#10B981", files: "50+ 工具, Tool.ts + tools.ts", size: "1MB+", y: 3 },
  { name: "安全 & 权限", color: "#10B981", files: "bashSecurity + permissions/", size: "535KB", y: 4 },
  { name: "上下文压缩", color: "#8B5CF6", files: "compact/ + SessionMemory/ + autoDream/", size: "130KB+", y: 5 },
  { name: "MCP + 插件", color: "#EF4444", files: "mcp/ + plugins/", size: "450KB+", y: 6 },
  { name: "多 Agent", color: "#EF4444", files: "AgentTool + swarm/ + teammate*", size: "300KB+", y: 7 },
  { name: "传输层", color: "#EF4444", files: "transports/ + structuredIO", size: "100KB+", y: 8 },
  { name: "生产工程", color: "#F59E0B", files: "sessionStorage + analytics + errors", size: "300KB+", y: 9 },
  { name: "隐藏功能 (Feature Flags)", color: "#F59E0B", files: "buddy/ + ultraplan + undercover + daemon + kairos", size: "500KB+", y: 10 },
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="hover:text-white">首页</Link>
        <span className="mx-2">/</span>
        <span className="text-white">架构总览</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold">Claude Code 架构总览</h1>
      <p className="mb-8 text-zinc-400">从顶到底的分层架构，~960 个 TypeScript 文件</p>

      {/* 分层架构图 */}
      <div className="space-y-2">
        {ARCH_LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="flex items-center gap-4 rounded-lg border border-zinc-800 p-4 transition hover:bg-zinc-900/50"
          >
            <div
              className="h-10 w-1 flex-shrink-0 rounded-full"
              style={{ backgroundColor: layer.color }}
            />
            <div className="flex-1">
              <div className="font-medium">{layer.name}</div>
              <div className="text-sm text-zinc-500">{layer.files}</div>
            </div>
            <div className="text-right text-sm text-zinc-600">{layer.size}</div>
          </div>
        ))}
      </div>

      {/* 数据流 */}
      <div className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">数据流</h2>
        <div className="card font-mono text-sm leading-relaxed text-zinc-400">
          <pre>{`用户输入
  │
  ▼
QueryEngine.submitMessage(prompt)    ← AsyncGenerator
  │
  ├─ fetchSystemPromptParts()        ← 动态 Prompt 组装
  │    ├─ 核心身份
  │    ├─ 工具指令 (50+ tools/*/prompt.ts)
  │    ├─ CLAUDE.md (多级查找)
  │    └─ 环境上下文
  │
  ├─ query() 循环                    ← 核心循环
  │    ├─ API 调用 (流式)
  │    ├─ canUseTool() 权限检查
  │    ├─ tool.call() 执行
  │    ├─ microCompact() 微压缩
  │    └─ autoCompact() 自动压缩
  │
  └─ yield SDKMessage                ← 流式输出
       ├─ 终端 (React Ink)
       ├─ IDE (SSE/WebSocket)
       └─ SDK (NDJSON stdio)`}</pre>
        </div>
      </div>

      {/* 代码量统计 */}
      <div className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">代码量统计</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "TypeScript 文件", value: "~960" },
            { label: "工具数量", value: "50+" },
            { label: "安全代码", value: "535KB" },
            { label: "最大文件", value: "785KB" },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="mt-1 text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 完整源码指引 */}
      <div className="mt-12 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
        <h2 className="mb-2 text-xl font-semibold text-blue-400">📦 想看完整源码？</h2>
        <p className="mb-4 text-sm text-zinc-400">
          本项目只摘取了核心文件用于教学分析。如果你想阅读完整的 Claude Code 源码、在本地编译并运行，
          请前往以下仓库：
        </p>
        <a
          href="https://github.com/oboard/claude-code-rev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          oboard/claude-code-rev
        </a>
        <p className="mt-3 text-xs text-zinc-600">
          该项目支持本地 <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">bun install</code> + <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">bun build</code> 编译运行完整的 Claude Code。
        </p>
      </div>

      {/* 完整解析 Wiki */}
      <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
        <h2 className="mb-2 text-xl font-semibold text-purple-400">📖 完整源码解析 Wiki</h2>
        <p className="mb-4 text-sm text-zinc-400">
          想要更系统地逐文件阅读 Claude Code 源码？这里有一份完整的源码解析 Wiki，覆盖每个模块的详细注释和分析。
        </p>
        <a
          href="https://cnb.cool/nfeyre/claudecode-src/-/wiki"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-400 transition hover:bg-purple-500/20"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          claudecode-src Wiki — 完整源码解析
        </a>
      </div>
    </div>
  );
}
