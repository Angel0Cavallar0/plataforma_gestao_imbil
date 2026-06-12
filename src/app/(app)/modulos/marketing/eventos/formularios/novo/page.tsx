import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
        <Link
          href="/modulos/marketing/eventos/formularios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Formulários
        </Link>
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
