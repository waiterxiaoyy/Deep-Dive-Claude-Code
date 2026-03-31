"use client";

import dynamic from "next/dynamic";

// 新章节顺序映射：
// ch01 Agent循环 ← 旧ch02  ch02 工具 ← 旧ch04  ch03 Prompt ← 旧ch03
// ch04 安全 ← 旧ch05      ch05 权限 ← 旧ch06   ch06 上下文 ← 旧ch07
// ch07 MCP ← 旧ch08       ch08 插件 ← 旧ch09   ch09 多Agent ← 旧ch10
// ch10 传输 ← 旧ch11      ch11 启动 ← 旧ch01   ch12 生产 ← 旧ch12

const visualizations: Record<string, React.ComponentType> = {
  ch01: dynamic(() => import("./ch02-query-engine"), { ssr: false }),
  ch02: dynamic(() => import("./ch04-tool-system"), { ssr: false }),
  ch03: dynamic(() => import("./ch03-prompt-pipeline"), { ssr: false }),
  ch04: dynamic(() => import("./ch05-bash-security"), { ssr: false }),
  ch05: dynamic(() => import("./ch06-permissions"), { ssr: false }),
  ch06: dynamic(() => import("./ch07-context-compact"), { ssr: false }),
  ch07: dynamic(() => import("./ch08-mcp-protocol"), { ssr: false }),
  ch08: dynamic(() => import("./ch09-plugin-loader"), { ssr: false }),
  ch09: dynamic(() => import("./ch10-multi-agent"), { ssr: false }),
  ch10: dynamic(() => import("./ch11-transport"), { ssr: false }),
  ch11: dynamic(() => import("./ch01-bootstrap"), { ssr: false }),
  ch12: dynamic(() => import("./ch12-production"), { ssr: false }),
  ch13: dynamic(() => import("./ch13-hidden-features"), { ssr: false }),
};

interface ChapterVisualizationProps {
  chapterId: string;
}

export function ChapterVisualization({ chapterId }: ChapterVisualizationProps) {
  const Viz = visualizations[chapterId];
  if (!Viz) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
        该章节的交互式可视化正在开发中...
      </div>
    );
  }
  return <Viz />;
}
