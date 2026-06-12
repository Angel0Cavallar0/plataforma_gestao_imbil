import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadsTable } from "@/components/marketing/events/leads/LeadsTable";
import { LeadManualForm } from "@/components/marketing/events/leads/LeadManualForm";
import { LeadExportDialog } from "@/components/marketing/events/leads/LeadExportDialog";
import {
  LEAD_QUALIFICATIONS,
  LEAD_QUALIFICATION_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
} from "@/lib/constants/marketing-events";
import {
  getEventsForSelect,
  getLeadForms,
  getLeadKpis,
  getLeads,
} from "@/server/queries/marketing/events";
import type { LeadFilters } from "@/types/marketing-events";

const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: LeadFilters = {
    event: sp.event || undefined,
    form: sp.form || undefined,
    qualification: sp.qualification || undefined,
    source: sp.source || undefined,
    consent: sp.consent || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    q: sp.q || undefined,
  };

  const [leads, kpis, events, forms] = await Promise.all([
    getLeads(filters),
    getLeadKpis(filters),
    getEventsForSelect(),
    filters.event ? getLeadForms({ eventId: filters.event }) : Promise.resolve([]),
  ]);

  const selectedEvent = events.find((e) => e.id === filters.event);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Leads{selectedEvent ? ` — ${selectedEvent.name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Leads capturados em eventos — qualificação e passagem de bastão para o
            comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LeadExportDialog filters={filters} />
          <LeadManualForm events={events} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualificados (quente + morno)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.qualified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de consentimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.consentRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Encaminhados ao comercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.forwarded}</p>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <select name="event" defaultValue={filters.event ?? ""} className={selectClass}>
          <option value="">Todos os eventos</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
              {ev.edition ? ` · ${ev.edition}` : ""}
            </option>
          ))}
        </select>
        {filters.event && (
          <select name="form" defaultValue={filters.form ?? ""} className={selectClass}>
            <option value="">Todos os formulários</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
        <select
          name="qualification"
          defaultValue={filters.qualification ?? ""}
          className={selectClass}
        >
          <option value="">Qualificação</option>
          {LEAD_QUALIFICATIONS.map((q) => (
            <option key={q} value={q}>
              {LEAD_QUALIFICATION_LABELS[q]}
            </option>
          ))}
        </select>
        <select name="source" defaultValue={filters.source ?? ""} className={selectClass}>
          <option value="">Origem</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {LEAD_SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="consent"
          defaultValue={filters.consent ?? ""}
          className={selectClass}
        >
          <option value="">Consentimento</option>
          <option value="sim">Com consentimento</option>
          <option value="nao">Sem consentimento</option>
        </select>
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ""}
          className={selectClass}
          aria-label="De"
        />
        <input
          type="date"
          name="to"
          defaultValue={filters.to ?? ""}
          className={selectClass}
          aria-label="Até"
        />
        <input
          type="search"
          name="q"
          placeholder="Nome, empresa, e-mail..."
          defaultValue={filters.q ?? ""}
          className={cn(selectClass, "w-52")}
        />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
        >
          Filtrar
        </button>
      </form>

      <LeadsTable leads={leads} />
    </div>
  );
}
