"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MentionCard } from "@/components/marketing/insights/mentions/MentionCard";
import { mentionPlatformLabel } from "@/lib/constants/marketing-insights";
import type { MentionsData } from "@/types/marketing-insights";

type SortKey = "recent" | "rating";

/** Feed de menções com filtro por plataforma e avaliações (Seção 5.3). */
export function MentionsFeed({ data }: { data: MentionsData }) {
  const [platform, setPlatform] = useState<string>("all");
  const [onlyRated, setOnlyRated] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");

  const platforms = data.byPlatform.map((p) => p.plataforma);

  let list = data.mentions;
  if (platform !== "all") list = list.filter((m) => m.plataforma === platform);
  if (onlyRated) list = list.filter((m) => m.rating != null);

  list = [...list].sort((a, b) => {
    if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
    return (b.data_publicacao ?? "").localeCompare(a.data_publicacao ?? "");
  });

  const chip = (active: boolean) =>
    cn(buttonVariants({ variant: active ? "secondary" : "outline", size: "sm" }), "h-8");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={chip(platform === "all")}
            onClick={() => setPlatform("all")}
          >
            Todas
          </button>
          {platforms.map((p) => (
            <button
              key={p}
              type="button"
              className={chip(platform === p)}
              onClick={() => setPlatform(p)}
            >
              {mentionPlatformLabel(p)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button
            type="button"
            className={chip(onlyRated)}
            onClick={() => setOnlyRated((v) => !v)}
          >
            <Star className="h-3.5 w-3.5" />
            Só avaliações
          </button>
          <button
            type="button"
            className={chip(sort === "rating")}
            onClick={() => setSort((s) => (s === "rating" ? "recent" : "rating"))}
          >
            {sort === "rating" ? "Por nota" : "Por data"}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          Nenhuma menção com os filtros selecionados.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((m) => (
            <MentionCard key={m.id} mention={m} />
          ))}
        </div>
      )}
    </div>
  );
}
