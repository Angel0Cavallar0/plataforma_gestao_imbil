"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CONSENT_TEXT,
  MAX_CUSTOM_FIELDS,
  STANDARD_FIELD_KEYS,
  STANDARD_FIELD_LABELS,
} from "@/lib/constants/marketing-events";
import {
  createLeadFormAction,
  updateLeadFormAction,
} from "@/server/actions/marketing/lead-forms";
import type { EventSelectOption } from "@/server/queries/marketing/events";
import { FieldEditor } from "./FieldEditor";
import { FormPublicLink } from "./FormPublicLink";
import { PublicLeadForm } from "@/components/marketing/events/public/PublicLeadForm";
import type { CustomField, LeadForm, StandardFieldKey } from "@/types/marketing-events";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** Sugestão default de expiração: último dia do evento + 1 dia (Seção 6.2). */
function suggestExpiration(event?: EventSelectOption): string {
  const base = event?.ends_on
    ? new Date(event.ends_on + "T23:59:00")
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (event?.ends_on) base.setDate(base.getDate() + 1);
  return toDatetimeLocal(base.toISOString());
}

const STEPS = ["Básico", "Campos", "Publicação"];

interface LeadFormBuilderProps {
  events: EventSelectOption[];
  form?: LeadForm;
  defaultEventId?: string;
}

