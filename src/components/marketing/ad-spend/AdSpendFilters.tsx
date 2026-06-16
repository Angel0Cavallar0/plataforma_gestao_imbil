"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarDays, Check, Loader2, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AD_PLATFORMS, AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import { defaultDateRange, fromIsoDate, toIsoDate } from "@/lib/marketing/ad-spend";
import type { AdPlatformSlug, AdSpendFilters as Filters } from "@/types/marketing-ads";

function rangeFromFilters(filters: Filters): DateRange {
  return { from: fromIsoDate(filters.date_from), to: fromIsoDate(filters.date_to) };
}

/**
 * Filtros compartilhados (período, plataformas, busca). As alterações ficam em
 * estado local e só são aplicadas (gravadas na URL) ao clicar em "Aplicar".
 * Usa o calendário shadcn (range) num popover. O filtro de plataforma fica
 * oculto na visão por plataforma.
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
  const [pending, startTransition] = useTransition();

  const [range, setRange] = useState<DateRange | undefined>(rangeFromFilters(filters));
  const [search, setSearch] = useState(filters.search ?? "");
  const [platforms, setPlatforms] = useState<Set<AdPlatformSlug>>(
    new Set(filters.platforms ?? AD_PLATFORM_SLUGS),
  );
  const [open, setOpen] = useState(false);

  // Ressincroniza o estado local quando os filtros aplicados mudam (ex.:
  // navegação por voltar/avançar). Padrão "ajustar estado ao mudar prop":
  // setState durante a renderização, sem useEffect.
  const appliedKey = `${filters.date_from}|${filters.date_to}|${filters.search ?? ""}|${(filters.platforms ?? []).join(",")}`;
  const [prevKey, setPrevKey] = useState(appliedKey);
  if (appliedKey !== prevKey) {
    setPrevKey(appliedKey);
    setRange(rangeFromFilters(filters));
    setSearch(filters.search ?? "");
    setPlatforms(new Set(filters.platforms ?? AD_PLATFORM_SLUGS));
  }

  function togglePlatform(slug: AdPlatformSlug) {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next.size === 0 ? new Set(AD_PLATFORM_SLUGS) : next;
    });
  }

  function apply() {
    const params = new URLSearchParams();
    if (range?.from) params.set("date_from", toIsoDate(range.from));
    const end = range?.to ?? range?.from;
    if (end) params.set("date_to", toIsoDate(end));
    if (search.trim()) params.set("search", search.trim());
    if (showPlatformFilter && platforms.size !== AD_PLATFORM_SLUGS.length) {
      params.set("platforms", [...platforms].join(","));
    }
    const qs = params.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  function clear() {
    const d = defaultDateRange();
    setRange({ from: fromIsoDate(d.date_from), to: fromIsoDate(d.date_to) });
    setSearch("");
    setPlatforms(new Set(AD_PLATFORM_SLUGS));
    startTransition(() => router.push(pathname, { scroll: false }));
  }

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
      : range?.from
        ? `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – …`
        : "Selecionar período";

  // No padrão (mês atual, sem busca, todas as plataformas) o "Aplicar" fica
  // cinza; ao mudar qualquer filtro, ganha a cor principal indicando a ação.
  const def = defaultDateRange();
  const isDefaultView =
    !!range?.from &&
    !!range?.to &&
    toIsoDate(range.from) === def.date_from &&
    toIsoDate(range.to) === def.date_to &&
    search.trim() === "" &&
    (!showPlatformFilter || platforms.size === AD_PLATFORM_SLUGS.length);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        Período
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 w-[16rem] justify-start font-normal",
              !range?.from && "text-muted-foreground",
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {rangeLabel}
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              defaultMonth={range?.from}
              showOutsideDays={false}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isDefaultView ? "secondary" : "default"}
          onClick={apply}
          disabled={pending}
          className="h-9"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Aplicar
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={clear}
          disabled={pending}
          className="h-9"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        Buscar campanha
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            placeholder="Nome da campanha"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
            }}
            className="h-9 w-56 pl-8"
          />
        </div>
      </div>

      {showPlatformFilter && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          Plataformas
          <div className="flex gap-1.5">
            {AD_PLATFORM_SLUGS.map((slug) => {
              const on = platforms.has(slug);
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
