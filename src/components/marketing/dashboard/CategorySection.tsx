import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  /** Link "ver detalhes" para o submódulo de origem. */
  href: string;
  /** Texto do link (default "ver detalhes"). */
  linkLabel?: string;
  /** Ações extras no cabeçalho (ex.: "Configurar regras"). */
  actions?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Bloco colapsável de uma categoria do dashboard, com título, link de
 * drill-down e conteúdo (KPIs + gráficos). Usa <details> nativo (aberto por
 * padrão) para colapsar sem JS.
 */
export function CategorySection({
  title,
  description,
  href,
  linkLabel = "ver detalhes",
  actions,
  children,
}: Props) {
  return (
    <details open className="group rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <Link
            href={href}
            className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"
          >
            {linkLabel}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </summary>
      <div className="space-y-4 border-t p-4">{children}</div>
    </details>
  );
}
