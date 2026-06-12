import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventStatusBadge } from "@/components/marketing/events/kanban/EventStatusBadge";
import { EventForm } from "@/components/marketing/events/event/EventForm";
import { EventCostsSection } from "@/components/marketing/events/event/EventCostsSection";
import { EventTimeline } from "@/components/marketing/events/event/EventTimeline";
import { LeadFormsTable } from "@/components/marketing/events/forms/LeadFormsTable";
import { EVENT_TYPE_LABELS } from "@/lib/constants/marketing-events";
import {
  getEventById,
  getEventCosts,
  getEventStatusHistory,
  getLeadForms,
} from "@/server/queries/marketing/events";

const TABS = [
  { key: "resumo", label: "Resumo" },
  { key: "custos", label: "Custos" },
  { key: "formularios", label: "Formulários" },
  { key: "editar", label: "Editar" },
] as const;

export default async function EventoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventId } = await params;
  const { tab = "resumo" } = await searchParams;

  const event = await getEventById(eventId);
  if (!event) notFound();

  const [costs, history, forms] = await Promise.all([
    tab === "custos" || tab === "resumo" ? getEventCosts(eventId) : Promise.resolve([]),
    tab === "resumo" ? getEventStatusHistory(eventId) : Promise.resolve([]),
    tab === "formularios" ? getLeadForms({ eventId }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {event.name}
              {event.edition && (
                <span className="text-muted-foreground"> · {event.edition}</span>
              )}
            </h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {EVENT_TYPE_LABELS[event.event_type]}
            {event.city && ` · ${[event.city, event.state].filter(Boolean).join("/")}`}
            {event.starts_on &&
              ` · ${new Date(event.starts_on + "T00:00:00").toLocaleDateString("pt-BR")}`}
            {event.ends_on &&
              ` — ${new Date(event.ends_on + "T00:00:00").toLocaleDateString("pt-BR")}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/modulos/marketing/eventos/leads?event=${event.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Leads do evento
          </Link>
          <Link
            href="/modulos/marketing/eventos"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            ← Kanban
          </Link>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/modulos/marketing/eventos/${event.id}?tab=${t.key}`}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "resumo" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {event.objective && (
              <section>
                <h2 className="mb-1 text-sm font-semibold">Objetivo</h2>
                <p className="text-sm text-muted-foreground">{event.objective}</p>
              </section>
            )}
            {event.description && (
              <section>
                <h2 className="mb-1 text-sm font-semibold">Descrição</h2>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </section>
            )}
            <section className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Investimento planejado</p>
                <p className="font-medium">
                  {event.investment_planned !== null
                    ? Number(event.investment_planned).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Investimento realizado</p>
                <p className="font-medium">
                  {event.investment_actual !== null
                    ? Number(event.investment_actual).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : costs.length
                      ? costs
                          .reduce((s, c) => s + Number(c.amount), 0)
                          .toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }) + " (custos)"
                      : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor estimado por lead</p>
                <p className="font-medium">
                  {event.estimated_value_per_lead !== null
                    ? Number(event.estimated_value_per_lead).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Local</p>
                <p className="font-medium">{event.venue ?? "—"}</p>
              </div>
            </section>
            {event.notes && (
              <section>
                <h2 className="mb-1 text-sm font-semibold">Observações</h2>
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </section>
            )}
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">Timeline de status</h2>
            <EventTimeline entries={history} />
          </div>
        </div>
      )}

      {tab === "custos" && (
        <EventCostsSection
          eventId={event.id}
          costs={costs}
          investmentPlanned={event.investment_planned}
        />
      )}

      {tab === "formularios" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`/modulos/marketing/eventos/formularios/novo?event=${event.id}`}
              className={cn(buttonVariants())}
            >
              Novo formulário
            </Link>
          </div>
          <LeadFormsTable forms={forms} />
        </div>
      )}

      {tab === "editar" && <EventForm event={event} />}
    </div>
  );
}
