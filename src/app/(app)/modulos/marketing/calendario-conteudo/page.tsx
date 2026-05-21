import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContentCalendar } from "@/components/marketing/calendar/ContentCalendar";
import { ContentKpiCards } from "@/components/marketing/calendar/ContentKpiCards";
import { getContentKpis } from "@/server/queries/marketing/content";
import { getCalendarEvents } from "@/server/queries/marketing/calendar";

export default async function CalendarioConteudoPage() {
  const [kpis, events] = await Promise.all([getContentKpis(), getCalendarEvents()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calendário de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">
            Planeje, agende e publique com legenda nas redes sociais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/modulos/marketing/calendario-conteudo/lista"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Lista
          </Link>
          <Link
            href="/modulos/marketing/calendario-conteudo/campanhas"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Campanhas
          </Link>
          <Link
            href="/modulos/marketing/calendario-conteudo/novo"
            className={cn(buttonVariants())}
          >
            Novo post
          </Link>
        </div>
      </div>

      <ContentKpiCards kpis={kpis} />
      <ContentCalendar events={events} />
    </div>
  );
}
