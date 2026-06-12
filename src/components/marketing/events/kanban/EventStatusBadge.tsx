import { Badge } from "@/components/ui/badge";
import { EVENT_STATUS_LABELS } from "@/lib/constants/marketing-events";
import type { EventStatus } from "@/types/marketing-events";

const VARIANTS: Record<
  EventStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"
> = {
  negociacao: "warning",
  confirmado: "default",
  em_preparacao: "secondary",
  realizado: "success",
  cancelado: "destructive",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge variant={VARIANTS[status]}>{EVENT_STATUS_LABELS[status]}</Badge>;
}
