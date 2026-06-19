"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const BASE = "/modulos/marketing/concorrentes";

const TABS = [
  { label: "Visão Geral", href: BASE },
  { label: "Redes Sociais", href: `${BASE}/redes-sociais` },
  { label: "YouTube", href: `${BASE}/youtube` },
  { label: "Busca & Tendências", href: `${BASE}/busca` },
  { label: "Anúncios", href: `${BASE}/anuncios` },
  { label: "Notícias", href: `${BASE}/noticias` },
  { label: "Reputação", href: `${BASE}/reputacao` },
] as const;

/** Navegação primária por abas no topo do submódulo Concorrentes. */
export function CompetitorsTabs() {
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();

  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {TABS.map((tab) => {
        const active =
          tab.href === BASE ? pathname === BASE : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={qs ? `${tab.href}?${qs}` : tab.href}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
