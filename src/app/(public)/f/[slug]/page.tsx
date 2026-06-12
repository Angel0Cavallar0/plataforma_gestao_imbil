import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeadFormOpen } from "@/lib/marketing/lead-form-status";
import { PublicLeadForm } from "@/components/marketing/events/public/PublicLeadForm";
import type {
  CustomField,
  PublicLeadFormData,
  StandardFieldKey,
} from "@/types/marketing-events";

export const dynamic = "force-dynamic";

function ClosedForm() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <Image
        src="/imbil-logo.svg"
        alt="Imbil"
        width={130}
        height={40}
        className="mb-6 h-10 w-auto"
      />
      <h1 className="text-xl font-semibold text-slate-900">Formulário encerrado</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Este formulário não está mais disponível. Se você acredita que isso é um engano,
        procure a equipe da Imbil no evento.
      </p>
    </div>
  );
}

export default async function PublicLeadFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t: token } = await searchParams;

  if (!token || !/^[a-z0-9-]+$/.test(slug)) return <ClosedForm />;

  // Validação server-side (service_role apenas aqui — nada de anon key no client)
  const admin = createAdminClient();
  const { data: form } = await admin
    .schema("marketing")
    .from("lead_forms")
    .select(
      "id, name, description, custom_fields, standard_fields, interest_options, consent_text_version, privacy_policy_text, privacy_policy_url, public_token, is_active, expires_at, event:events(name, edition)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (
    !form ||
    !isLeadFormOpen(
      {
        public_token: form.public_token as string,
        is_active: form.is_active as boolean,
        expires_at: form.expires_at as string,
      },
      token,
    )
  ) {
    return <ClosedForm />;
  }

  const eventRaw = form.event as unknown;
  const event = (Array.isArray(eventRaw) ? eventRaw[0] : eventRaw) as {
    name: string;
    edition: string | null;
  } | null;

  const formData: PublicLeadFormData = {
    id: form.id as string,
    name: form.name as string,
    description: form.description as string | null,
    custom_fields: (form.custom_fields ?? []) as CustomField[],
    standard_fields: (form.standard_fields ?? []) as StandardFieldKey[],
    interest_options: (form.interest_options ?? []) as string[],
    consent_text_version: form.consent_text_version as string,
    privacy_policy_text: form.privacy_policy_text as string | null,
    privacy_policy_url: form.privacy_policy_url as string | null,
    event_name: event ? `${event.name}${event.edition ? ` — ${event.edition}` : ""}` : "",
  };

  return <PublicLeadForm form={formData} slug={slug} token={token} />;
}
