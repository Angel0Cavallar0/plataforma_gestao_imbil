import { LeadFormBuilder } from "@/components/marketing/events/forms/LeadFormBuilder";
import { getEventsForSelect } from "@/server/queries/marketing/events";

export default async function NovoFormularioPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const events = await getEventsForSelect();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo formulário</h1>
        <p className="text-sm text-muted-foreground">
          Builder de formulário público de captura de leads — link expirável e QR Code
          automáticos.
        </p>
      </div>
      <LeadFormBuilder events={events} defaultEventId={event} />
    </div>
  );
}
