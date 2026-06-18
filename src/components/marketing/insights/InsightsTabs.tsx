"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { INSIGHTS_TABS } from "@/lib/constants/marketing-insights";

/** Navegação primária do submódulo Insights. Preserva os filtros (query string). */
export function InsightsTabs() {
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();

  return (
    <nav className="flex flex-wrap gap-1 border-b">
      {INSIGHTS_TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
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
