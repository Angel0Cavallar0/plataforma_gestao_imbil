"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import { reschedulePostAction } from "@/server/actions/marketing/content";
import type { CalendarPostEvent } from "@/types/marketing";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  rascunho: "#9ca3af",
  agendado: "#1d4ed8",
  publicando: "#a855f7",
  publicado: "#22c55e",
  falhou: "#ef4444",
  cancelado: "#6b7280",
  instagram_publicado: "#166534",
};

function eventBackgroundColor(e: CalendarPostEvent): string {
  if (e.eventSource === "instagram_media") return statusColors.instagram_publicado;
  if (e.campaignColor) return e.campaignColor;
  return statusColors[e.status] ?? statusColors.rascunho;
}

function eventClassNames(e: CalendarPostEvent): string[] {
  const classes: string[] = [];
  if (e.eventSource === "instagram_media") classes.push("fc-event-instagram-published");
  else if (e.status === "agendado") classes.push("fc-event-agendado");
  else if (e.status === "publicado") classes.push("fc-event-publicado");
  return classes;
}

export function ContentCalendar({ events }: { events: CalendarPostEvent[] }) {
  const router = useRouter();
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">("dayGridMonth");
  const [, startTransition] = useTransition();

  const fcEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.eventSource === "instagram_media" ? `ig:${e.id}` : e.id,
        title:
          e.eventSource === "instagram_media"
            ? `IG: ${e.title}`
            : `${e.platformName}: ${e.title}`,
        start: e.start,
        backgroundColor: eventBackgroundColor(e),
        borderColor: "transparent",
        editable: e.eventSource === "content_post",
        extendedProps: e,
      })),
    [events],
  );

  const onEventClick = useCallback(
    (info: EventClickArg) => {
      const props = info.event.extendedProps as CalendarPostEvent;
      if (props.eventSource === "instagram_media") {
        router.push(
          `/modulos/marketing/calendario-conteudo/instagram/${encodeURIComponent(props.id)}`,
        );
        return;
      }
      router.push(`/modulos/marketing/calendario-conteudo/${info.event.id}`);
    },
    [router],
  );

  const onEventDrop = useCallback(
    (info: EventDropArg) => {
      const props = info.event.extendedProps as CalendarPostEvent;
      if (props.eventSource === "instagram_media") {
        info.revert();
        return;
      }
      const status = props.status as string;
      if (["publicando", "publicado", "falhou", "cancelado"].includes(status)) {
        info.revert();
        toast.error("Este post não pode ser reagendado");
        return;
      }
      const newDate = info.event.start;
      if (!newDate || newDate <= new Date()) {
        info.revert();
        toast.error("Selecione uma data futura");
        return;
      }
      startTransition(async () => {
        const res = await reschedulePostAction({
          id: info.event.id,
          scheduled_at: newDate,
        });
        if (res.error) {
          info.revert();
          toast.error(String(res.error));
        } else {
          toast.success("Post reagendado");
          router.refresh();
        }
      });
    },
    [router],
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-sm ${view === "dayGridMonth" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setView("dayGridMonth")}
        >
          Mês
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-sm ${view === "timeGridWeek" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setView("timeGridWeek")}
        >
          Semana
        </button>
      </div>
      <div className="rounded-lg border bg-card p-2">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          key={view}
          locale="pt-br"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          events={fcEvents}
          editable
          droppable={false}
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventClassNames={(arg) =>
            eventClassNames(arg.event.extendedProps as CalendarPostEvent)
          }
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
        />
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: statusColors.instagram_publicado }}
          />
          Publicado no Instagram (sincronizado)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: statusColors.agendado }}
          />
          Agendado
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: statusColors.publicado }}
          />
          Publicado pela plataforma
        </span>
      </div>
    </div>
  );
}
