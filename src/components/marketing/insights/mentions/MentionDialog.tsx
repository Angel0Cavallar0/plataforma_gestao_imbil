"use client";

import { CheckCircle2, Clock, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/marketing/insights/mentions/StarRating";
import {
  mentionPlatformColor,
  mentionPlatformLabel,
} from "@/lib/constants/marketing-insights";
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

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Pop-up com os dados completos de uma menção + marcação de respondido. */
export function MentionDialog({
  mention,
  open,
  onOpenChange,
  onToggleResponded,
  pending,
}: {
  mention: BrandMention;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleResponded: (id: string, next: boolean) => void;
  pending?: boolean;
}) {
  const color = mentionPlatformColor(mention.plataforma);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {initials(mention.autor_nome)}
            </span>
            <span className="min-w-0 truncate">
              {mention.autor_nome ?? "Autor desconhecido"}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {mentionPlatformLabel(mention.plataforma)}
            </span>
          </DialogTitle>
          <DialogDescription>{fmtDateTime(mention.data_publicacao)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {mention.rating != null && <StarRating rating={mention.rating} />}

          {mention.texto ? (
            <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90">
              {mention.texto}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">Sem texto.</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            {mention.url ? (
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver original <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span />
            )}

            <Button
              type="button"
              variant={mention.respondida ? "outline" : "default"}
              disabled={pending}
              onClick={() => onToggleResponded(mention.id, !mention.respondida)}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mention.respondida ? (
                <Clock className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {mention.respondida ? "Marcar como pendente" : "Marcar como respondido"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
