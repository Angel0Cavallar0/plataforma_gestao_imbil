"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createLeadManualAction } from "@/server/actions/marketing/leads";
import type { EventSelectOption } from "@/server/queries/marketing/events";

const EMPTY = {
  event_id: "",
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

export function LeadManualForm({ events }: { events: EventSelectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...EMPTY });
  const [consent, setConsent] = useState(false);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      consent &&
      !window.confirm(
        "Confirma que o lead autorizou verbalmente o uso dos dados para marketing?",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await createLeadManualAction({
        ...form,
        marketing_consent: consent,
      });
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Erro ao criar lead");
        return;
      }
      toast.success("Lead cadastrado.");
      setForm({ ...EMPTY });
      setConsent(false);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Novo lead</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo lead (cadastro manual)</DialogTitle>
            <DialogDescription>
              Lead captado fora do formulário público — origem registrada como “cadastro
              manual”.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="ml-event">Evento *</Label>
              <Select
                id="ml-event"
                required
                value={form.event_id}
                onChange={(e) => set("event_id", e.target.value)}
              >
                <option value="">Selecione...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                    {ev.edition ? ` · ${ev.edition}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="ml-name">Nome completo *</Label>
              <Input
                id="ml-name"
                required
                minLength={3}
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ml-email">E-mail</Label>
                <Input
                  id="ml-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ml-phone">Telefone</Label>
                <Input
                  id="ml-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ml-company">Empresa</Label>
                <Input
                  id="ml-company"
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ml-job">Cargo</Label>
                <Input
                  id="ml-job"
                  value={form.job_title}
                  onChange={(e) => set("job_title", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_5rem_1fr]">
              <div>
                <Label htmlFor="ml-city">Cidade</Label>
                <Input
                  id="ml-city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ml-state">UF</Label>
                <Input
                  id="ml-state"
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="ml-interest">Interesse</Label>
                <Input
                  id="ml-interest"
                  value={form.interest}
                  onChange={(e) => set("interest", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ml-message">Mensagem</Label>
              <Textarea
                id="ml-message"
                rows={2}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                O lead consentiu <strong>verbalmente</strong> com o uso dos dados para
                comunicações de marketing (LGPD).
              </span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : "Cadastrar lead"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
