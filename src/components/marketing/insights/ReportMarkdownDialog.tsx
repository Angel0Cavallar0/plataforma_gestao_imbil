"use client";

import { Fragment, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Negrito inline (**texto**) → <strong>, de forma segura (sem HTML cru). */
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

/** Renderizador de Markdown mínimo e seguro (títulos, listas, parágrafos). */
function renderMarkdown(md: string): ReactNode {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={key++} className="ml-5 list-disc space-y-1 text-sm">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1,6}\s/.test(line)) {
      flushList();
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s/, "");
      const cls =
        level <= 1
          ? "text-lg font-semibold"
          : level === 2
            ? "text-base font-semibold"
            : "text-sm font-semibold";
      blocks.push(
        <p key={key++} className={`${cls} mt-3`}>
          {renderInline(text)}
        </p>,
      );
    } else if (/^[-*]\s/.test(line)) {
      list.push(line.replace(/^[-*]\s/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={key++} className="text-sm text-foreground/90">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();
  return blocks;
}

/** "Ver relatório completo" — render do report_markdown num dialog (Seção 6.3). */
export function ReportMarkdownDialog({ markdown }: { markdown: string | null }) {
  if (!markdown) return null;
  return (
    <Dialog>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        <FileText className="h-4 w-4" />
        Ver relatório completo
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Relatório completo</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">{renderMarkdown(markdown)}</div>
      </DialogContent>
    </Dialog>
  );
}
