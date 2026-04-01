/**
 * s02_query_engine.ts — 查询引擎演示
 *
 * 演示 Claude Code QueryEngine 的核心设计:
 * 1. AsyncGenerator 流式输出（对比教学版的同步循环）
 * 2. 多种退出条件（不只是 stop_reason）
 * 3. 权限拦截层（canUseTool 包装）
 * 4. 消息类型系统（8 种联合类型）
 *
 * Source: 
 *   src/QueryEngine.ts:184-300  → 类定义 + submitMessage
 *   src/query.ts                → 核心循环
 *   src/types/message.ts        → 消息类型
 *
 *     QueryEngine (一个会话一个实例)
 *     ├── mutableMessages[]     跨轮次状态
 *     ├── totalUsage            累计 Token
 *     └── submitMessage()  ──>  async generator
 *              |
 *              v
 *         query() 循环
 *         ├── API 调用 (流式)
 *         ├── 工具权限检查
 *         ├── 工具执行
 *         ├── 微压缩检查
 *         └── 自动压缩检查
 *
 * 运行: npx tsx agents/s02_query_engine.ts
 * 需要: ANTHROPIC_API_KEY 环境变量
 */

import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import { execSync } from 'child_process'
import * as readline from 'readline'

config({ override: true })

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
})
const MODEL = process.env.MODEL_ID || 'claude-sonnet-4-20250514'

// ============================================================
// 第 1 部分: 消息类型系统
// 真实源码: src/types/message.ts
// Claude Code 的消息不是简单的 {role, content}
// ============================================================

type MessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'attachment'
  | 'progress'
  | 'tool_use_summary'
  | 'tombstone'           // 被压缩删除的消息的墓碑
  | 'system_local_command'

interface Message {
  type: MessageType
  role: 'user' | 'assistant'
  content: any
  metadata?: {
    tokens?: number
    timestamp?: number
    toolName?: string
    isCompacted?: boolean
  }
}

// ============================================================
// 第 2 部分: 权限检查层
// 真实源码: src/QueryEngine.ts:244-271
// 每个工具调用都经过 canUseTool 检查
// ============================================================

type PermissionResult = { behavior: 'allow' } | { behavior: 'deny'; reason: string } | { behavior: 'ask' }

interface PermissionDenial {
  tool_name: string
  tool_use_id: string
  tool_input: any
}

const DANGEROUS_COMMANDS = ['rm -rf /', 'sudo', 'shutdown', '> /dev/']

function canUseTool(toolName: string, input: any): PermissionResult {
  if (toolName === 'bash') {
    const cmd = input.command || ''
    for (const d of DANGEROUS_COMMANDS) {
      if (cmd.includes(d)) {
        return { behavior: 'deny', reason: `Blocked: contains "${d}"` }
      }
    }
  }
  return { behavior: 'allow' }
}

// ============================================================
// 第 3 部分: QueryEngine 类
// 真实源码: src/QueryEngine.ts:184-207
// ============================================================

interface QueryEngineConfig {
  model: string
  maxTurns: number          // 最大循环轮次
  maxTokens: number         // 单次最大 token
  tools: Anthropic.Tool[]
  toolHandlers: Record<string, (input: any) => string>
}

class QueryEngine {
  private messages: Anthropic.MessageParam[] = []
  private totalUsage = { input_tokens: 0, output_tokens: 0 }
  private permissionDenials: PermissionDenial[] = []
  private turnCount = 0
  private config: QueryEngineConfig

  constructor(config: QueryEngineConfig) {
    this.config = config
  }

