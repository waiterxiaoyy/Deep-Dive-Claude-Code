/**
 * s06_permissions.ts — 权限引擎演示
 *
 * 演示 Claude Code 的文件权限系统:
 * 1. 三级权限 (allow/deny/ask) + glob 模式匹配
 * 2. 路径沙箱 (工作区边界检查)
 * 3. 环境变量清洗 (子进程安全)
 *
 * Source: 
 *   src/utils/permissions/permissions.ts  (51KB)
 *   src/utils/permissions/filesystem.ts   (61KB)
 *   src/utils/fsOperations.ts             (24KB)
 *   src/utils/subprocessEnv.ts            (4KB)
 *
 * 运行: npx tsx agents/s06_permissions.ts
 */

import * as path from 'path'
import * as os from 'os'

// ============================================================
// 第 1 部分: 权限规则
// 真实源码: src/utils/permissions/permissions.ts
// ============================================================

type PermissionAction = 'allow' | 'deny' | 'ask'

interface PermissionRule {
  pattern: string       // glob 模式
  action: PermissionAction
  source: string        // 规则来源 (CLAUDE.md / settings / built-in)
}

// 默认规则 (内置)
const DEFAULT_RULES: PermissionRule[] = [
  // 总是拒绝
  { pattern: '.env', action: 'deny', source: 'built-in' },
  { pattern: '.env.*', action: 'deny', source: 'built-in' },
  { pattern: '**/*.key', action: 'deny', source: 'built-in' },
  { pattern: '**/*.pem', action: 'deny', source: 'built-in' },
  { pattern: '**/id_rsa*', action: 'deny', source: 'built-in' },
  { pattern: '/etc/**', action: 'deny', source: 'built-in' },
  { pattern: `${os.homedir()}/.ssh/**`, action: 'deny', source: 'built-in' },

  // 需要询问
  { pattern: 'package.json', action: 'ask', source: 'built-in' },
  { pattern: '*.config.*', action: 'ask', source: 'built-in' },
  { pattern: '.github/**', action: 'ask', source: 'built-in' },

  // 默认允许 (工作区内)
  { pattern: 'src/**', action: 'allow', source: 'built-in' },
  { pattern: 'tests/**', action: 'allow', source: 'built-in' },
  { pattern: '**/*.ts', action: 'allow', source: 'built-in' },
  { pattern: '**/*.md', action: 'allow', source: 'built-in' },
]

// ============================================================
// 第 2 部分: Glob 匹配器 (简化版)
// 真实源码使用 picomatch 库
// ============================================================

function globMatch(pattern: string, filepath: string): boolean {
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '@@GLOBSTAR@@')
    .replace(/\*/g, '[^/]*')
    .replace(/@@GLOBSTAR@@/g, '.*')
  return new RegExp(`^${regexStr}$`).test(filepath)
}

// ============================================================
// 第 3 部分: 路径沙箱
// 真实源码: src/utils/permissions/filesystem.ts
// ============================================================

function validatePath(
  filepath: string,
  workspace: string
): { valid: boolean; resolved: string; reason?: string } {
  const resolved = path.resolve(workspace, filepath)

  // 检查 1: 是否在工作区内
  if (!resolved.startsWith(workspace + path.sep) && resolved !== workspace) {
    return {
      valid: false,
      resolved,
      reason: `Path escapes workspace: ${resolved} is outside ${workspace}`,
    }
  }

  // 检查 2: 符号链接安全 (简化 — 真实版还检查 readlink)
  if (filepath.includes('..')) {
    const parts = filepath.split(path.sep)
    let depth = 0
    for (const p of parts) {
      if (p === '..') depth--
      else if (p !== '.') depth++
      if (depth < 0) {
        return {
          valid: false,
          resolved,
          reason: `Path traversal detected: "${filepath}" goes above workspace`,
        }
      }
    }
  }

  return { valid: true, resolved }
}

// ============================================================
// 第 4 部分: 权限引擎
// 真实源码: src/utils/permissions/permissions.ts
// ============================================================

function checkPermission(
  filepath: string,
  workspace: string,
  rules: PermissionRule[] = DEFAULT_RULES
): {
  action: PermissionAction
  matchedRule?: PermissionRule
  pathValidation: ReturnType<typeof validatePath>
} {
  // 先做路径沙箱检查
  const pathResult = validatePath(filepath, workspace)
  if (!pathResult.valid) {
    return {
      action: 'deny',
      pathValidation: pathResult,
    }
  }

  // 相对路径匹配规则 (deny 优先于 ask 优先于 allow)
  const relative = path.relative(workspace, pathResult.resolved)

  // 第一轮: 检查 deny
  for (const rule of rules.filter(r => r.action === 'deny')) {
    if (globMatch(rule.pattern, relative) || globMatch(rule.pattern, pathResult.resolved)) {
      return { action: 'deny', matchedRule: rule, pathValidation: pathResult }
    }
  }

  // 第二轮: 检查 ask
  for (const rule of rules.filter(r => r.action === 'ask')) {
    if (globMatch(rule.pattern, relative)) {
      return { action: 'ask', matchedRule: rule, pathValidation: pathResult }
    }
  }

  // 第三轮: 检查 allow
  for (const rule of rules.filter(r => r.action === 'allow')) {
    if (globMatch(rule.pattern, relative)) {
      return { action: 'allow', matchedRule: rule, pathValidation: pathResult }
    }
  }

  // 默认: 工作区内允许
  return { action: 'allow', pathValidation: pathResult }
}

