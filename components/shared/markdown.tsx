"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function renderInline(text: string, key: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|#[a-zA-Z0-9_-]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={`${key}-t${index++}`}>{text.slice(lastIndex, match.index)}</React.Fragment>);
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={`${key}-b${index++}`} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={`${key}-c${index++}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-primary-deep">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={`${key}-i${index++}`}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(<React.Fragment key={`${key}-r${index++}`}>{token}</React.Fragment>);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(<React.Fragment key={`${key}-l${index}`}>{text.slice(lastIndex)}</React.Fragment>);
  return parts;
}

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps): React.ReactElement {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre
          key={`md-${key++}`}
          className="my-3 overflow-x-auto rounded-xl border border-line bg-slate-50 p-4 font-mono text-[12px] leading-relaxed text-foreground"
        >
          <code data-language={lang}>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (trimmed.startsWith("###")) {
      blocks.push(
        <h3 key={`md-${key++}`} className="mb-2 mt-4 text-[15px] font-bold tracking-tight text-foreground">
          {renderInline(trimmed.replace(/^###\s*/, ""), `md${key}`)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("##")) {
      blocks.push(
        <h2 key={`md-${key++}`} className="mb-2 mt-5 text-base font-extrabold tracking-tight text-foreground">
          {renderInline(trimmed.replace(/^##\s*/, ""), `md${key}`)}
        </h2>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h1 key={`md-${key++}`} className="mb-3 mt-2 text-lg font-extrabold tracking-tight text-foreground">
          {renderInline(trimmed.replace(/^#\s*/, ""), `md${key}`)}
        </h1>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|") && index + 1 < lines.length && /^\|[\s\-|:]+\|$/.test(lines[index + 1].trim())) {
      const header = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(lines[index].trim().slice(1, -1).split("|").map((cell) => cell.trim()));
        index += 1;
      }
      blocks.push(
        <div key={`md-${key++}`} className="my-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-slate-50">
                {header.map((cell, i) => (
                  <th key={i} className="px-3 py-2 font-semibold text-slate-600">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-slate-700">{renderInline(cell, `md${key}-${i}-${j}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`md-${key++}`} className="my-2 space-y-1.5 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-slate-700">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <span>{renderInline(item, `md${key}-${i}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    blocks.push(
      <p key={`md-${key++}`} className="my-2 text-[13px] leading-relaxed text-slate-700">
        {renderInline(trimmed, `md${key}`)}
      </p>
    );
    index += 1;
  }

  return <div className={cn("prose-sm", className)}>{blocks}</div>;
}