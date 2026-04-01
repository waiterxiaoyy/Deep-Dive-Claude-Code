"use client";

import { useMemo } from "react";
import docsData from "@/data/generated/docs.json";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { useLocale } from "@/lib/locale-context";
import { UI_TEXT } from "@/lib/i18n";

interface DocRendererProps {
  version: string;
}

function renderMarkdown(md: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeStringify)
    .processSync(md);
  return String(result);
}

function postProcessHtml(html: string): string {
  // 给高亮代码块添加语言标签
  html = html.replace(
    /<pre><code class="hljs language-(\w+)">/g,
    '<pre class="code-block" data-language="$1"><code class="hljs language-$1">'
  );

  // ASCII 图表容器
  html = html.replace(
    /<pre><code(?! class="hljs)([^>]*)>/g,
    '<pre class="ascii-diagram"><code$1>'
  );

  // 第一个 blockquote 作为格言高亮
  html = html.replace(
    /<blockquote>/,
    '<blockquote class="hero-callout">'
  );

  // 去掉 h1（页面头已有标题）
  html = html.replace(/<h1>.*?<\/h1>\n?/, "");

  // 去掉章节导航条（形如 `Ch01 > [ Ch02 ] Ch03 ...`），Web 有侧边栏导航
  html = html.replace(/<p><code>.*?Ch\d+.*?\[.*?Ch\d+.*?\].*?<\/code><\/p>\n?/g, "");

  return html;
}

export function DocRenderer({ version }: DocRendererProps) {
  const { locale } = useLocale();
  const t = UI_TEXT[locale];
  
  const doc = useMemo(() => {
    return (docsData as { version: string; locale: string; content: string }[]).find(
      (d) => d.version === version && d.locale === locale
    );
  }, [version, locale]);

  const html = useMemo(() => {
    if (!doc) return "";
    const raw = renderMarkdown(doc.content);
    return postProcessHtml(raw);
  }, [doc]);

  if (!doc) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        {t.chapter_code_wip}
      </div>
    );
  }

  return (
    <div className="py-4">
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
