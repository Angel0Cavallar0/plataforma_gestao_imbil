"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/marketing/insights/mentions/StarRating";
import { MentionDialog } from "@/components/marketing/insights/mentions/MentionDialog";
import {
  mentionPlatformColor,
  mentionPlatformLabel,
} from "@/lib/constants/marketing-insights";
import { truncate } from "@/lib/marketing/insights";
import type { BrandMention } from "@/types/marketing-insights";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Card resumido de uma menção; clique abre o pop-up com os dados completos. */
export function MentionCard({
  mention,
  onToggleResponded,
  pending,
}: {
  mention: BrandMention;
  onToggleResponded: (id: string, next: boolean) => void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const color = mentionPlatformColor(mention.plataforma);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label="Ver menção completa"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="space-y-2 p-3">
          <div className="flex items-start gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {initials(mention.autor_nome)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="truncate text-sm font-medium">
                  {mention.autor_nome ?? "Autor desconhecido"}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  {mentionPlatformLabel(mention.plataforma)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {fmtDate(mention.data_publicacao)}
              </p>
            </div>
            <span
              className={
                mention.respondida
                  ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400"
                  : "inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
              }
            >
              {mention.respondida ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {mention.respondida ? "Respondido" : "Pendente"}
            </span>
          </div>

          {mention.rating != null && <StarRating rating={mention.rating} />}

          {mention.texto && (
            <p className="line-clamp-2 text-xs text-foreground/80">
              {truncate(mention.texto, 160)}
            </p>
          )}
        </CardContent>
      </Card>

      <MentionDialog
        mention={mention}
        open={open}
        onOpenChange={setOpen}
        onToggleResponded={onToggleResponded}
        pending={pending}
      />
    </>
  );
}
