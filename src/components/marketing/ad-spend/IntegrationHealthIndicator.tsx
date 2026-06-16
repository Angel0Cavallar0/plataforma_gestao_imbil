import { Badge } from "@/components/ui/badge";
import { AD_PLATFORMS, AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import type { IntegrationHealthRow } from "@/types/marketing-ads";

/** Tempo relativo desde a última coleta (coletado_em). */
function relative(iso: string | null): string {
  if (!iso) return "sem coleta registrada";
  const diffMs = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 1) return "há menos de 1h";
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "hoje" / "ontem" para datas recentes; datas mais antigas em numérico. */
function refDateLabel(iso: string | null): string | null {
  if (!iso) return null;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === toIso(today)) return "hoje";
  if (iso === toIso(yesterday)) return "ontem";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

type Health = {
  variant: "success" | "destructive" | "muted";
  label: string;
};

function health(row: IntegrationHealthRow | undefined): Health {
  if (row?.status === "error" || row?.status === "failed")
    return { variant: "destructive", label: "erro" };
  if (row && row.records > 0) return { variant: "success", label: "sincronizado" };
  return { variant: "muted", label: "sem dados" };
}

/**
 * Saúde da integração (rodapé da visão geral). A "última sincronização" é a
 * última data de coleta (coletado_em) dos insights de cada plataforma.
 */
export function IntegrationHealthIndicator({ rows }: { rows: IntegrationHealthRow[] }) {
  const byPlatform = new Map(rows.map((r) => [r.platform_slug, r]));

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <span className="font-medium text-muted-foreground">
          Saúde da integração (n8n):
        </span>
        {AD_PLATFORM_SLUGS.map((slug) => {
          const row = byPlatform.get(slug);
          const { variant, label } = health(row);
          const lastRef = refDateLabel(row?.last_reference_date ?? null);
          return (
            <span key={slug} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: AD_PLATFORMS[slug].color }}
              />
              <span className="font-medium">{AD_PLATFORMS[slug].name}</span>
              <Badge variant={variant}>{label}</Badge>
              <span
                className="text-muted-foreground"
                title={
                  row?.last_collected_at
                    ? `Última coleta: ${new Date(row.last_collected_at).toLocaleString("pt-BR")}`
                    : undefined
                }
              >
                {`última sincronização ${relative(row?.last_collected_at ?? null)}`}
                {lastRef && ` · dados até ${lastRef}`}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
