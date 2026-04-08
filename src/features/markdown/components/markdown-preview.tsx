"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
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

  const html = useMemo(() => {
    if (!debouncedContent.trim()) return "";
    try {
      return String(processor.processSync(debouncedContent));
    } catch {
      return "<p>Error rendering markdown</p>";
    }
  }, [debouncedContent]);

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground/40 select-none print:hidden">
        Preview will appear here
      </div>
    );
  }

  return (
    <article
      className="md-preview prose prose-neutral dark:prose-invert max-w-none p-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