  /**
   * submitMessage — AsyncGenerator 模式
   * 真实源码: src/QueryEngine.ts:209-212
   * 返回 AsyncGenerator 而不是 Promise, 支持流式输出
   */
  async *submitMessage(prompt: string): AsyncGenerator<{
    type: 'text' | 'tool_call' | 'tool_result' | 'turn_complete' | 'budget_exceeded'
    content: string
  }> {
    this.messages.push({ role: 'user', content: prompt })
    this.turnCount = 0

    while (true) {
      this.turnCount++

      // --- 退出条件 1: 最大轮次 ---
      if (this.turnCount > this.config.maxTurns) {
        yield { type: 'budget_exceeded', content: `Max turns (${this.config.maxTurns}) exceeded` }
        return
      }

      // --- API 调用 ---
      const response = await client.messages.create({
        model: this.config.model,
        system: `You are a coding agent at ${process.cwd()}. Use tools to solve tasks. Be concise.`,
        messages: this.messages,
        tools: this.config.tools,
        max_tokens: this.config.maxTokens,
      })

      // 累计 Token
      this.totalUsage.input_tokens += response.usage.input_tokens
      this.totalUsage.output_tokens += response.usage.output_tokens

      this.messages.push({ role: 'assistant', content: response.content })

      // 产出文本内容
      for (const block of response.content) {
        if (block.type === 'text') {
          yield { type: 'text', content: block.text }
        }
      }

      // --- 退出条件 2: 模型停止调用工具 ---
      if (response.stop_reason !== 'tool_use') {
        yield {
          type: 'turn_complete',
          content: `[轮次 ${this.turnCount}, 累计 tokens: ${this.totalUsage.input_tokens}+${this.totalUsage.output_tokens}, 权限拒绝: ${this.permissionDenials.length}]`,
        }
        return
      }

      // --- 工具执行 (带权限检查) ---
      const results: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        // 权限检查 — 真实源码: QueryEngine.ts:244-271
        const permission = canUseTool(block.name, block.input)

        if (permission.behavior === 'deny') {
          this.permissionDenials.push({
            tool_name: block.name,
            tool_use_id: block.id,
            tool_input: block.input,
          })
          yield { type: 'tool_result', content: `\x1b[31m⛔ ${block.name}: ${(permission as any).reason}\x1b[0m` }
          results.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Permission denied: ${(permission as any).reason}`,
          })
          continue
        }

        // 执行工具
        const handler = this.config.toolHandlers[block.name]
        const output = handler
          ? handler(block.input)
          : `Unknown tool: ${block.name}`

        yield { type: 'tool_call', content: `\x1b[33m🔧 ${block.name}\x1b[0m` }
        yield { type: 'tool_result', content: output.slice(0, 200) }

        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: output,
        })
      }

      this.messages.push({ role: 'user', content: results })
    }
  }

  getUsage() { return this.totalUsage }
  getDenials() { return this.permissionDenials }
}

// ============================================================
// 第 4 部分: 工具定义
// ============================================================

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'bash',
    description: 'Run a shell command. Returns stdout+stderr.',
    input_schema: {
      type: 'object' as const,
      properties: { command: { type: 'string', description: 'The command to run' } },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read file contents.',
    input_schema: {
      type: 'object' as const,
      properties: { path: { type: 'string' }, limit: { type: 'number' } },
      required: ['path'],
    },
  },
]

const TOOL_HANDLERS: Record<string, (input: any) => string> = {
  bash: (input) => {
    try {
      return execSync(input.command, {
        cwd: process.cwd(), encoding: 'utf-8', timeout: 30000,
      }).trim() || '(no output)'
    } catch (e: any) {
      return `Error: ${e.message?.slice(0, 500)}`
    }
  },
  read_file: (input) => {
    try {
      const { readFileSync } = require('fs')
      const content = readFileSync(input.path, 'utf-8')
      const lines = content.split('\n')
      if (input.limit && input.limit < lines.length) {
        return lines.slice(0, input.limit).join('\n') + `\n... (${lines.length - input.limit} more lines)`
      }
      return content.slice(0, 50000)
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  },
}

// ============================================================
// 主程序: 交互式 REPL
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  s02: Claude Code 查询引擎演示                       ║')
  console.log('║  AsyncGenerator + 权限检查 + 多种退出条件           ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()
  console.log('特性: 流式输出 | 权限拦截 | Token 统计 | 最大轮次限制')
  console.log('试试: "List files in current directory"')
  console.log('试试: "Run sudo rm -rf /" (会被权限拦截)')
  console.log()

  const engine = new QueryEngine({
    model: MODEL,
    maxTurns: 10,
    maxTokens: 4096,
    tools: TOOLS,
    toolHandlers: TOOL_HANDLERS,
  })

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const ask = () => {
    rl.question('\x1b[36ms02 >> \x1b[0m', async (query) => {
      if (!query.trim() || ['q', 'exit'].includes(query.trim().toLowerCase())) {
        const usage = engine.getUsage()
        const denials = engine.getDenials()
        console.log(`\n[Session: ${usage.input_tokens}+${usage.output_tokens} tokens, ${denials.length} denials]`)
        rl.close()
        return
      }

      // 使用 AsyncGenerator 消费流式输出
      for await (const event of engine.submitMessage(query)) {
        switch (event.type) {
          case 'text':
            process.stdout.write(event.content)
            break
          case 'tool_call':
          case 'tool_result':
            console.log(`  ${event.content}`)
            break
          case 'turn_complete':
            console.log(`\n\x1b[90m${event.content}\x1b[0m`)
            break
          case 'budget_exceeded':
            console.log(`\n\x1b[31m${event.content}\x1b[0m`)
            break
        }
      }
      console.log()
      ask()
    })
  }

  ask()
}

main().catch(console.error)
