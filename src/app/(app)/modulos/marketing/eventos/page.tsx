import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventsKanban } from "@/components/marketing/events/kanban/EventsKanban";
import { getEventsForKanban } from "@/server/queries/marketing/events";

export default async function EventosPage() {
  const events = await getEventsForKanban();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Eventos</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline de eventos corporativos e feiras — da negociação ao ROI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/modulos/marketing/eventos/formularios"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Formulários
          </Link>
          <Link
            href="/modulos/marketing/eventos/leads"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Leads
          </Link>
          <Link href="/modulos/marketing/eventos/novo" className={cn(buttonVariants())}>
            Novo evento
          </Link>
        </div>
      </div>

      <EventsKanban events={events} />
    </div>
  );
}
