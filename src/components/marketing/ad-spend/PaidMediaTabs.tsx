"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Geral", href: "/modulos/marketing/midia-paga" },
  { label: "Meta Ads", href: "/modulos/marketing/midia-paga/meta" },
  { label: "Google Ads", href: "/modulos/marketing/midia-paga/google" },
  { label: "LinkedIn Ads", href: "/modulos/marketing/midia-paga/linkedin" },
] as const;

/** Navegação primária do submódulo. Preserva os filtros (query string). */
export function PaidMediaTabs() {
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();

  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
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
