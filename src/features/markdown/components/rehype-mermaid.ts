// Custom rehype plugin. Must run BEFORE rehype-highlight so the mermaid source
// is lifted out of the code block before highlight tokenizes (and corrupts) it.
// Each `<pre><code class="language-mermaid">` becomes a `<div data-mermaid-src>`
// placeholder that MarkdownPreview renders into after mount.

// Minimal local HAST shape (avoids depending on @types/hast).
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function transform(node: HastNode): void {
  const children = node.children;
  if (!children) return;

  for (const child of children) {
    if (child.type === "element" && child.tagName === "pre" && child.children) {
      const code = child.children.find(
        (c) => c.type === "element" && c.tagName === "code",
      );
      const className = code?.properties?.className;
      const isMermaid =
        Array.isArray(className) && className.includes("language-mermaid");

      if (code && isMermaid) {
        const source = (code.children ?? [])
          .map((c) => (c.type === "text" ? (c.value ?? "") : ""))
          .join("");

        // Mutate the <pre> in place into the placeholder <div>.
        // `dataMermaidSrc` serializes to the `data-mermaid-src` attribute.
        child.tagName = "div";
        child.properties = { dataMermaidSrc: source };
        child.children = [];
        continue;
      }
    }
    transform(child);
  }
}

export function rehypeMermaid() {
  return (tree: unknown) => {
    transform(tree as HastNode);
  };
}
