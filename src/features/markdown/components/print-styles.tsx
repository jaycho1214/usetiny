"use client";

import { memo } from "react";
import type { ExportSettings, PageSize, Margins } from "../store";

interface PrintStylesProps {
  settings: ExportSettings;
}

const pageSizeMap: Record<PageSize, string> = {
  a4: "210mm 297mm",
  letter: "8.5in 11in",
  legal: "8.5in 14in",
};

const marginMap: Record<Margins, string> = {
  narrow: "1.27cm",
  normal: "2.54cm",
  wide: "3.81cm",
};

export const PrintStyles = memo(function PrintStyles({ settings }: PrintStylesProps) {
  const size = pageSizeMap[settings.pageSize];
  const orientation = settings.orientation;
  const margin = marginMap[settings.margins];
  const marginBottom = settings.pageNumbers ? "2cm" : margin;

  const css = `
@media print {
  @page {
    size: ${size} ${orientation};
    margin: ${margin};
    margin-bottom: ${marginBottom};
  }

  /* Reset layout containers for print flow */
  html, body {
    height: auto !important;
    overflow: visible !important;
  }

  .md-print-root {
    height: auto !important;
    display: block !important;
    overflow: visible !important;
  }

  .md-print-main {
    height: auto !important;
    display: block !important;
    overflow: visible !important;
  }

  .md-print-preview-pane {
    height: auto !important;
    display: block !important;
    overflow: visible !important;
  }

  /* ===================== */
  /*   Beautiful PDF Base  */
  /* ===================== */

  .md-preview {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: none !important;
    color: #1a1a1a !important;
    font-family: "Georgia", "Times New Roman", "Noto Serif", serif !important;
    font-size: 11pt !important;
    line-height: 1.7 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Headings — clean hierarchy */
  .md-preview h1 {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 24pt !important;
    font-weight: 700 !important;
    letter-spacing: -0.02em !important;
    margin-top: 0 !important;
    margin-bottom: 8pt !important;
    padding-bottom: 6pt !important;
    border-bottom: 1.5pt solid #e5e5e5 !important;
    color: #0a0a0a !important;
    line-height: 1.2 !important;
  }

  .md-preview h2 {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 17pt !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
    margin-top: 24pt !important;
    margin-bottom: 6pt !important;
    color: #1a1a1a !important;
    line-height: 1.3 !important;
  }

  .md-preview h3 {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 13pt !important;
    font-weight: 600 !important;
    margin-top: 18pt !important;
    margin-bottom: 4pt !important;
    color: #1a1a1a !important;
    line-height: 1.4 !important;
  }

  .md-preview h4,
  .md-preview h5,
  .md-preview h6 {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 11pt !important;
    font-weight: 600 !important;
    margin-top: 14pt !important;
    margin-bottom: 4pt !important;
    color: #333 !important;
    line-height: 1.4 !important;
  }

  /* Paragraphs */
  .md-preview p {
    margin-top: 0 !important;
    margin-bottom: 8pt !important;
    orphans: 3 !important;
    widows: 3 !important;
  }

  /* Links — subtle in print */
  .md-preview a {
    color: #1a1a1a !important;
    text-decoration: underline !important;
    text-underline-offset: 2pt !important;
  }

  /* Strong and emphasis */
  .md-preview strong {
    font-weight: 700 !important;
    color: #0a0a0a !important;
  }

  .md-preview em {
    font-style: italic !important;
  }

  /* Code — inline */
  .md-preview code:not(pre code) {
    font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Courier New", monospace !important;
    font-size: 9.5pt !important;
    background: #f5f5f5 !important;
    border: 0.5pt solid #e5e5e5 !important;
    border-radius: 2pt !important;
    padding: 1pt 3pt !important;
    color: #1a1a1a !important;
  }

  /* Code blocks */
  .md-preview pre {
    font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "Courier New", monospace !important;
    font-size: 9pt !important;
    line-height: 1.55 !important;
    background: #fafafa !important;
    border: 0.75pt solid #e5e5e5 !important;
    border-radius: 4pt !important;
    padding: 12pt 14pt !important;
    margin-top: 8pt !important;
    margin-bottom: 12pt !important;
    overflow-x: visible !important;
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .md-preview pre code {
    font-size: inherit !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    color: #1a1a1a !important;
  }

  /* Syntax highlighting — subtle grayscale for print */
  .md-preview .hljs-keyword,
  .md-preview .hljs-selector-tag,
  .md-preview .hljs-built_in { color: #333 !important; font-weight: 600 !important; }
  .md-preview .hljs-string,
  .md-preview .hljs-attr { color: #555 !important; }
  .md-preview .hljs-comment,
  .md-preview .hljs-doctag { color: #888 !important; font-style: italic !important; }
  .md-preview .hljs-number,
  .md-preview .hljs-literal { color: #444 !important; }
  .md-preview .hljs-title,
  .md-preview .hljs-section { color: #222 !important; font-weight: 600 !important; }
  .md-preview .hljs-type,
  .md-preview .hljs-class { color: #333 !important; }

  /* Blockquotes — elegant left border */
  .md-preview blockquote {
    margin: 8pt 0 12pt 0 !important;
    padding: 6pt 0 6pt 14pt !important;
    border-left: 2.5pt solid #d4d4d4 !important;
    color: #555 !important;
    font-style: italic !important;
    background: none !important;
  }

  .md-preview blockquote p {
    margin-bottom: 4pt !important;
  }

  /* Lists */
  .md-preview ul,
  .md-preview ol {
    margin-top: 4pt !important;
    margin-bottom: 8pt !important;
    padding-left: 20pt !important;
  }

  .md-preview li {
    margin-bottom: 3pt !important;
  }

  .md-preview li > ul,
  .md-preview li > ol {
    margin-top: 2pt !important;
    margin-bottom: 2pt !important;
  }

  /* Task lists */
  .md-preview input[type="checkbox"] {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin-right: 6pt !important;
  }

  /* Tables — clean lines */
  .md-preview table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-top: 8pt !important;
    margin-bottom: 12pt !important;
    font-size: 10pt !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .md-preview thead {
    border-bottom: 1.5pt solid #333 !important;
  }

  .md-preview th {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-weight: 600 !important;
    text-align: left !important;
    padding: 6pt 10pt !important;
    color: #0a0a0a !important;
    font-size: 9.5pt !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
  }

  .md-preview td {
    padding: 5pt 10pt !important;
    border-bottom: 0.5pt solid #e5e5e5 !important;
    color: #333 !important;
  }

  .md-preview tbody tr:last-child td {
    border-bottom: 1pt solid #ccc !important;
  }

  /* Horizontal rule */
  .md-preview hr {
    border: none !important;
    border-top: 1pt solid #e5e5e5 !important;
    margin: 18pt 0 !important;
  }

  /* Images */
  .md-preview img {
    max-width: 100% !important;
    height: auto !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Page break control */
  .md-preview h1,
  .md-preview h2,
  .md-preview h3 {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }

  /* Math (KaTeX) — beautiful print rendering */
  .md-preview .katex {
    font-size: 1.05em !important;
    color: #1a1a1a !important;
  }

  .md-preview .katex-display {
    margin: 12pt 0 16pt !important;
    overflow-x: visible !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .md-preview .katex-display > .katex {
    font-size: 1.1em !important;
  }

  .md-preview .katex .mord,
  .md-preview .katex .mbin,
  .md-preview .katex .mrel,
  .md-preview .katex .mopen,
  .md-preview .katex .mclose,
  .md-preview .katex .mpunct,
  .md-preview .katex .minner {
    color: #1a1a1a !important;
  }

  /* Page numbers */
  ${
    settings.pageNumbers
      ? `.md-page-footer {
    display: block !important;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-family: system-ui, -apple-system, sans-serif !important;
    font-size: 8.5pt !important;
    color: #999 !important;
    padding-bottom: 0.5cm;
  }`
      : `.md-page-footer { display: none !important; }`
  }

  /* Header/Footer */
  ${
    settings.headerFooter
      ? `.md-page-header {
    display: block !important;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    text-align: left;
    font-family: system-ui, -apple-system, sans-serif !important;
    font-size: 8pt !important;
    color: #bbb !important;
    padding-top: 0.3cm;
    border-bottom: 0.5pt solid #eee !important;
    padding-bottom: 4pt;
  }`
      : `.md-page-header { display: none !important; }`
  }
}

/* Screen-only: hide print helpers */
@media screen {
  .md-page-footer,
  .md-page-header {
    display: none !important;
  }
}
`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
});
