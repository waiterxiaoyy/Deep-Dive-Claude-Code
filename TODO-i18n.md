# Deep Dive Claude Code — 国际化(i18n)待办任务清单

> 生成时间：2026-04-01 09:05
> 当前状态：UI 框架层已完成中英切换，内容层尚未翻译

---

## 一、已完成的工作 ✅

### 1. i18n 基础框架
- [x] `src/lib/locale-context.tsx` — LocaleProvider + useLocale hook（独立文件）
- [x] `src/lib/i18n.ts` — 集中翻译字典（~450行），包含所有 UI 文案、章节标题、架构层标签等双语内容
- [x] `src/lib/constants.ts` — 默认值已改为英文（CHAPTER_META title/subtitle/motto + LAYERS label）

### 2. Header 语言切换
- [x] `src/components/layout/header.tsx` — 🌐 中/EN 切换按钮，从 i18n.ts 读取文案

### 3. 各页面 UI 文案双语化
- [x] `src/app/page.tsx` — 首页所有 section 标题、描述、按钮、卡片等
- [x] `src/app/architecture/page.tsx` — 架构页面包屑、标题、数据流图、统计标签
- [x] `src/app/timeline/page.tsx` — 时间线面包屑、标题、章节名
- [x] `src/app/chapter/[id]/chapter-page-client.tsx` — 章节页标题/副标题/格言/导航
- [x] `src/app/chapter/[id]/client.tsx` — Tab 标签、源码文件、演示提示
- [x] `src/components/layout/sidebar.tsx` — 侧边栏层标签和章节标题
- [x] `src/app/layout.tsx` — 引用新路径的 LocaleProvider

---

## 二、被回退/未完成的工作 ❌

### 任务 1：build-docs.mjs 双语构建支持
**状态**：已回退到单语言版本
**文件**：`web/scripts/build-docs.mjs`
**问题**：
- 缺少 `ch13` 的映射条目（只有 ch01-ch12）
- 只构建中文文档（`locale: 'zh'`），不支持双语
**需要做**：
- 添加 `ch13: 'ch13-hidden-features.md'` 映射
- 添加双语构建逻辑：读取 `docs/en/*.md` 生成 `locale: 'en'` 的条目
- 添加 `existsSync` 检查英文文件是否存在

### 任务 2：DocRenderer 双语选择
**状态**：已回退到单语言版本
**文件**：`web/src/components/docs/doc-renderer.tsx`
**问题**：
- 不导入 `useLocale`，不根据语言选择文档
- "该章节暂无文档" 硬编码中文
**需要做**：
- 导入 `useLocale` from `@/lib/locale-context`
- 根据 `locale` 优先匹配对应语言的文档，fallback 到中文
- 空状态文案双语化

### 任务 3：13 篇英文文档翻译
**状态**：`docs/en/` 目录已创建但为空
**文件**：需创建以下 13 个文件
```
docs/en/
├── ch01-agent-loop.md          # Query Engine — Heart of the Conversation Loop
├── ch02-tool-system.md         # Tool Architecture — Registry & Dispatch of 50+ Tools
├── ch03-prompt-engineering.md  # Prompt Engineering — Dynamic System Prompt Assembly
├── ch04-bash-security.md       # Shell Security — 300KB+ Security Validation Code
├── ch05-permissions.md         # File Operations & Permissions
├── ch06-context-management.md  # Context Management — Infinite Work in a Finite Window
├── ch07-mcp-protocol.md        # MCP Protocol — Unified Tool Calling Standard
├── ch08-plugin-ecosystem.md    # Plugin Ecosystem — Extensible Capability Boundary
├── ch09-multi-agent.md         # Multi-Agent — Agent/Team/Swarm
├── ch10-cli-transport.md       # CLI Transport — From Terminal to Remote
├── ch11-bootstrap.md           # Bootstrap — From Enter to Prompt
├── ch12-production-patterns.md # Production Patterns — From Demo to Production
└── ch13-hidden-features.md     # Hidden Features & Feature Flag System
```
**要求**：
- 标准准确的技术英文翻译
- 代码块保持不变（TypeScript/Python 代码不翻译）
- ASCII 架构图中的标签翻译
- 表格内容翻译
- 保持 Markdown 格式一致

### 任务 4：13 个场景数据 JSON 双语化
**状态**：未开始
**文件**：`web/src/data/scenarios/ch01.json` ~ `ch13.json`
**问题**：所有场景步骤的 `content`、`annotation`、`title`、`description` 都是中文
**方案选择**（二选一）：
- **方案 A**：每个 JSON 中的文案改为 `{ zh: "...", en: "..." }` 对象，模拟器组件按 locale 读取
- **方案 B**：创建 `ch01.en.json` ~ `ch13.en.json` 英文版，模拟器按 locale 加载不同文件
**推荐**：方案 A 更简洁，但需改动模拟器组件的类型定义

### 任务 5：13 个可视化组件硬编码中文翻译
**状态**：未开始
**文件**：
```
web/src/components/visualizations/
├── ch01-bootstrap.tsx       # "扫描缺失导入"、"并行预取 ×4"、"快速路径"、"完整路径" 等
├── ch02-query-engine.tsx    # "用户输入"、"构建上下文"、"调用 API" 等
├── ch03-prompt-pipeline.tsx # "核心身份"、"工具使用规则"、"安全约束" 等
├── ch04-tool-system.tsx     # "注册中心"、"条件编译加载" 等
├── ch05-bash-security.tsx   # "安全分类"、"权限判定"、"只读验证" 等
├── ch06-permissions.tsx     # "权限规则引擎"、"路径验证" 等
├── ch07-context-compact.tsx # "微压缩"、"自动压缩"、"做梦整合" 等
├── ch08-mcp-protocol.tsx    # "工具发现"、"认证" 等
├── ch09-plugin-loader.tsx   # "插件验证"、"能力注入" 等
├── ch10-multi-agent.tsx     # "子代理"、"团队通信"、"任务看板" 等
├── ch11-transport.tsx       # "终端 REPL"、"传输层" 等
├── ch12-production.tsx      # "会话持久化"、"优雅关机" 等
└── ch13-hidden-features.tsx # "Feature Flag 编译流程" 等（已部分双语）
```
**方案**：每个组件导入 `useLocale`，将硬编码中文抽为 `const LABELS = { zh: {...}, en: {...} }` 字典

---

## 三、建议执行顺序

```
优先级  任务                          工作量    影响面
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P0     任务 1: build-docs.mjs 修复    小       构建前置
P0     任务 2: DocRenderer 双语       小       渲染前置
P1     任务 3: 13 篇英文文档          大       "深入"Tab 内容
P2     任务 4: 13 个场景 JSON         中       "模拟器"Tab 内容
P2     任务 5: 13 个可视化组件        中       "可视化"Tab 内容
```

**P0（基础设施）**必须先做，否则英文文档写了也无法显示。
**P1（文档翻译）**影响最大，是用户在"深入"Tab 看到的主要内容。
**P2（场景+可视化）**可以后续逐步完成。

---

## 四、额外注意事项

1. **build-docs.mjs 缺少 ch13**：回退后 ch13 的映射丢失了，需要补回
2. **docs/en/ 目录为空**：已创建但无文件
3. **中文文档在 docs/ 根目录**：保持不动，英文文档放 docs/en/
4. **代码注释不翻译**：TypeScript/Python 代码块中的注释保持原样（中文注释是教学的一部分）
5. **ASCII 图表**：图中的中文标签需要翻译（如 "构建 system prompt" → "Build system prompt"）
