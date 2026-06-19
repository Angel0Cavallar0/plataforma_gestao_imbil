"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, EventMountArg } from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import { reschedulePostAction } from "@/server/actions/marketing/content";
import type { CalendarPostEvent } from "@/types/marketing";
import type { SocialNetwork } from "@/types/marketing-insights";
import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";
import { friendlyContentType } from "@/lib/constants/marketing-insights";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  rascunho: "#9ca3af",
  agendado: "#1d4ed8",
  publicando: "#a855f7",
  publicado: "#22c55e",
  falhou: "#ef4444",
  cancelado: "#6b7280",
  instagram_publicado: "#166534",
  facebook_publicado: "#1e40af",
  linkedin_publicado: "#0a66c2",
};

function eventBackgroundColor(e: CalendarPostEvent): string {
  if (e.eventSource === "instagram_media") return statusColors.instagram_publicado;
  if (e.eventSource === "facebook_post") return statusColors.facebook_publicado;
  if (e.eventSource === "linkedin_post") return statusColors.linkedin_publicado;
  // Falha tem precedência sobre a cor da campanha: o erro precisa ficar visível.
  if (e.status === "falhou") return statusColors.falhou;
  if (e.campaignColor) return e.campaignColor;
  return statusColors[e.status] ?? statusColors.rascunho;
}

function eventStatusClass(e: CalendarPostEvent): string {
  if (e.eventSource === "instagram_media") return "fc-event-status-instagram";
  if (e.eventSource === "facebook_post") return "fc-event-status-facebook";
  if (e.eventSource === "linkedin_post") return "fc-event-status-linkedin";
  return `fc-event-status-${e.status}`;
}

function eventNetwork(e: CalendarPostEvent): SocialNetwork | null {
  if (e.eventSource === "instagram_media") return "instagram";
  if (e.eventSource === "facebook_post") return "facebook";
  if (e.eventSource === "linkedin_post") return "linkedin";
  const s = (e.platformSlug ?? "").toLowerCase();
  return s === "instagram" || s === "facebook" || s === "linkedin" ? s : null;
}

/** Tag curta do tipo de conteúdo (Reels, Story, Carrossel, Imagem, …). */
function eventTypeLabel(e: CalendarPostEvent): string | null {
  if (e.eventSource === "content_post") {
    return e.contentType ? (CONTENT_TYPE_LABELS[e.contentType] ?? null) : null;
  }
  const net = eventNetwork(e);
  if (!net) return null;
  return friendlyContentType(net, e.mediaType ?? null, e.mediaProductType ?? null);
}

function applyEventColors(el: HTMLElement, bg: string) {
  el.style.backgroundColor = bg;
  el.style.borderColor = bg;
  el.style.color = "#ffffff";
  el.querySelectorAll(".fc-event-main, .fc-event-title").forEach((node) => {
    (node as HTMLElement).style.color = "#ffffff";
  });
}

export function ContentCalendar({ events }: { events: CalendarPostEvent[] }) {
  const router = useRouter();
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">("dayGridMonth");
  const [, startTransition] = useTransition();

  const fcEvents = useMemo(
    () =>
      events.map((e) => {
        const bg = eventBackgroundColor(e);
        const syncedPrefix =
          e.eventSource === "instagram_media"
            ? "IG"
            : e.eventSource === "facebook_post"
              ? "FB"
              : e.eventSource === "linkedin_post"
                ? "LI"
                : null;
        return {
          id:
            e.eventSource === "instagram_media"
              ? `ig:${e.id}`
              : e.eventSource === "facebook_post"
                ? `fb:${e.id}`
                : e.eventSource === "linkedin_post"
                  ? `li:${e.id}`
                  : e.id,
          title: syncedPrefix
            ? `${syncedPrefix}: ${e.title}`
            : `${e.platformName}: ${e.title}`,
          start: e.start,
          backgroundColor: bg,
          borderColor: bg,
          textColor: "#ffffff",
          classNames: [eventStatusClass(e)],
          editable: e.eventSource === "content_post",
          extendedProps: e,
        };
      }),
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
      if (props.eventSource === "facebook_post") {
        router.push(
          `/modulos/marketing/calendario-conteudo/facebook/${encodeURIComponent(props.id)}`,
        );
        return;
      }
      if (props.eventSource === "linkedin_post") {
        router.push(
          `/modulos/marketing/calendario-conteudo/linkedin/${encodeURIComponent(props.id)}`,
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
      if (props.eventSource !== "content_post") {
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

  const onEventDidMount = useCallback((info: EventMountArg) => {
    const props = info.event.extendedProps as CalendarPostEvent;
    applyEventColors(info.el, eventBackgroundColor(props));
  }, []);

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
      <div className="content-calendar rounded-lg border bg-card p-2">
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
          eventDidMount={onEventDidMount}
          eventContent={(arg) => {
            const e = arg.event.extendedProps as CalendarPostEvent;
            const type = eventTypeLabel(e);
            return (
              <div className="flex w-full items-center gap-1 overflow-hidden px-0.5">
                {type ? (
                  <span className="shrink-0 rounded-sm bg-white/25 px-1 text-[10px] font-semibold uppercase leading-tight tracking-wide">
                    {type}
                  </span>
                ) : null}
                <span className="truncate text-[11px] leading-tight">
                  {arg.event.title}
                </span>
              </div>
            );
          }}
          height="auto"
          dayMaxEvents={false}
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
            style={{ backgroundColor: statusColors.facebook_publicado }}
          />
          Publicado no Facebook (sincronizado)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: statusColors.linkedin_publicado }}
          />
          Publicado no LinkedIn (sincronizado)
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
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: statusColors.falhou }}
          />
          Falhou
        </span>
      </div>
    </div>
  );
}
