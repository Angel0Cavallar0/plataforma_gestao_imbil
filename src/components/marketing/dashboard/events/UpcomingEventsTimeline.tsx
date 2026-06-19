import { CalendarClock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EVENT_STATUS_LABELS, longDate } from "@/lib/marketing/dashboard";
import type { UpcomingEvent } from "@/types/marketing-dashboard";

function daysUntil(iso: string): number {
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - t.getTime()) / (24 * 60 * 60 * 1000));
}

/** Linha do tempo dos próximos eventos com countdown. */
export function UpcomingEventsTimeline({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Próximos eventos e datas</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum evento agendado.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l pl-4">
            {events.map((e) => {
              const days = daysUntil(e.starts_on);
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.32rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium leading-tight">
                        {e.name}
                        {e.edition ? (
                          <span className="text-muted-foreground"> · {e.edition}</span>
                        ) : null}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {longDate(e.starts_on)}
                        </span>
                        {e.city ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {e.city}
                            {e.state ? `/${e.state}` : ""}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="secondary">
                        {days === 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`}
                      </Badge>
                      <span className="text-[0.7rem] text-muted-foreground">
                        {EVENT_STATUS_LABELS[e.status] ?? e.status}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
