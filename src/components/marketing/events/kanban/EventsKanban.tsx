"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_TRANSITIONS,
} from "@/lib/constants/marketing-events";
import {
  changeEventStatusAction,
  reorderKanbanAction,
} from "@/server/actions/marketing/events";
import { EventKanbanCard } from "./EventKanbanCard";
import type { EventKanbanCardData, EventStatus } from "@/types/marketing-events";

function SortableCard({ event }: { event: EventKanbanCardData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: event.id, data: { status: event.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <EventKanbanCard event={event} />
    </div>
  );
}

function KanbanColumn({
  status,
  events,
}: {
  status: EventStatus;
  events: EventKanbanCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold">{EVENT_STATUS_LABELS[status]}</h2>
        <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
          {events.length}
        </span>
      </div>
      <SortableContext
        items={events.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-32 flex-1 flex-col gap-2 p-2 transition-colors",
            isOver && "bg-accent/40",
          )}
        >
          {events.map((event) => (
            <SortableCard key={event.id} event={event} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function EventsKanban({ events: initial }: { events: EventKanbanCardData[] }) {
  const [events, setEvents] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = (status: EventStatus) =>
    events
      .filter((e) => e.status === status)
      .sort((a, b) => a.kanban_order - b.kanban_order);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
    document.body.dataset.kanbanDragging = "true";
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    // pequena folga para o onClick do card ler a flag antes de limpar
    setTimeout(() => delete document.body.dataset.kanbanDragging, 100);

    const { active, over } = e;
    if (!over) return;

    const event = events.find((ev) => ev.id === active.id);
    if (!event) return;

    // destino: coluna (droppable) ou outro card (sortable)
    const overEvent = events.find((ev) => ev.id === over.id);
    const targetStatus = (overEvent?.status ?? over.id) as EventStatus;

    if (targetStatus === event.status) {
      // reordenação dentro da coluna
      if (!overEvent || overEvent.id === event.id) return;
      const column = byStatus(targetStatus).filter((ev) => ev.id !== event.id);
      const overIndex = column.findIndex((ev) => ev.id === overEvent.id);
      column.splice(overIndex, 0, event);
      setEvents((prev) =>
        prev.map((ev) => {
          const idx = column.findIndex((c) => c.id === ev.id);
          return idx >= 0 ? { ...ev, kanban_order: idx } : ev;
        }),
      );
      const newOrder = column.findIndex((c) => c.id === event.id);
      const res = await reorderKanbanAction({
        id: event.id,
        status: targetStatus,
        new_order: newOrder,
      });
      if (res.error) toast.error(res.error);
      return;
    }

    if (!EVENT_STATUS_TRANSITIONS[event.status].includes(targetStatus)) {
      toast.error(
        `Transição inválida: "${EVENT_STATUS_LABELS[event.status]}" não pode ir para "${EVENT_STATUS_LABELS[targetStatus]}".`,
      );
      return;
    }

    const previous = events;
    setEvents((prev) =>
      prev.map((ev) => (ev.id === event.id ? { ...ev, status: targetStatus } : ev)),
    );
    const res = await changeEventStatusAction({ id: event.id, to_status: targetStatus });
    if (res.error) {
      setEvents(previous);
      toast.error(res.error);
    } else {
      toast.success(`Evento movido para "${EVENT_STATUS_LABELS[targetStatus]}".`);
    }
  }

  const activeEvent = events.find((ev) => ev.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {EVENT_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} events={byStatus(status)} />
        ))}
      </div>
      <DragOverlay>
        {activeEvent ? (
          <div className="w-72 rotate-2">
            <EventKanbanCard event={activeEvent} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
