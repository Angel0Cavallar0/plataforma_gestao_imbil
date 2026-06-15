"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { AD_PLATFORMS, AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import type { AdPlatformSlug, AdSpendFilters as Filters } from "@/types/marketing-ads";

/**
 * Filtros compartilhados (período, plataformas, busca). Escreve nos
 * searchParams da rota — os Server Components reagem ao mudar a URL.
 * O filtro de plataforma fica oculto na visão por plataforma.
 */
export function AdSpendFilters({
  filters,
  showPlatformFilter = true,
}: {
  filters: Filters;
  showPlatformFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const selected = new Set(filters.platforms ?? AD_PLATFORM_SLUGS);

  function togglePlatform(slug: AdPlatformSlug) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    // Todas selecionadas => remove o filtro (estado padrão).
    if (next.size === 0 || next.size === AD_PLATFORM_SLUGS.length) {
      update({ platforms: null });
    } else {
      update({ platforms: [...next].join(",") });
    }
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3"
      data-pending={pending ? "" : undefined}
    >
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        De
        <Input
          type="date"
          value={filters.date_from}
          max={filters.date_to}
          onChange={(e) => update({ date_from: e.target.value })}
          className="h-9 w-40"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Até
        <Input
          type="date"
          value={filters.date_to}
          min={filters.date_from}
          onChange={(e) => update({ date_to: e.target.value })}
          className="h-9 w-40"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Buscar campanha
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            defaultValue={filters.search ?? ""}
            placeholder="Nome da campanha"
            onChange={(e) => update({ search: e.target.value || null })}
            className="h-9 w-56 pl-8"
          />
        </div>
      </label>

      {showPlatformFilter && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          Plataformas
          <div className="flex gap-1.5">
            {AD_PLATFORM_SLUGS.map((slug) => {
              const on = selected.has(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => togglePlatform(slug)}
                  className={cn(
                    buttonVariants({
                      variant: on ? "secondary" : "outline",
                      size: "sm",
                    }),
                    "h-9",
                  )}
                  aria-pressed={on}
                >
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: AD_PLATFORMS[slug].color }}
                  />
                  {AD_PLATFORMS[slug].name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
