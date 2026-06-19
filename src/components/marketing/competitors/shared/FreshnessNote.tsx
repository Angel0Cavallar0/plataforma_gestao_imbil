import { Clock } from "lucide-react";
import { formatDateTime } from "@/lib/marketing/competitors";

/** Indica ao usuário o quão fresco está o dado (max collected_at das fontes). */
export function FreshnessNote({ lastCollectedAt }: { lastCollectedAt: string | null }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Dados atualizados em {formatDateTime(lastCollectedAt)}
    </p>
  );
}
