"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ReportMarkdownDialog } from "@/components/marketing/insights/ReportMarkdownDialog";
import { REPORT_TIPOS, reportTipoLabel } from "@/lib/constants/marketing-insights";
import type { ReportListItem } from "@/types/marketing-insights";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Seletor de relatórios (tipo/período) + tag do tipo + modelo + "ver completo".
 * Fica junto ao filtro de data: ao trocar de relatório/tipo, as datas são
 * removidas da URL para que o período volte ao padrão do relatório selecionado.
 */
export function ReportSelector({
  reports,
  selectedId,
  model,
  markdown,
}: {
  reports: ReportListItem[];
  selectedId: string | null;
  model: string | null;
  markdown: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") ?? "";

  const selectedTipo = reports.find((r) => r.id === selectedId)?.tipo ?? null;

  function update(next: { tipo?: string | null; report?: string | null }) {
    const p = new URLSearchParams(searchParams.toString());
    if (next.tipo !== undefined) {
      if (next.tipo) p.set("tipo", next.tipo);
      else p.delete("tipo");
      p.delete("report"); // troca de tipo → volta ao mais recente do tipo
    }
    if (next.report !== undefined) {
      if (next.report) p.set("report", next.report);
      else p.delete("report");
    }
    // O período passa a seguir o relatório selecionado (padrão).
    p.delete("date_from");
    p.delete("date_to");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Tipo
        <Select
          value={tipo}
          onChange={(e) => update({ tipo: e.target.value })}
          className="h-9 w-44"
        >
          <option value="">Todos os tipos</option>
          {REPORT_TIPOS.map((t) => (
            <option key={t} value={t}>
              {reportTipoLabel(t)}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Relatório
        <Select
          value={selectedId ?? ""}
          onChange={(e) => update({ report: e.target.value })}
          className="h-9 w-72"
          disabled={reports.length === 0}
        >
          {reports.length === 0 ? (
            <option value="">Nenhum relatório</option>
          ) : (
            reports.map((r) => (
              <option key={r.id} value={r.id}>
                {fmtDate(r.periodo_inicio)}–{fmtDate(r.periodo_fim)} ·{" "}
                {fmtDateTime(r.gerado_em)}
              </option>
            ))
          )}
        </Select>
      </label>

      <div className="mb-1 flex flex-wrap items-center gap-2">
        {selectedTipo && (
          <Badge variant="secondary">{reportTipoLabel(selectedTipo)}</Badge>
        )}
        {model && <Badge variant="muted">Modelo: {model}</Badge>}
        <ReportMarkdownDialog markdown={markdown} />
      </div>
    </div>
  );
}
