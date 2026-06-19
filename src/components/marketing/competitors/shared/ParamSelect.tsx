"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

/** Select genérico que sincroniza um query param, preservando os demais filtros. */
export function ParamSelect({
  paramKey,
  options,
  allLabel,
  ariaLabel,
  className = "w-48",
}: {
  paramKey: string;
  options: { value: string; label: string }[];
  allLabel: string;
  ariaLabel: string;
  className?: string;
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
      aria-label={ariaLabel}
      className={className}
      value={current}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
