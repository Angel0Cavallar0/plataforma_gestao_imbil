import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LeadFormsTable } from "@/components/marketing/events/forms/LeadFormsTable";
import { leadFormStatus } from "@/lib/marketing/lead-form-status";
import { getEventsForSelect, getLeadForms } from "@/server/queries/marketing/events";

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; status?: string }>;
}) {
  const { event, status } = await searchParams;
  const [forms, events] = await Promise.all([
    getLeadForms({ eventId: event }),
    getEventsForSelect(),
  ]);

  const filtered = forms.filter((f) => !status || leadFormStatus(f) === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Formulários de captura</h1>
          <p className="text-sm text-muted-foreground">
            Criação, edição e publicação de formulários de captura de leads em eventos.
          </p>
        </div>
        <Link
          href="/modulos/marketing/eventos/formularios/novo"
          className={cn(buttonVariants())}
        >
          Novo formulário
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <select
          name="event"
          defaultValue={event ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os eventos</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
              {ev.edition ? ` · ${ev.edition}` : ""}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="expirado">Expirado</option>
        </select>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
        >
          Filtrar
        </button>
      </form>

      <LeadFormsTable forms={filtered} />
    </div>
  );
}
