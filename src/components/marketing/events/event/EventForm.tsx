"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/constants/marketing-events";
import { createEventAction, updateEventAction } from "@/server/actions/marketing/events";
import type { EventType, MarketingEvent } from "@/types/marketing-events";

interface EventFormProps {
  event?: MarketingEvent;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: event?.name ?? "",
    edition: event?.edition ?? "",
    event_type: (event?.event_type ?? "feira") as EventType,
    description: event?.description ?? "",
    objective: event?.objective ?? "",
    starts_on: event?.starts_on ?? "",
    ends_on: event?.ends_on ?? "",
    venue: event?.venue ?? "",
    city: event?.city ?? "",
    state: event?.state ?? "",
    investment_planned: event?.investment_planned?.toString() ?? "",
    investment_actual: event?.investment_actual?.toString() ?? "",
    estimated_value_per_lead: event?.estimated_value_per_lead?.toString() ?? "",
    notes: event?.notes ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      edition: form.edition || undefined,
      event_type: form.event_type,
      description: form.description || undefined,
      objective: form.objective || undefined,
      starts_on: form.starts_on || undefined,
      ends_on: form.ends_on || undefined,
      venue: form.venue || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      investment_planned: form.investment_planned || undefined,
      investment_actual: form.investment_actual || undefined,
      estimated_value_per_lead: form.estimated_value_per_lead || undefined,
      notes: form.notes || undefined,
    };

    startTransition(async () => {
      const res = event
        ? await updateEventAction({ id: event.id, ...payload })
        : await createEventAction(payload);
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Erro ao salvar evento");
        return;
      }
      toast.success(event ? "Evento atualizado." : "Evento criado.");
      const id = event?.id ?? (res.data as { id?: string })?.id;
      router.push(id ? `/modulos/marketing/eventos/${id}` : "/modulos/marketing/eventos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div>
          <Label htmlFor="name">Nome do evento *</Label>
          <Input
            id="name"
            required
            minLength={3}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edition">Edição</Label>
          <Input
            id="edition"
            placeholder="2026"
            value={form.edition}
            onChange={(e) => set("edition", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="event_type">Tipo *</Label>
        <Select
          id="event_type"
          value={form.event_type}
          onChange={(e) => set("event_type", e.target.value)}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="starts_on">Início</Label>
          <Input
            id="starts_on"
            type="date"
            value={form.starts_on}
            onChange={(e) => set("starts_on", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ends_on">Fim</Label>
          <Input
            id="ends_on"
            type="date"
            value={form.ends_on}
            onChange={(e) => set("ends_on", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_5rem]">
        <div>
          <Label htmlFor="venue">Local</Label>
          <Input
            id="venue"
            placeholder="Expo Center Norte"
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="state">UF</Label>
          <Input
            id="state"
            maxLength={2}
            value={form.state}
            onChange={(e) => set("state", e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="objective">Objetivo da participação</Label>
        <Textarea
          id="objective"
          rows={2}
          value={form.objective}
          onChange={(e) => set("objective", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="investment_planned">Investimento planejado (R$)</Label>
          <Input
            id="investment_planned"
            type="number"
            min="0"
            step="0.01"
            value={form.investment_planned}
            onChange={(e) => set("investment_planned", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="investment_actual">Investimento realizado (R$)</Label>
          <Input
            id="investment_actual"
            type="number"
            min="0"
            step="0.01"
            value={form.investment_actual}
            onChange={(e) => set("investment_actual", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="estimated_value_per_lead">Valor estimado/lead (R$)</Label>
          <Input
            id="estimated_value_per_lead"
            type="number"
            min="0"
            step="0.01"
            value={form.estimated_value_per_lead}
            onChange={(e) => set("estimated_value_per_lead", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : event ? "Salvar alterações" : "Criar evento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
