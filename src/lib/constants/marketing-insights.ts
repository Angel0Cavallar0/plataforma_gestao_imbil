import type { ReportTipo, SocialNetwork } from "@/types/marketing-insights";

/** Abas internas do submódulo Insights (navegação primária no topo). */
export const INSIGHTS_TABS = [
  { label: "Redes Sociais", href: "/modulos/marketing/insights/redes-sociais" },
  { label: "Mídia Paga", href: "/modulos/marketing/insights/midia-paga" },
  {
    label: "Mídia Paga Insights",
    href: "/modulos/marketing/insights/midia-paga-insights",
  },
  { label: "YouTube", href: "/modulos/marketing/insights/youtube" },
  { label: "Acessos do Site", href: "/modulos/marketing/insights/site" },
  { label: "Menções à Marca", href: "/modulos/marketing/insights/mencoes" },
] as const;

type NetworkMeta = {
  slug: SocialNetwork;
  name: string;
  /** Cor de marca usada em gráficos/legendas. */
  color: string;
};

/** Redes sociais orgânicas (ordem de exibição). */
export const NETWORKS: Record<SocialNetwork, NetworkMeta> = {
  instagram: { slug: "instagram", name: "Instagram", color: "#E1306C" },
  facebook: { slug: "facebook", name: "Facebook", color: "#1877F2" },
  linkedin: { slug: "linkedin", name: "LinkedIn", color: "#0A66C2" },
};

export const NETWORK_SLUGS: readonly SocialNetwork[] = [
  "instagram",
  "facebook",
  "linkedin",
] as const;

export const YOUTUBE_COLOR = "#FF0000";

/** Rótulos amigáveis do tipo de relatório. */
export const REPORT_TIPO_LABELS: Record<ReportTipo, string> = {
  on_demand: "Sob demanda",
  weekly_auto: "Semanal (auto)",
  month_auto: "Mensal (auto)",
};

/** Severidade dos alertas → variante de Badge. */
export const ALERT_URGENCIA_VARIANT: Record<
  "baixa" | "media" | "alta",
  "muted" | "warning" | "destructive"
> = {
  baixa: "muted",
  media: "warning",
  alta: "destructive",
};

export const ALERT_URGENCIA_LABEL: Record<"baixa" | "media" | "alta", string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

/** Plataformas de menção → rótulo + cor. */
export const MENTION_PLATFORMS: Record<string, { label: string; color: string }> = {
  google_maps: { label: "Google Meu Negócio", color: "#34A853" },
  google_news: { label: "Google Notícias", color: "#4285F4" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  instagram: { label: "Instagram", color: "#E1306C" },
  facebook: { label: "Facebook", color: "#1877F2" },
  twitter: { label: "X / Twitter", color: "#111827" },
  youtube: { label: "YouTube", color: "#FF0000" },
};

export function mentionPlatformLabel(slug: string): string {
  return MENTION_PLATFORMS[slug]?.label ?? slug;
}

export function mentionPlatformColor(slug: string): string {
  return MENTION_PLATFORMS[slug]?.color ?? "#64748b";
}

/** Limite global de relatórios por dia (Seção 8.2). */
export const DAILY_REPORT_LIMIT = 3;

/** Tipo de mídia do Instagram → rótulo. */
export const IG_MEDIA_TYPE_LABELS: Record<string, string> = {
  IMAGE: "Imagem",
  VIDEO: "Vídeo",
  CAROUSEL_ALBUM: "Carrossel",
  REEL: "Reels",
};
