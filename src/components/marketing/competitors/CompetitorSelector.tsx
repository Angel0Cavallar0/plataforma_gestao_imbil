"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

type Option = { id: string; name: string };

/**
 * Filtro de concorrente compartilhado entre as abas. Atualiza o query param
 * `competitor` preservando os demais filtros. Valor vazio = todos.
 */
export function CompetitorSelector({
  competitors,
  paramKey = "competitor",
  allLabel = "Todos os concorrentes",
}: {
  competitors: Option[];
  paramKey?: string;
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.get(paramKey) ?? "";

  function onChange(value: string) {
    const params = new URLSearchParams(search.toString());
    if (value) params.set(paramKey, value);
    else params.delete(paramKey);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select
      aria-label="Filtrar por concorrente"
      className="w-60"
      value={current}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{allLabel}</option>
      {competitors.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
