"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MentionCard } from "@/components/marketing/insights/mentions/MentionCard";
import { mentionPlatformLabel } from "@/lib/constants/marketing-insights";
import { setMentionRespondedAction } from "@/server/actions/marketing/mentions";
import type { BrandMention, MentionsData } from "@/types/marketing-insights";

type SortKey = "recent" | "rating";

/** Feed de menções (cards resumidos + pop-up) com filtros e marcação de respondido. */
export function MentionsFeed({ data }: { data: MentionsData }) {
  const [platform, setPlatform] = useState<string>("all");
  const [onlyRated, setOnlyRated] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Estado local (reflete o "respondido" sem refetch). Ressincroniza ao mudar a prop.
  const [items, setItems] = useState<BrandMention[]>(data.mentions);
  const dataKey = `${data.mentions.length}:${data.mentions[0]?.id ?? ""}`;
  const [prevKey, setPrevKey] = useState(dataKey);
  if (dataKey !== prevKey) {
    setPrevKey(dataKey);
    setItems(data.mentions);
  }

  const platforms = data.byPlatform.map((p) => p.plataforma);

  let list = items;
  if (platform !== "all") list = list.filter((m) => m.plataforma === platform);
  if (onlyRated) list = list.filter((m) => m.rating != null);
  if (onlyPending) list = list.filter((m) => !m.respondida);

  list = [...list].sort((a, b) => {
    if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
    return (b.data_publicacao ?? "").localeCompare(a.data_publicacao ?? "");
  });

  function toggleResponded(id: string, next: boolean) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, respondida: next } : m)));
    setPendingId(id);
    startTransition(async () => {
      const res = await setMentionRespondedAction(id, next);
      setPendingId(null);
      if (res.ok) {
        toast.success(next ? "Marcada como respondida." : "Marcada como pendente.");
      } else {
        setItems((prev) =>
          prev.map((m) => (m.id === id ? { ...m, respondida: !next } : m)),
        );
        toast.error(res.error ?? "Não foi possível atualizar.");
      }
    });
  }

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
            className={chip(onlyPending)}
            onClick={() => setOnlyPending((v) => !v)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pendentes
          </button>
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
            <MentionCard
              key={m.id}
              mention={m}
              onToggleResponded={toggleResponded}
              pending={pendingId === m.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
