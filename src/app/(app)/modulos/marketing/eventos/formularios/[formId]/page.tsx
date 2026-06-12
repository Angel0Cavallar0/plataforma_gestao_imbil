import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LeadFormBuilder } from "@/components/marketing/events/forms/LeadFormBuilder";
import { getEventsForSelect, getLeadFormById } from "@/server/queries/marketing/events";

export default async function EditarFormularioPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const [form, events] = await Promise.all([
    getLeadFormById(formId),
    getEventsForSelect(),
  ]);
  if (!form) notFound();

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
        <h1 className="text-2xl font-semibold">Editar formulário</h1>
        <p className="text-sm text-muted-foreground">{form.name}</p>
      </div>
      <LeadFormBuilder events={events} form={form} />
    </div>
  );
}