// ============================================================
// 第 5 部分: 环境变量清洗
// 真实源码: src/utils/subprocessEnv.ts
// ============================================================

const SENSITIVE_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'OPENAI_API_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'CLAUDE_CODE_OAUTH_TOKEN',
  'DATABASE_URL',
  'REDIS_URL',
  'INPUT_ANTHROPIC_API_KEY',
]

function sanitizeEnvForSubprocess(env: Record<string, string>): {
  cleaned: Record<string, string>
  removed: string[]
} {
  const cleaned = { ...env }
  const removed: string[] = []

  for (const key of SENSITIVE_ENV_VARS) {
    if (key in cleaned) {
      delete cleaned[key]
      removed.push(key)
    }
  }

  // 也清理 INPUT_ 前缀的变量 (GitHub Actions)
  for (const key of Object.keys(cleaned)) {
    if (key.startsWith('INPUT_') && key.toLowerCase().includes('key')) {
      delete cleaned[key]
      removed.push(key)
    }
  }

  return { cleaned, removed }
}

// ============================================================
// 主程序
// ============================================================

function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  s06: Claude Code 权限引擎演示                       ║')
  console.log('║  规则匹配 + 路径沙箱 + 环境清洗                    ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log()

  const workspace = process.cwd()

  // 1. 权限规则检查
  console.log('━━━ 1. 文件权限检查 ━━━\n')

  const testFiles = [
    'src/main.ts',
    'tests/test_unit.ts',
    'README.md',
    '.env',
    '.env.local',
    'secrets/api.key',
    'package.json',
    'tsconfig.json',
    '.github/workflows/ci.yml',
    '/etc/passwd',
    '../../../etc/shadow',
    `${os.homedir()}/.ssh/id_rsa`,
  ]

  const actionColors: Record<PermissionAction, string> = {
    allow: '\x1b[32m',  deny: '\x1b[31m', ask: '\x1b[33m',
  }

  for (const file of testFiles) {
    const result = checkPermission(file, workspace)
    const color = actionColors[result.action]
    const rule = result.matchedRule
      ? `← ${result.matchedRule.pattern} (${result.matchedRule.source})`
      : result.pathValidation.reason || ''
    console.log(`  ${color}[${result.action.padEnd(5)}]\x1b[0m ${file.padEnd(35)} \x1b[90m${rule}\x1b[0m`)
  }

  // 2. 路径沙箱
  console.log('\n━━━ 2. 路径沙箱验证 ━━━\n')

  const pathTests = [
    'src/index.ts',
    './test/unit.ts',
    '../sibling-project/secret.txt',
    '../../etc/passwd',
    '/usr/bin/env',
  ]

  for (const p of pathTests) {
    const result = validatePath(p, workspace)
    const icon = result.valid ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
    console.log(`  ${icon} ${p.padEnd(35)} ${result.valid ? '' : `\x1b[90m${result.reason}\x1b[0m`}`)
  }

  // 3. 环境变量清洗
  console.log('\n━━━ 3. 子进程环境变量清洗 ━━━\n')

  const mockEnv: Record<string, string> = {
    PATH: '/usr/bin:/bin',
    HOME: os.homedir(),
    ANTHROPIC_API_KEY: 'sk-ant-secret123',
    AWS_SECRET_ACCESS_KEY: 'aws-secret',
    GITHUB_TOKEN: 'ghp_xxxx',
    NODE_ENV: 'development',
    DATABASE_URL: 'postgres://user:pass@localhost/db',
    EDITOR: 'vim',
  }

  const { cleaned, removed } = sanitizeEnvForSubprocess(mockEnv)

  console.log('  清洗前:')
  for (const [k, v] of Object.entries(mockEnv)) {
    const isSensitive = removed.includes(k)
    if (isSensitive) {
      console.log(`    \x1b[31m${k}=${v.slice(0, 10)}...\x1b[0m`)
    } else {
      console.log(`    ${k}=${v}`)
    }
  }

  console.log(`\n  清洗后: 移除了 ${removed.length} 个敏感变量`)
  for (const key of removed) {
    console.log(`    \x1b[31m✗ ${key}\x1b[0m`)
  }

  console.log('\n━━━ 关键洞察 ━━━')
  console.log('  1. 三级权限 (deny > ask > allow) — deny 优先匹配')
  console.log('  2. 路径沙箱 — 所有路径 resolve 后检查是否在工作区内')
  console.log('  3. 环境清洗 — 子进程拿不到 API Key (防止 $ANTHROPIC_API_KEY 泄露)')
  console.log('  4. 规则来源 — built-in + CLAUDE.md + 用户设置, 可叠加')
}

main()