export function LeadFormBuilder({ events, form, defaultEventId }: LeadFormBuilderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [savedForm, setSavedForm] = useState<{
    id: string;
    slug: string;
    token: string;
  } | null>(form ? { id: form.id, slug: form.slug, token: form.public_token } : null);
  const [slugTouched, setSlugTouched] = useState(!!form);

  const [basics, setBasics] = useState({
    event_id: form?.event_id ?? defaultEventId ?? "",
    name: form?.name ?? "",
    slug: form?.slug ?? "",
    description: form?.description ?? "",
    expires_at: form
      ? toDatetimeLocal(form.expires_at)
      : suggestExpiration(events.find((e) => e.id === defaultEventId)),
    interest_options: form?.interest_options?.join(", ") ?? "",
    policy_mode: form?.privacy_policy_url ? "url" : ("texto" as "texto" | "url"),
    privacy_policy_text: form?.privacy_policy_text ?? "",
    privacy_policy_url: form?.privacy_policy_url ?? "",
  });
  const [standardFields, setStandardFields] = useState<StandardFieldKey[]>(
    form?.standard_fields ?? ["company", "job_title", "interest"],
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(
    form?.custom_fields ? [...form.custom_fields].sort((a, b) => a.order - b.order) : [],
  );
  const [isActive, setIsActive] = useState(form?.is_active ?? false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const interestOptions = useMemo(
    () =>
      basics.interest_options
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
        .slice(0, 20),
    [basics.interest_options],
  );

  function setBasic<K extends keyof typeof basics>(key: K, value: string) {
    setBasics((b) => ({ ...b, [key]: value }));
  }

  function addCustomField() {
    if (customFields.length >= MAX_CUSTOM_FIELDS) {
      toast.error(`Máximo de ${MAX_CUSTOM_FIELDS} campos customizados.`);
      return;
    }
    const key = `campo_${Date.now().toString(36)}`;
    setCustomFields((f) => [
      ...f,
      { key, label: "", type: "text", required: false, order: f.length },
    ]);
  }

  function buildPayload() {
    return {
      event_id: basics.event_id,
      name: basics.name,
      slug: basics.slug || slugify(basics.name),
      description: basics.description || undefined,
      standard_fields: standardFields,
      interest_options: interestOptions,
      custom_fields: customFields.map((f, i) => ({
        ...f,
        key:
          f.key.startsWith("campo_") && f.label
            ? slugify(f.label).replace(/-/g, "_").slice(0, 40) || f.key
            : f.key,
        order: i,
      })),
      expires_at: basics.expires_at,
      privacy_policy_text:
        basics.policy_mode === "texto"
          ? basics.privacy_policy_text || undefined
          : undefined,
      privacy_policy_url:
        basics.policy_mode === "url" ? basics.privacy_policy_url || undefined : undefined,
      is_active: isActive,
    };
  }

  function handleSave() {
    if (!basics.event_id || !basics.name) {
      toast.error("Evento e nome são obrigatórios.");
      setStep(0);
      return;
    }
    if (customFields.some((f) => f.label.trim().length < 2)) {
      toast.error("Todos os campos customizados precisam de label (mín. 2 caracteres).");
      setStep(1);
      return;
    }
    startTransition(async () => {
      const payload = buildPayload();
      const existingId = form?.id ?? savedForm?.id;
      const res = existingId
        ? await updateLeadFormAction({ id: existingId, ...payload })
        : await createLeadFormAction(payload);
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Erro ao salvar");
        return;
      }
      toast.success(
        form ? "Formulário atualizado." : "Formulário criado — QR Code gerado.",
      );
      if (!form && res.data) {
        const created = res.data as { id: string; slug: string; public_token: string };
        setSavedForm({ id: created.id, slug: created.slug, token: created.public_token });
      }
      router.refresh();
    });
  }

  const previewData = {
    id: "preview",
    name: basics.name || "Nome do formulário",
    description: basics.description || null,
    custom_fields: customFields,
    standard_fields: standardFields,
    interest_options: interestOptions,
    consent_text_version: "preview",
    privacy_policy_text: basics.privacy_policy_text || null,
    privacy_policy_url: basics.privacy_policy_url || null,
    event_name: events.find((e) => e.id === basics.event_id)?.name ?? "Evento",
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="space-y-6">
        <div className="flex gap-1 border-b">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                step === i
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-event">Evento vinculado *</Label>
              <Select
                id="form-event"
                required
                value={basics.event_id}
                onChange={(e) => {
                  setBasic("event_id", e.target.value);
                  if (!form) {
                    const ev = events.find((x) => x.id === e.target.value);
                    setBasic("expires_at", suggestExpiration(ev));
                  }
                }}
              >
                <option value="">Selecione o evento...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                    {ev.edition ? ` · ${ev.edition}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="form-name">Nome do formulário *</Label>
                <Input
                  id="form-name"
                  required
                  minLength={3}
                  placeholder="Formulário do estande"
                  value={basics.name}
                  onChange={(e) => {
                    setBasic("name", e.target.value);
                    if (!slugTouched) setBasic("slug", slugify(e.target.value));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="form-slug">Slug (URL pública) *</Label>
                <Input
                  id="form-slug"
                  required
                  pattern="[a-z0-9-]+"
                  disabled={!!form && form.is_active}
                  value={basics.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setBasic("slug", slugify(e.target.value));
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="form-description">
                Descrição (topo do formulário público)
              </Label>
              <Textarea
                id="form-description"
                rows={2}
                value={basics.description}
                onChange={(e) => setBasic("description", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="form-expires">Expira em *</Label>
                <Input
                  id="form-expires"
                  type="datetime-local"
                  required
                  value={basics.expires_at}
                  onChange={(e) => setBasic("expires_at", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Obrigatório — nenhum formulário vive para sempre. Sugestão: último dia
                  do evento + 1.
                </p>
              </div>
              <div>
                <Label htmlFor="form-interests">Opções de “Área de interesse”</Label>
                <Input
                  id="form-interests"
                  placeholder="Bombas, Serviços, Peças (separadas por vírgula)"
                  value={basics.interest_options}
                  onChange={(e) => setBasic("interest_options", e.target.value)}
                />
              </div>
            </div>

            <fieldset className="rounded-lg border p-4">
              <legend className="px-1 text-sm font-medium">
                Política de privacidade (obrigatória para ativar)
              </legend>
              <div className="mb-3 flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={basics.policy_mode === "texto"}
                    onChange={() => setBasic("policy_mode", "texto")}
                  />
                  Preencher o texto
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={basics.policy_mode === "url"}
                    onChange={() => setBasic("policy_mode", "url")}
                  />
                  Informar URL externa
                </label>
              </div>
              {basics.policy_mode === "texto" ? (
                <Textarea
                  rows={5}
                  placeholder="Texto da política de privacidade (markdown básico)"
                  value={basics.privacy_policy_text}
                  onChange={(e) => setBasic("privacy_policy_text", e.target.value)}
                />
              ) : (
                <Input
                  type="url"
                  placeholder="https://www.imbil.com.br/politica-de-privacidade"
                  value={basics.privacy_policy_url}
                  onChange={(e) => setBasic("privacy_policy_url", e.target.value)}
                />
              )}
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-sm font-semibold">Campos obrigatórios fixos</h2>
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                <p>Nome completo *</p>
                <p>E-mail / Telefone (pelo menos um) *</p>
                <p>Consentimento LGPD (checkbox, sempre por último) *</p>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold">Campos padrão opcionais</h2>
              <div className="flex flex-wrap gap-4">
                {STANDARD_FIELD_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={standardFields.includes(key)}
                      onChange={(e) =>
                        setStandardFields((f) =>
                          e.target.checked ? [...f, key] : f.filter((k) => k !== key),
                        )
                      }
                    />
                    {STANDARD_FIELD_LABELS[key]}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Campos customizados ({customFields.length}/{MAX_CUSTOM_FIELDS})
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomField}
                >
                  <Plus className="mr-1 h-4 w-4" /> Adicionar campo
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                onDragEnd={(e) => {
                  const { active, over } = e;
                  if (!over || active.id === over.id) return;
                  setCustomFields((fields) => {
                    const from = fields.findIndex((f) => f.key === active.id);
                    const to = fields.findIndex((f) => f.key === over.id);
                    return arrayMove(fields, from, to).map((f, i) => ({
                      ...f,
                      order: i,
                    }));
                  });
                }}
              >
                <SortableContext
                  items={customFields.map((f) => f.key)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {customFields.map((field, i) => (
                      <FieldEditor
                        key={field.key}
                        field={field}
                        onChange={(updated) =>
                          setCustomFields((f) => f.map((x, j) => (j === i ? updated : x)))
                        }
                        onRemove={() =>
                          setCustomFields((f) =>
                            f
                              .filter((_, j) => j !== i)
                              .map((x, j) => ({ ...x, order: j })),
                          )
                        }
                      />
                    ))}
                    {customFields.length === 0 && (
                      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Nenhum campo customizado — adicione os que precisar.
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <label className="flex items-center gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium">Ativar formulário</span>
                <span className="block text-xs text-muted-foreground">
                  Exige política de privacidade preenchida (texto ou URL). Requer perfil
                  supervisão+.
                </span>
              </span>
            </label>

            {savedForm && (
              <FormPublicLink
                formId={savedForm.id}
                slug={savedForm.slug}
                token={savedForm.token}
              />
            )}
            {!savedForm && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Salve o formulário para gerar o link público e o QR Code automaticamente.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            {step < 2 && (
              <Button type="button" variant="outline" onClick={() => setStep(step + 1)}>
                Avançar
              </Button>
            )}
          </div>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending
              ? "Salvando..."
              : form || savedForm
                ? "Salvar alterações"
                : "Criar formulário"}
          </Button>
        </div>
      </div>

      <aside className="space-y-2 xl:sticky xl:top-6">
        <h2 className="text-sm font-semibold">Preview (renderização real)</h2>
        <div className="pointer-events-none max-h-[70dvh] overflow-y-auto rounded-lg border">
          <PublicLeadForm form={previewData} slug="preview" token="preview" />
        </div>
        <p className="text-xs text-muted-foreground">
          Atualiza em tempo real conforme você edita. Checkbox de consentimento: “
          {CONSENT_TEXT}”
        </p>
      </aside>
    </div>
  );
}
