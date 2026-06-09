"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { rehypeMermaid } from "./rehype-mermaid";
import { renderMermaid, type MermaidTheme } from "@/lib/mermaid";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeMermaid)
  .use(rehypeKatex)
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify);

interface MarkdownPreviewProps {
  content: string;
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);

  return debounced;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const debouncedContent = useDebouncedValue(content, 150);
  const { resolvedTheme } = useTheme();
  const articleRef = useRef<HTMLElement | null>(null);

  const html = useMemo(() => {
    if (!debouncedContent.trim()) return "";
    try {
      return String(processor.processSync(debouncedContent));
    } catch {
      return "<p>Error rendering markdown</p>";
    }
  }, [debouncedContent]);

  // After the HTML mounts, render any mermaid placeholders into SVGs.
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const blocks = article.querySelectorAll<HTMLElement>("[data-mermaid-src]");
    if (blocks.length === 0) return;

    let cancelled = false;
    const theme: MermaidTheme = resolvedTheme === "dark" ? "dark" : "default";

    (async () => {
      for (const block of Array.from(blocks)) {
        const source = block.getAttribute("data-mermaid-src");
        if (!source) continue;

        // Skip if this node already holds the right diagram for this theme.
        const stamp = `${theme}:${source}`;
        if (block.dataset.mermaidStamp === stamp) continue;

        const result = await renderMermaid(source, theme);
        if (cancelled) return;

        if ("svg" in result) {
          block.innerHTML = result.svg;
          block.classList.remove("md-mermaid-error");
        } else {
          // Build the error box with the DOM API so the source can't inject HTML.
          const box = document.createElement("div");
          const msg = document.createElement("p");
          msg.textContent = result.error;
          const pre = document.createElement("pre");
          const code = document.createElement("code");
          code.textContent = source;
          pre.appendChild(code);
          box.appendChild(msg);
          box.appendChild(pre);
          block.replaceChildren(box);
          block.classList.add("md-mermaid-error");
        }
        block.dataset.mermaidStamp = stamp;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, resolvedTheme]);

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground/40 select-none print:hidden">
        Preview will appear here
      </div>
    );
  }

  return (
    <article
      ref={articleRef}
      className="md-preview prose prose-neutral dark:prose-invert max-w-none p-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
