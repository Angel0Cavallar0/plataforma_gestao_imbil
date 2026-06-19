import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Carregamento exibido ao navegar entre as abas do submódulo Concorrentes. */
export default function ConcorrentesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skel className="h-7 w-64" />
        <Skel className="h-4 w-96 max-w-full" />
      </div>
      <Skel className="h-9 w-full max-w-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} className="h-28" />
        ))}
      </div>
      <Skel className="h-72" />
      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando…
      </div>
    </div>
  );
}
