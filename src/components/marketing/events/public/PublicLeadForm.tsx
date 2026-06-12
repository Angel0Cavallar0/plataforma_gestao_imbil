"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CONSENT_TEXT, STANDARD_FIELD_LABELS } from "@/lib/constants/marketing-events";
import { DynamicField } from "./DynamicField";
import type { PublicLeadFormData } from "@/types/marketing-events";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

interface PublicLeadFormProps {
  form: PublicLeadFormData;
  slug: string;
  token: string;
}

const EMPTY_STATE = {
  full_name: "",
  email: "",
  phone: "",
  company: "",
  job_title: "",
  city: "",
  state: "",
  interest: "",
  message: "",
};

export function PublicLeadForm({ form, slug, token }: PublicLeadFormProps) {
  const [values, setValues] = useState({ ...EMPTY_STATE });
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const sortedFields = useMemo(
    () => [...form.custom_fields].sort((a, b) => a.order - b.order),
    [form.custom_fields],
  );
  const has = (key: string) => form.standard_fields.includes(key as never);

  function set(field: keyof typeof EMPTY_STATE, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function reset() {
    setValues({ ...EMPTY_STATE });
    setCustomAnswers({});
    setConsent(false);
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.email && !values.phone) {
      setError("Informe e-mail ou telefone.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/lead-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          token,
          ...values,
          custom_answers: customAnswers,
          marketing_consent: consent,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          (body?.error as string) ??
            "Não foi possível enviar. Verifique os dados e tente novamente.",
        );
        return;
      }
      setSuccess(true);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Image
          src="/imbil-logo.svg"
          alt="Imbil"
          width={130}
          height={40}
          className="mb-6 h-10 w-auto"
        />
        <h1 className="text-2xl font-semibold text-slate-900">Obrigado!</h1>
        <p className="mt-2 max-w-sm text-base text-slate-600">
          Recebemos seus dados. A equipe Imbil entrará em contato em breve.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 w-full max-w-xs rounded-lg bg-slate-900 px-6 py-4 text-base font-semibold text-white hover:bg-slate-800"
        >
          Cadastrar outro
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 text-center">
          <Image
            src="/imbil-logo.svg"
            alt="Imbil"
            width={130}
            height={40}
            className="mx-auto h-10 w-auto"
          />
          {form.event_name && (
            <p className="mt-3 text-sm font-medium uppercase tracking-wide text-slate-500">
              {form.event_name}
            </p>
          )}
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{form.name}</h1>
          {form.description && (
            <p className="mt-2 text-sm text-slate-600">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot — invisível para humanos */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div>
            <label htmlFor="full_name" className={labelClass}>
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              className={inputClass}
              required
              minLength={3}
              value={values.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              className={inputClass}
              placeholder="(11) 99999-9999"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">Informe e-mail ou telefone.</p>
          </div>

          {has("company") && (
            <div>
              <label htmlFor="company" className={labelClass}>
                {STANDARD_FIELD_LABELS.company}
              </label>
              <input
                id="company"
                className={inputClass}
                value={values.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
          )}

          {has("job_title") && (
            <div>
              <label htmlFor="job_title" className={labelClass}>
                {STANDARD_FIELD_LABELS.job_title}
              </label>
              <input
                id="job_title"
                className={inputClass}
                value={values.job_title}
                onChange={(e) => set("job_title", e.target.value)}
              />
            </div>
          )}

          {has("city_state") && (
            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <div>
                <label htmlFor="city" className={labelClass}>
                  Cidade
                </label>
                <input
                  id="city"
                  className={inputClass}
                  value={values.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  UF
                </label>
                <input
                  id="state"
                  className={inputClass}
                  maxLength={2}
                  value={values.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}

          {has("interest") && (
            <div>
              <label htmlFor="interest" className={labelClass}>
                {STANDARD_FIELD_LABELS.interest}
              </label>
              {form.interest_options.length > 0 ? (
                <select
                  id="interest"
                  className={inputClass}
                  value={values.interest}
                  onChange={(e) => set("interest", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {form.interest_options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="interest"
                  className={inputClass}
                  value={values.interest}
                  onChange={(e) => set("interest", e.target.value)}
                />
              )}
            </div>
          )}

          {has("message") && (
            <div>
              <label htmlFor="message" className={labelClass}>
                {STANDARD_FIELD_LABELS.message}
              </label>
              <textarea
                id="message"
                className={inputClass}
                rows={3}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </div>
          )}

          {sortedFields.map((field) => (
            <DynamicField
              key={field.key}
              field={field}
              value={customAnswers[field.key] ?? ""}
              onChange={(v) => setCustomAnswers((a) => ({ ...a, [field.key]: v }))}
            />
          ))}

          {/* Consentimento LGPD — sempre por último, desmarcado por padrão */}
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              {CONSENT_TEXT}{" "}
              {form.privacy_policy_url ? (
                <a
                  href={form.privacy_policy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 underline"
                >
                  Política de Privacidade
                </a>
              ) : form.privacy_policy_text ? (
                <button
                  type="button"
                  onClick={() => setPolicyOpen(true)}
                  className="font-medium text-slate-900 underline"
                >
                  Política de Privacidade
                </button>
              ) : null}
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-6 py-4 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>

      {policyOpen && form.privacy_policy_text && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPolicyOpen(false)}
        >
          <div
            className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Política de Privacidade
            </h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {form.privacy_policy_text}
            </p>
            <button
              type="button"
              onClick={() => setPolicyOpen(false)}
              className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
