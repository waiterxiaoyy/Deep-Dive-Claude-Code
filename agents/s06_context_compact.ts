/**
 * s07_context_compact.ts — 上下文压缩演示
 *
 * 演示 Claude Code 的三层压缩策略 (可实际运行):
 * 1. 微压缩: 截断旧的工具输出 (无 API 调用)
 * 2. 自动压缩: Token 超阈值时用模型总结 (需要 API)
 * 3. 记忆提取: 压缩前提取关键记忆, 压缩后重新注入
 *
 * Source: 
 *   src/services/compact/microCompact.ts    (19KB) — 微压缩
 *   src/services/compact/autoCompact.ts     (13KB) — 自动压缩触发
 *   src/services/compact/compact.ts         (59KB) — 压缩执行
 *   src/services/SessionMemory/             — 记忆管理
 *   src/services/autoDream/                 — "做梦" 整合
 *   src/utils/analyzeContext.ts             (42KB) — 上下文分析
 *
 * 运行: npx tsx agents/s07_context_compact.ts
 * 需要: ANTHROPIC_API_KEY (自动压缩部分)
 */

import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'

config({ override: true })

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
})
const MODEL = process.env.MODEL_ID || 'claude-sonnet-4-20250514'

// ============================================================
// 第 1 部分: Token 估算
// 真实源码: src/services/tokenEstimation.ts
// ============================================================

function estimateTokens(messages: any[]): number {
  return Math.round(JSON.stringify(messages).length / 4)
}

// ============================================================
// 第 2 部分: 微压缩 (Layer 1)
// 真实源码: src/services/compact/microCompact.ts
// 无 API 调用, 每个循环都执行
// 将旧的 tool_result 替换为占位符, 只保留最近 N 条
// ============================================================

const KEEP_RECENT = 3

function microCompact(messages: any[]): { messages: any[]; compacted: number } {
  // 收集所有 tool_result
  const toolResults: { msgIdx: number; partIdx: number; part: any; toolName: string }[] = []

  // 建立 tool_use_id → tool_name 映射
  const toolNameMap: Record<string, string> = {}
  for (const msg of messages) {
    if (msg.role === 'assistant' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_use') {
          toolNameMap[block.id] = block.name
        }
      }
    }
  }

  // 找到所有 tool_result
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      for (let j = 0; j < msg.content.length; j++) {
        const part = msg.content[j]
        if (part.type === 'tool_result') {
          toolResults.push({
            msgIdx: i, partIdx: j, part,
            toolName: toolNameMap[part.tool_use_id] || 'unknown',
          })
        }
      }
    }
  }

  if (toolResults.length <= KEEP_RECENT) {
    return { messages, compacted: 0 }
  }

  // 截断旧的 tool_result (保留最近 KEEP_RECENT 条)
  let compacted = 0
  const toClear = toolResults.slice(0, -KEEP_RECENT)
  for (const { part, toolName } of toClear) {
    if (typeof part.content === 'string' && part.content.length > 100) {
      const originalLen = part.content.length
      part.content = `[Previous: used ${toolName}, ${originalLen} chars]`
      compacted++
    }
  }

  return { messages, compacted }
}

// ============================================================
// 第 3 部分: 自动压缩 (Layer 2)
// 真实源码: src/services/compact/compact.ts
// 需要 API 调用, Token 超阈值时触发
// ============================================================

const TOKEN_THRESHOLD = 8000  // 演示用低阈值 (真实约 100K)

