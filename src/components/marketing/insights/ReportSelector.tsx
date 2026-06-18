"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { REPORT_TIPO_LABELS } from "@/lib/constants/marketing-insights";
import type { ReportListItem, ReportTipo } from "@/types/marketing-insights";

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

/** Seletor de relatórios por tipo/período, com badge do modelo (Seção 6.4). */
export function ReportSelector({
  reports,
  selectedId,
  model,
}: {
  reports: ReportListItem[];
  selectedId: string | null;
  model: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") ?? "";

  function update(next: { tipo?: string | null; report?: string | null }) {
    const p = new URLSearchParams(searchParams.toString());
    if (next.tipo !== undefined) {
      if (next.tipo) p.set("tipo", next.tipo);
      else p.delete("tipo");
      // ao trocar o tipo, volta para o mais recente do tipo
      p.delete("report");
    }
    if (next.report !== undefined) {
      if (next.report) p.set("report", next.report);
      else p.delete("report");
    }
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
          {(Object.keys(REPORT_TIPO_LABELS) as ReportTipo[]).map((t) => (
            <option key={t} value={t}>
              {REPORT_TIPO_LABELS[t]}
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
                {REPORT_TIPO_LABELS[r.tipo]} · {fmtDateTime(r.gerado_em)}
              </option>
            ))
          )}
        </Select>
      </label>

      {model && (
        <Badge variant="muted" className="mb-1">
          Modelo: {model}
        </Badge>
      )}
    </div>
  );
}
