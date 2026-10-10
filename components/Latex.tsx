"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface LatexProps {
  formula: string;
  block?: boolean;
  className?: string;
}

export const Latex: React.FC<LatexProps> = ({ formula, block = false, className = "" }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: block,
        throwOnError: false,
      });
    } catch (e) {
      console.error("Erreur de rendu LaTeX:", e);
      return formula;
    }
  }, [formula, block]);

  if (block) {
    return (
      <div
        className={`my-3 py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto text-center font-medium ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block px-1 align-baseline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = "" }) => {
  const parts = useMemo(() => {
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const splitParts: { type: "text" | "inline" | "block"; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        splitParts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      const matchStr = match[0];
      if (matchStr.startsWith("$$") && matchStr.endsWith("$$")) {
        splitParts.push({
          type: "block",
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith("$") && matchStr.endsWith("$")) {
        splitParts.push({
          type: "inline",
          content: matchStr.slice(1, -1).trim(),
        });
      }

      lastIndex = match.index + matchStr.length;
    }

    if (lastIndex < text.length) {
      splitParts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return splitParts;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, idx) => {
        if (p.type === "text") return <React.Fragment key={idx}>{p.content}</React.Fragment>;
        if (p.type === "inline") return <Latex key={idx} formula={p.content} block={false} />;
        return <Latex key={idx} formula={p.content} block={true} />;
      })}
    </span>
  );
};
