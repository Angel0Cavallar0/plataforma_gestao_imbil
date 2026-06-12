"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  EVENT_COST_CATEGORIES,
  EVENT_COST_CATEGORY_LABELS,
} from "@/lib/constants/marketing-events";
import {
  addEventCostAction,
  deleteEventCostAction,
} from "@/server/actions/marketing/events";
import type { EventCost, EventCostCategory } from "@/types/marketing-events";

function formatBRL(value: number): string {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface EventCostsSectionProps {
  eventId: string;
  costs: EventCost[];
  investmentPlanned: number | null;
}

export function EventCostsSection({
  eventId,
  costs,
  investmentPlanned,
}: EventCostsSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    category: "inscricao" as EventCostCategory,
    description: "",
    amount: "",
    paid_at: "",
  });

  const total = costs.reduce((sum, c) => sum + Number(c.amount), 0);
  const byCategory = costs.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + Number(c.amount);
    return acc;
  }, {});

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await addEventCostAction({
        event_id: eventId,
        category: form.category,
        description: form.description,
        amount: form.amount,
        paid_at: form.paid_at || undefined,
      });
      if (res.error) {
        toast.error(
          typeof res.error === "string" ? res.error : "Erro ao adicionar custo",
        );
        return;
      }
      toast.success("Custo adicionado.");
      setForm({ category: "inscricao", description: "", amount: "", paid_at: "" });
      router.refresh();
    });
  }

  function handleDelete(costId: string) {
    startTransition(async () => {
      const res = await deleteEventCostAction(costId, eventId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Custo removido.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="grid items-end gap-3 sm:grid-cols-[10rem_1fr_8rem_10rem_auto]"
      >
        <div>
          <Label htmlFor="cost-category">Categoria</Label>
          <Select
            id="cost-category"
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value as EventCostCategory }))
            }
          >
            {EVENT_COST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EVENT_COST_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cost-description">Descrição</Label>
          <Input
            id="cost-description"
            required
            minLength={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="cost-amount">Valor (R$)</Label>
          <Input
            id="cost-amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="cost-paid-at">Pago em</Label>
          <Input
            id="cost-paid-at"
            type="date"
            value={form.paid_at}
            onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))}
          />
        </div>
        <Button type="submit" disabled={pending}>
          Adicionar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2">Pago em</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {costs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum custo registrado.
                </td>
              </tr>
            )}
            {costs.map((cost) => (
              <tr key={cost.id} className="border-t">
                <td className="px-3 py-2">{EVENT_COST_CATEGORY_LABELS[cost.category]}</td>
                <td className="px-3 py-2">{cost.description}</td>
                <td className="px-3 py-2 text-right">{formatBRL(cost.amount)}</td>
                <td className="px-3 py-2">
                  {cost.paid_at
                    ? new Date(cost.paid_at + "T00:00:00").toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => handleDelete(cost.id)}
                    disabled={pending}
                    aria-label="Remover custo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          {costs.length > 0 && (
            <tfoot className="border-t bg-muted/30 font-medium">
              <tr>
                <td className="px-3 py-2" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2 text-right">{formatBRL(total)}</td>
                <td className="px-3 py-2" colSpan={2}>
                  {investmentPlanned !== null && (
                    <span className="text-xs text-muted-foreground">
                      Orçado: {formatBRL(investmentPlanned)} (
                      {Math.round((total / investmentPlanned) * 100)}%)
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {Object.entries(byCategory).map(([cat, value]) => (
            <span key={cat} className="rounded-full bg-muted px-2.5 py-1">
              {EVENT_COST_CATEGORY_LABELS[cat as EventCostCategory]}: {formatBRL(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
