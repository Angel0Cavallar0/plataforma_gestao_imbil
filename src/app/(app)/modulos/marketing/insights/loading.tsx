import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Tela de carregamento exibida ao navegar entre os itens do submódulo Insights. */
export default function InsightsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-7 w-72" />
          <Skel className="h-4 w-96 max-w-full" />
        </div>
        <Skel className="h-9 w-44" />
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3">
        <Skel className="h-9 w-64" />
        <Skel className="h-9 w-24" />
        <Skel className="h-9 w-44" />
        <Skel className="h-9 w-72" />
      </div>

      {/* Cards de KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} className="h-28" />
        ))}
      </div>

      {/* Gráfico */}
      <Skel className="h-72" />

      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando…
      </div>
    </div>
  );
}
