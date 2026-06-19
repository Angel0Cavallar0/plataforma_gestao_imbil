"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import type { SocialNetwork } from "@/types/marketing-insights";

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const NETWORK_OPTIONS: SocialNetwork[] = ["instagram", "facebook", "linkedin"];

/** Filtros da lista de Conteúdos Postados: mês (principal) + rede + tipo. */
export function ContentPostsFilters({
  month,
  network,
  type,
  typeOptions,
}: {
  month: string;
  network: SocialNetwork | null;
  type: string | null;
  typeOptions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Mês
        <input
          type="month"
          value={month}
          onChange={(e) => update("month", e.target.value)}
          className={SELECT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Rede
        <select
          value={network ?? ""}
          onChange={(e) => update("network", e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Todas</option>
          {NETWORK_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {NETWORKS[n].name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Tipo
        <select
          value={type ?? ""}
          onChange={(e) => update("type", e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Todos</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
