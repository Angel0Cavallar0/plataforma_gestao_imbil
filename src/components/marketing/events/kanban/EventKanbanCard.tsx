"use client";

import Link from "next/link";
import { CalendarDays, FileText, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventKanbanCardData } from "@/types/marketing-events";

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr + "T00:00:00").getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function EventKanbanCard({ event }: { event: EventKanbanCardData }) {
  const days = daysUntil(event.starts_on);
  const planned = event.investment_planned;
  const actual = event.investment_actual ?? event.costs_total;
  const progress =
    planned && planned > 0
      ? Math.min(100, Math.round(((actual ?? 0) / planned) * 100))
      : null;

  return (
    <Link
      href={`/modulos/marketing/eventos/${event.id}`}
      className="block rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={(e) => {
        // evita navegar ao soltar um drag
        if (document.body.dataset.kanbanDragging === "true") e.preventDefault();
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">
          {event.name}
          {event.edition && (
            <span className="text-muted-foreground"> · {event.edition}</span>
          )}
        </p>
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {event.starts_on && (
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {new Date(event.starts_on + "T00:00:00").toLocaleDateString("pt-BR")}
            {days !== null && days >= 0 && days <= 30 && (
              <Badge variant="warning" className="ml-1 px-1.5 py-0">
                {days === 0 ? "hoje" : `em ${days}d`}
              </Badge>
            )}
          </p>
        )}
        {(event.city || event.state) && (
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[event.city, event.state].filter(Boolean).join("/")}
          </p>
        )}
      </div>

      {planned !== null && planned !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{formatBRL(actual ?? 0)}</span>
            <span>{formatBRL(planned)}</span>
          </div>
          {progress !== null && (
            <div className="mt-0.5 h-1.5 rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full ${progress >= 100 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {event.leads_count}
        </span>
        {event.active_forms_count > 0 && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <FileText className="h-3.5 w-3.5" />
            {event.active_forms_count} form{event.active_forms_count > 1 ? "s" : ""} ativo
            {event.active_forms_count > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
