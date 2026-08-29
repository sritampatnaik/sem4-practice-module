"use client";

import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeMathText } from "@/lib/math-text";

type MarkdownBodyProps = {
  text: string;
  className?: string;
  inline?: boolean;
  style?: CSSProperties;
};

function InlineTag({ children }: { children?: ReactNode }) {
  return <span>{children}</span>;
}

export function MarkdownBody({
  text,
  className,
  inline = false,
  style,
}: MarkdownBodyProps) {
  const wrapperClassName = ["markdown-body", inline ? "markdown-inline" : "", className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
      components={
        inline
          ? {
              p: InlineTag,
              ul: InlineTag,
              ol: InlineTag,
              li: InlineTag,
            }
          : undefined
      }
    >
      {normalizeMathText(text)}
    </ReactMarkdown>
  );

  if (inline) {
    return (
      <span className={wrapperClassName} style={style}>
        {content}
      </span>
    );
  }

  return (
    <div className={wrapperClassName} style={style}>
      {content}
    </div>
  );
}
