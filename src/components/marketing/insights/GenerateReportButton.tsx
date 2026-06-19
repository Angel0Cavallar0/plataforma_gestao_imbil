"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarDays, Clock, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toIsoDate } from "@/lib/marketing/ad-spend";
import { DAILY_REPORT_LIMIT } from "@/lib/constants/marketing-insights";
import {
  getReportQuotaRemaining,
  requestMarketingReport,
  type RequestReportScope,
} from "@/server/actions/marketing/reports";

/** Botão "Gerar Relatório" com estados e contador de cota (Seção 7). */
export function GenerateReportButton({
  scope,
  remaining: initialRemaining,
  webhookConfigured,
}: {
  scope: RequestReportScope;
  remaining: number;
  webhookConfigured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [remaining, setRemaining] = useState(initialRemaining);
  const [generating, setGenerating] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Reabre o botão quando o relatório fica pronto (evento do realtime listener).
  useEffect(() => {
    const onReady = () => {
      setGenerating(false);
      void getReportQuotaRemaining().then(setRemaining);
    };
    window.addEventListener("mkt-report-ready", onReady);
    return () => window.removeEventListener("mkt-report-ready", onReady);
  }, []);

  // Segurança: não deixa "Gerando..." preso indefinidamente.
  useEffect(() => {
    if (!generating) return;
    const t = setTimeout(() => setGenerating(false), 12 * 60_000);
    return () => clearTimeout(t);
  }, [generating]);

  const limitReached = remaining <= 0;
  const disabled = pending || generating || limitReached || !webhookConfigured;

  function generate() {
    const period =
      range?.from && range?.to
        ? { data_inicio: toIsoDate(range.from), data_fim: toIsoDate(range.to) }
        : undefined;

    startTransition(async () => {
      const res = await requestMarketingReport(scope, period);
      if (res.ok) {
        setRemaining(res.remaining);
        setGenerating(true);
        setInfoOpen(true);
        window.dispatchEvent(new CustomEvent("mkt-report-requested"));
      } else if (res.reason === "daily_limit") {
        setRemaining(0);
        toast.error(
          `Limite diário de ${DAILY_REPORT_LIMIT} relatórios (global) atingido. Tente novamente amanhã.`,
        );
      } else if (res.reason === "not_configured") {
        toast.error("Webhook de relatórios não configurado.");
      } else if (res.reason === "forbidden") {
        toast.error("Você não tem permissão para solicitar relatórios.");
      } else {
        toast.error("Não foi possível solicitar agora.");
      }
    });
  }

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "dd/MM/yy", { locale: ptBR })} – ${format(range.to, "dd/MM/yy", { locale: ptBR })}`
      : "Período: padrão (7 dias)";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 font-normal",
            )}
            disabled={generating}
          >
            <CalendarDays className="h-4 w-4" />
            {rangeLabel}
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-2">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                showOutsideDays={false}
                autoFocus
              />
              <div className="flex justify-end px-1 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRange(undefined)}
                >
                  Usar padrão (7 dias)
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" onClick={generate} disabled={disabled} className="h-9">
          {pending || generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? "Gerando..." : "Gerar Relatório"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {!webhookConfigured
          ? "Webhook de relatórios não configurado."
          : generating
            ? "Relatório em produção — disponível em ~5 min."
            : limitReached
              ? `Limite diário de ${DAILY_REPORT_LIMIT} relatórios (global) atingido.`
              : `${remaining} de ${DAILY_REPORT_LIMIT} solicitações restantes hoje (limite global).`}
      </p>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </span>
              Relatório solicitado!
            </DialogTitle>
            <DialogDescription className="pt-1 text-left">
              O relatório está sendo gerado e leva, em média, <strong>5 minutos</strong>{" "}
              para ficar pronto. Você pode continuar usando o sistema normalmente —
              avisaremos aqui assim que ele estiver disponível.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <DialogClose className={cn(buttonVariants())}>Entendi</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
