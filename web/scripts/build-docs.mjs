// 构建时将 MD 文档编译为 JSON 数据
// 运行: node scripts/build-docs.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '../../docs');  // deep-dive/docs/
const outDir = join(__dirname, '../src/data/generated');

mkdirSync(outDir, { recursive: true });

// 新章节 ID → docs/ 下的文件名
const CHAPTER_FILES = {
  ch01: 'ch01-agent-loop.md',
  ch02: 'ch02-tool-system.md',
  ch03: 'ch03-prompt-engineering.md',
  ch04: 'ch04-bash-security.md',
  ch05: 'ch05-permissions.md',
  ch06: 'ch06-context-management.md',
  ch07: 'ch07-mcp-protocol.md',
  ch08: 'ch08-plugin-ecosystem.md',
  ch09: 'ch09-multi-agent.md',
  ch10: 'ch10-cli-transport.md',
  ch11: 'ch11-bootstrap.md',
  ch12: 'ch12-production-patterns.md',
};

const docs = [];

// 处理中文文档
for (const [version, filename] of Object.entries(CHAPTER_FILES)) {
  try {
    const content = readFileSync(join(docsDir, filename), 'utf-8');
    docs.push({ version, locale: 'zh', content });
  } catch (e) {
    console.warn(`Warning: docs/${filename} not found, skipping`);
  }
}

// 处理英文文档
for (const [version, filename] of Object.entries(CHAPTER_FILES)) {
  try {
    const content = readFileSync(join(docsDir, 'en', filename), 'utf-8');
    docs.push({ version, locale: 'en', content });
  } catch (e) {
    console.warn(`Warning: docs/en/${filename} not found, skipping`);
  }
}

writeFileSync(join(outDir, 'docs.json'), JSON.stringify(docs, null, 2));
console.log(`Built ${docs.length} docs (zh: ${docs.filter(d => d.locale === 'zh').length}, en: ${docs.filter(d => d.locale === 'en').length}) → src/data/generated/docs.json`);
