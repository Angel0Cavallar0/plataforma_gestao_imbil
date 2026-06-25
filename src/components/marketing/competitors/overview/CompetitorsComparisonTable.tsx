"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatRating } from "@/lib/marketing/competitors";
import { StarRating } from "../shared/StarRating";
import { IMBIL_ID } from "@/types/marketing-competitors";
import type { CompetitorOverview } from "@/types/marketing-competitors";

type SortKey =
  | "name"
  | "google_rating"
  | "google_reviews_count"
  | "ig_followers"
  | "yt_subscribers"
  | "yt_videos"
  | "active_ads";

const BASE = "/modulos/marketing/concorrentes";

function val(r: CompetitorOverview, key: SortKey): number | string | null {
  if (key === "name") return r.name;
  return (r[key] as number | null) ?? null;
}

/** Tabela comparativa principal da Visão Geral, ordenável (Seção 5.2). */
export function CompetitorsComparisonTable({ rows }: { rows: CompetitorOverview[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "yt_subscribers",
    dir: "desc",
  });

  function toggle(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );
  }

  const sorted = [...rows].sort((a, b) => {
    const av = val(a, sort.key);
    const bv = val(b, sort.key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulos por último
    if (bv == null) return -1;
    let cmp: number;
    if (typeof av === "string" && typeof bv === "string") cmp = av.localeCompare(bv);
    else cmp = Number(av) - Number(bv);
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const cols: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "name", label: "Concorrente" },
    { key: "google_rating", label: "Rating Google", align: "right" },
    { key: "google_reviews_count", label: "Reviews", align: "right" },
    { key: "ig_followers", label: "Seguidores IG", align: "right" },
    { key: "yt_subscribers", label: "Inscritos YT", align: "right" },
    { key: "yt_videos", label: "Vídeos YT", align: "right" },
    { key: "active_ads", label: "Anúncios ativos", align: "right" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-4 py-2 font-medium",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(c.key)}
                  className={cn(
                    "inline-flex items-center gap-1 hover:text-foreground",
                    c.align === "right" && "flex-row-reverse",
                    sort.key === c.key ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {c.label}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-2">
                {r.id === IMBIL_ID ? (
                  // IMBIL não tem página de perfil (não é um concorrente coletado).
                  <span className="font-medium">{r.name}</span>
                ) : (
                  <Link
                    href={`${BASE}/${r.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.name}
                  </Link>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                <span className="inline-flex items-center justify-end gap-1.5">
                  {r.google_rating != null && (
                    <StarRating rating={Number(r.google_rating)} size={12} />
                  )}
                  {formatRating(r.google_rating)}
                </span>
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(r.google_reviews_count)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(r.ig_followers)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(r.yt_subscribers)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(r.yt_videos)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatNumber(r.active_ads)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!sorted.length && (
        <p className="p-8 text-center text-muted-foreground">
          Nenhum concorrente monitorado.
        </p>
      )}
    </div>
  );
}
