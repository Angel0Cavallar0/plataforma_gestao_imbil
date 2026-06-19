"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Pencil, Plus, Settings2, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SEVERITY_LABELS } from "@/lib/marketing/dashboard";
import {
  createAlertRuleAction,
  deleteAlertRuleAction,
  toggleAlertRuleAction,
  updateAlertRuleAction,
} from "@/server/actions/marketing/alert-rules";
import type {
  AlertRule,
  AlertRuleType,
  AlertSeverity,
} from "@/types/marketing-dashboard";

const SOURCES = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "linkedin_ads", label: "LinkedIn Ads" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin_page", label: "LinkedIn (página)" },
];
const METRICS = [
  "spend",
  "ctr",
  "cpc",
  "cpm",
  "reach",
  "impressions",
  "clicks",
  "conversions",
  "followers",
  "leads",
];
const SEVERITIES: AlertSeverity[] = ["low", "medium", "high", "critical"];

type FormState = {
  id?: string;
  name: string;
  rule_type: AlertRuleType;
  source: string;
  metric: string;
  direction: "increase" | "decrease" | "any";
  threshold_pct: string;
  period_window: "day" | "week" | "month";
  event_date: string;
  remind_days_before: string;
  severity: AlertSeverity;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  rule_type: "performance",
  source: "meta_ads",
  metric: "spend",
  direction: "any",
  threshold_pct: "30",
  period_window: "week",
  event_date: "",
  remind_days_before: "7",
  severity: "medium",
  is_active: true,
};

function ruleToForm(r: AlertRule): FormState {
  return {
    id: r.id,
    name: r.name,
    rule_type: r.rule_type,
    source: r.source ?? "meta_ads",
    metric: r.metric ?? "spend",
    direction: r.direction ?? "any",
    threshold_pct: r.threshold_pct != null ? String(r.threshold_pct) : "30",
    period_window: r.period_window ?? "week",
    event_date: r.event_date ?? "",
    remind_days_before: r.remind_days_before != null ? String(r.remind_days_before) : "7",
    severity: r.severity,
    is_active: r.is_active,
  };
}

/** Configuração de regras de alerta (performance / data). Requer gestor+. */
export function AlertRulesManager({
  rules,
  canManage,
  trigger,
}: {
  rules: AlertRule[];
  canManage: boolean;
  /** Elemento que abre o gerenciador (default: botão "Configurar regras"). */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function save() {
    if (!form) return;
    startTransition(async () => {
      const payload = {
        name: form.name,
        rule_type: form.rule_type,
        severity: form.severity,
        is_active: form.is_active,
        source: form.source,
        metric: form.metric,
        direction: form.direction,
        threshold_pct: form.threshold_pct ? Number(form.threshold_pct) : null,
        period_window: form.period_window,
        event_date: form.event_date || null,
        remind_days_before: form.remind_days_before
          ? Number(form.remind_days_before)
          : null,
      };
      const res = form.id
        ? await updateAlertRuleAction({ ...payload, id: form.id })
        : await createAlertRuleAction(payload);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(form.id ? "Regra atualizada." : "Regra criada.");
      setForm(null);
    });
  }

  function toggle(rule: AlertRule) {
    startTransition(async () => {
      const res = await toggleAlertRuleAction({
        id: rule.id,
        is_active: !rule.is_active,
      });
      if (res.error) toast.error(res.error);
    });
  }

  function remove(rule: AlertRule) {
    if (!confirm(`Excluir a regra "${rule.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteAlertRuleAction(rule.id);
      if (res.error) toast.error(res.error);
      else toast.success("Regra excluída.");
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8">
            <Settings2 className="h-3.5 w-3.5" />
            Configurar regras
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Regras de alerta</DialogTitle>
            <DialogDescription>
              Defina alertas por variação de performance ou por datas relevantes. As
              regras de data aparecem em &ldquo;Datas relevantes próximas&rdquo;; as de
              performance são avaliadas pelo fluxo de alertas (n8n).
            </DialogDescription>
          </DialogHeader>

          {/* Lista de regras */}
          <div className="space-y-2">
            {rules.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma regra cadastrada.
              </p>
            ) : (
              rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {r.rule_type === "performance" ? (
                      <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.rule_type === "performance"
                          ? `${r.source} · ${r.metric} ${r.direction} ${r.threshold_pct}% / ${r.period_window}`
                          : `${r.event_date} · avisar ${r.remind_days_before}d antes`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant={r.is_active ? "success" : "muted"}>
                      {SEVERITY_LABELS[r.severity]}
                    </Badge>
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toggle(r)}
                          disabled={pending}
                        >
                          {r.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setForm(ruleToForm(r))}
                          disabled={pending}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => remove(r)}
                          disabled={pending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {canManage &&
            (form ? (
              <RuleForm
                form={form}
                set={set}
                onCancel={() => setForm(null)}
                onSave={save}
                pending={pending}
              />
            ) : (
              <Button variant="outline" onClick={() => setForm({ ...emptyForm })}>
                <Plus className="h-4 w-4" />
                Nova regra
              </Button>
            ))}

          {!canManage && (
            <p className="text-xs text-muted-foreground">
              Apenas perfis gestor+ podem criar ou editar regras.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RuleForm({
  form,
  set,
  onCancel,
  onSave,
  pending,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onCancel: () => void;
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-sm font-semibold">{form.id ? "Editar regra" : "Nova regra"}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="rule-name">Nome</Label>
          <Input
            id="rule-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex.: CPC do Google subindo"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="rule-type">Tipo</Label>
          <Select
            id="rule-type"
            value={form.rule_type}
            onChange={(e) => set("rule_type", e.target.value as AlertRuleType)}
          >
            <option value="performance">Performance (variação)</option>
            <option value="date">Data relevante</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="rule-severity">Severidade</Label>
          <Select
            id="rule-severity"
            value={form.severity}
            onChange={(e) => set("severity", e.target.value as AlertSeverity)}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {form.rule_type === "performance" ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="rule-source">Fonte</Label>
              <Select
                id="rule-source"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-metric">Métrica</Label>
              <Select
                id="rule-metric"
                value={form.metric}
                onChange={(e) => set("metric", e.target.value)}
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-direction">Direção</Label>
              <Select
                id="rule-direction"
                value={form.direction}
                onChange={(e) =>
                  set("direction", e.target.value as FormState["direction"])
                }
              >
                <option value="increase">Subir</option>
                <option value="decrease">Cair</option>
                <option value="any">Qualquer</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-threshold">Limite (%)</Label>
              <Input
                id="rule-threshold"
                type="number"
                value={form.threshold_pct}
                onChange={(e) => set("threshold_pct", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-window">Janela</Label>
              <Select
                id="rule-window"
                value={form.period_window}
                onChange={(e) =>
                  set("period_window", e.target.value as FormState["period_window"])
                }
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mês</option>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <Label htmlFor="rule-date">Data do evento</Label>
              <Input
                id="rule-date"
                type="date"
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-remind">Avisar dias antes</Label>
              <Input
                id="rule-remind"
                type="number"
                value={form.remind_days_before}
                onChange={(e) => set("remind_days_before", e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={pending || !form.name.trim()}>
          {form.id ? "Salvar" : "Criar regra"}
        </Button>
      </div>
    </div>
  );
}