async function autoCompact(messages: any[]): Promise<{
  messages: any[]
  summary: string
  savedTokens: number
}> {
  const beforeTokens = estimateTokens(messages)

  // 提取记忆 (Layer 3 的一部分)
  const memories = extractMemories(messages)

  // 用模型总结对话
  const conversationText = JSON.stringify(messages).slice(0, 30000)
  const response = await client.messages.create({
    model: MODEL,
    messages: [{
      role: 'user',
      content: `Summarize this conversation for continuity. Include:
1) What was accomplished
2) Current state of files/code
3) Key decisions made
4) Pending tasks
Be concise but preserve critical details.

Conversation:
${conversationText}`,
    }],
    max_tokens: 1000,
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text : ''

  // 重建消息列表: [压缩标记] + [记忆注入] + [摘要]
  const newMessages: any[] = [
    {
      role: 'user',
      content: `[Context compressed. ${memories.length} memories preserved]\n\n${memories.map(m => `<memory>${m}</memory>`).join('\n')}\n\nSummary:\n${summary}`,
    },
    {
      role: 'assistant',
      content: 'Understood. I have the context from the summary and preserved memories. Continuing.',
    },
  ]

  const afterTokens = estimateTokens(newMessages)

  return {
    messages: newMessages,
    summary,
    savedTokens: beforeTokens - afterTokens,
  }
}

// ============================================================
// 第 4 部分: 记忆提取 (Layer 3)
// 真实源码: src/services/SessionMemory/
// 在压缩前提取关键信息, 压缩后重新注入
// ============================================================

function extractMemories(messages: any[]): string[] {
  const memories: string[] = []

  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)

    // 提取用户偏好
    if (content.match(/prefer|always|never|don't|style|convention/i)) {
      const snippet = content.slice(0, 200)
      if (msg.role === 'user') {
        memories.push(`User preference: ${snippet}`)
      }
    }

    // 提取文件修改记录
    if (content.match(/wrote|created|edited|modified|deleted/i) && content.match(/file|\.ts|\.py|\.js/i)) {
      const snippet = content.slice(0, 150)
      memories.push(`File change: ${snippet}`)
    }

    // 提取错误和修复
    if (content.match(/error|bug|fix|issue|resolved/i)) {
      const snippet = content.slice(0, 150)
      memories.push(`Issue: ${snippet}`)
    }
  }

  // 去重, 限制数量
  return [...new Set(memories)].slice(0, 5)
}

// ============================================================
// 主程序: 模拟一个会话的压缩过程
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  s07: Claude Code 上下文压缩演示                     ║')
  console.log('║  微压缩 + 自动压缩 + 记忆提取                      ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  // 构造一个模拟的对话历史 (模拟若干轮工具调用)
  const messages: any[] = [
    { role: 'user', content: 'I prefer using 4-space indentation. Please refactor src/main.ts' },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'I\'ll read the file first.' },
        { type: 'tool_use', id: 'tu_1', name: 'read_file', input: { path: 'src/main.ts' } },
      ],
    },
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'tu_1', content: 'const x = 1;\nconst y = 2;\n'.repeat(200) + '// ... 400 lines of code' },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Now let me check the tests.' },
        { type: 'tool_use', id: 'tu_2', name: 'bash', input: { command: 'find tests/ -name "*.test.ts"' } },
      ],
    },
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'tu_2', content: 'tests/unit.test.ts\ntests/integration.test.ts\ntests/e2e.test.ts\n'.repeat(50) },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'I found an error in the code. Let me fix it.' },
        { type: 'tool_use', id: 'tu_3', name: 'edit_file', input: { path: 'src/main.ts', old_str: 'const x = 1', new_str: 'const x: number = 1' } },
      ],
    },
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'tu_3', content: 'Edited src/main.ts' },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Now running the tests to verify.' },
        { type: 'tool_use', id: 'tu_4', name: 'bash', input: { command: 'npm test' } },
      ],
    },
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'tu_4', content: 'PASS tests/unit.test.ts\nPASS tests/integration.test.ts\n3 tests passed\n'.repeat(30) },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Let me also grep for other issues.' },
        { type: 'tool_use', id: 'tu_5', name: 'bash', input: { command: 'grep -r "TODO" src/' } },
      ],
    },
    {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'tu_5', content: 'src/main.ts:42: // TODO: add error handling\nsrc/utils.ts:15: // TODO: optimize\n'.repeat(40) },
      ],
    },
  ]

  const initialTokens = estimateTokens(messages)
  console.log(`━━━ 初始状态 ━━━`)
  console.log(`  消息数: ${messages.length}`)
  console.log(`  Token 估算: ~${initialTokens}`)
  console.log(`  工具调用: 5 次 (read_file, bash×3, edit_file)`)
  console.log()

  // --- Layer 1: 微压缩 ---
  console.log('━━━ Layer 1: 微压缩 (每轮执行, 无 API 调用) ━━━')
  const { compacted } = microCompact(messages)
  const afterMicroTokens = estimateTokens(messages)
  console.log(`  压缩了 ${compacted} 条旧 tool_result`)
  console.log(`  Token: ${initialTokens} → ${afterMicroTokens} (节省 ${initialTokens - afterMicroTokens})`)
  console.log()

  // --- 记忆提取 ---
  console.log('━━━ Layer 3: 记忆提取 (压缩前执行) ━━━')
  const memories = extractMemories(messages)
  for (const m of memories) {
    console.log(`  💾 ${m.slice(0, 80)}`)
  }
  console.log()

  // --- Layer 2: 自动压缩 ---
  if (afterMicroTokens > TOKEN_THRESHOLD) {
    console.log(`━━━ Layer 2: 自动压缩 (Token ${afterMicroTokens} > 阈值 ${TOKEN_THRESHOLD}) ━━━`)
    console.log('  调用模型生成摘要...\n')

    try {
      const result = await autoCompact(messages)
      console.log(`  摘要: \x1b[33m${result.summary.slice(0, 300)}\x1b[0m`)
      console.log(`\n  压缩后消息数: ${result.messages.length}`)
      console.log(`  Token 节省: ~${result.savedTokens}`)
      console.log(`  保留记忆: ${memories.length} 条`)
    } catch (e: any) {
      console.log(`  \x1b[90m(需要 API Key 才能演示自动压缩: ${e.message?.slice(0, 80)})\x1b[0m`)
      console.log('  在没有 API Key 的情况下, 只演示微压缩和记忆提取')
    }
  } else {
    console.log(`  Token ${afterMicroTokens} < 阈值 ${TOKEN_THRESHOLD}, 不触发自动压缩`)
  }

  console.log('\n━━━ 真实源码中的额外机制 ━━━')
  console.log('  • 响应式压缩 (REACTIVE_COMPACT) — 根据 API 返回的 token 使用动态调整')
  console.log('  • 上下文折叠 (CONTEXT_COLLAPSE) — 折叠重复的搜索/读取结果')
  console.log('  • 做梦 (autoDream/) — 后台异步整合散落的记忆片段')
  console.log('  • Tombstone 消息 — 被压缩删除的消息留下墓碑标记')
  console.log('  • Snip 投影 — REPL 保留完整历史, SDK 在边界处截断')

  console.log('\n━━━ 关键洞察 ━━━')
  console.log('  1. 微压缩零成本 — 不调 API, 每轮执行, 截断旧输出')
  console.log('  2. 记忆跨压缩保持 — 防止 Agent "失忆"')
  console.log('  3. 三层递进 — micro(免费) → auto(一次API) → dream(后台)')
  console.log('  4. Token 预算 — analyzeContext.ts 分析哪些消息最占空间')
}

main().catch(console.error)
