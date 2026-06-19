/**
 * Tipos do submódulo mkt_insights (Insights e Relatórios).
 *
 * Submódulo majoritariamente somente leitura sobre tabelas populadas
 * pelos workflows n8n. Espelha as tabelas de insights orgânicos, YouTube,
 * Google Analytics, menções à marca e os relatórios de IA
 * (marketing.marketing_reports).
 */

// ---------------------------------------------------------------------------
// Filtros / período
// ---------------------------------------------------------------------------

export type InsightsFilters = {
  date_from: string; // ISO yyyy-mm-dd
  date_to: string; // ISO yyyy-mm-dd
};

/** Granularidade do gráfico de ganho de seguidores (toggle client-side). */
export type Granularity = "day" | "week" | "month";

// ---------------------------------------------------------------------------
// Redes sociais (orgânico)
// ---------------------------------------------------------------------------

export type SocialNetwork = "instagram" | "facebook" | "linkedin";

/** Resumo por rede no período (cards da visão geral). */
export type NetworkOverview = {
  network: SocialNetwork;
  /** Total cumulativo de seguidores no fim do período. */
  followers: number | null;
  /** Ganho líquido de seguidores no período. */
  followers_delta: number | null;
  reach: number;
  impressions: number;
  /** likes + comments + shares no período. */
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  /** nº de posts impulsionados no período. */
  boosted_posts: number;
};

/** Linha bruta da view marketing.v_followers_history (filtrada por período). */
export type FollowersHistoryRow = {
  network: SocialNetwork;
  data_referencia: string;
  total_followers: number | null;
  followers_gained: number | null;
};

/** Post orgânico (Instagram ou Facebook) já agregado por post no período. */
export type SocialPost = {
  network: "instagram" | "facebook";
  id: string;
  permalink: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  media_type: string | null;
  published_at: string | null;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  plays: number;
  reactions: number;
  clicks: number;
  is_boosted: boolean;
  ad_spend: number | null;
  ad_impressions: number | null;
  ad_reach: number | null;
};

/** KPIs específicos de uma rede (aba por rede). */
export type NetworkDetail = {
  network: SocialNetwork;
  followers: number | null;
  followers_delta: number | null;
  reach: number;
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  /** Apenas Instagram. */
  profile_views?: number | null;
  /** Demografia (apenas Instagram, quando disponível). */
  follower_demographics?: unknown | null;
};

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

export type YouTubeStats = {
  snapshot_date: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
};

export type YouTubeVideo = {
  video_id: string;
  title: string | null;
  published_at: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  thumbnail_url: string | null;
};

export type YouTubeData = {
  latest: YouTubeStats | null;
  history: YouTubeStats[];
  videos: YouTubeVideo[];
};

// ---------------------------------------------------------------------------
// Acessos do site (Google Analytics)
// ---------------------------------------------------------------------------

export type SiteDailyRow = {
  data_referencia: string;
  sessions: number;
  engaged_sessions: number;
  bounce_rate: number | null;
  avg_session_duration: number | null;
  screen_page_views: number;
  new_users: number;
  total_users: number;
  key_events: number;
};

export type SiteTopPage = {
  page_path: string;
  page_title: string | null;
  screen_page_views: number;
  avg_engagement_time: number | null;
  key_events: number;
};

export type SiteTrafficSource = {
  channel: string;
  sessions: number;
  engaged_sessions: number;
  new_users: number;
};

export type SiteAnalytics = {
  daily: SiteDailyRow[];
  topPages: SiteTopPage[];
  sources: SiteTrafficSource[];
  /** GA tem histórico curto hoje — sinaliza aviso na UI. */
  daysCovered: number;
};

// ---------------------------------------------------------------------------
// Menções à marca
// ---------------------------------------------------------------------------

export type BrandMention = {
  id: string;
  plataforma: string;
  autor_nome: string | null;
  autor_urn: string | null;
  texto: string | null;
  url: string | null;
  imagem_post_url: string | null;
  imagem_autor_url: string | null;
  data_publicacao: string | null;
  rating: number | null;
};

export type MentionsData = {
  mentions: BrandMention[];
  total: number;
  byPlatform: { plataforma: string; count: number }[];
  /** Avaliações Google Meu Negócio (rating não nulo). */
  ratingsAvg: number | null;
  ratingsCount: number;
  ratingDistribution: { stars: number; count: number }[];
};

// ---------------------------------------------------------------------------
// Relatórios de IA (marketing.marketing_reports → report_json)
// ---------------------------------------------------------------------------

export type ReportTipo =
  | "on_demand"
  | "weekly_auto"
  | "weekly_on_demand"
  | "month_auto"
  | "month_on_demand";
export type ReportScope =
  | "redes_sociais"
  | "midia_paga"
  | "midia_paga_insights"
  | "geral";

/** Referência a um post/anúncio dentro do report_json (top_post/top_posts). */
export type ReportEntityRef = {
  id?: string;
  link?: string;
  tipo?: string;
  reach?: number;
  is_boosted?: boolean;
  engajamento?: number;
  plataforma?: string;
  caption_preview?: string;
};

export type OrganicNetworkReport = {
  top_post?: ReportEntityRef;
  taxa_engajamento?: number;
  // Instagram
  reach?: number;
  impressions?: number;
  interacoes?: number;
  followers_ganhos?: number;
  // Facebook
  fans_total?: number;
  fans_ganhos?: number;
  fans_perdidos?: number;
  engaged_total?: number;
  page_views_total?: number;
  // LinkedIn
  followers_total?: number;
  impressoes?: number;
  engajamento_total?: number;
};

export type MelhorCampanha = {
  nome?: string;
  custo?: number;
  objetivo?: string;
  campaign_id?: string;
  ad_id?: string;
  adset_id?: string;
  creative_id?: string;
  adgroup_id?: string;
  campaign_group_id?: string;
  resultado_principal?: number;
};

export type PaidPlatformReport = {
  cpc?: number;
  ctr?: number;
  custo?: number;
  leads?: number;
  cliques?: number;
  conversoes?: number;
  impressoes?: number;
  melhor_campanha?: MelhorCampanha;
};

export type GastoTotal = {
  meta?: number;
  google?: number;
  linkedin?: number;
  total?: number;
};

export type ComparativoPeriodo = {
  site_sessoes_delta_pct?: number | null;
  meta_ads_spend_delta_pct?: number | null;
  google_ads_cost_delta_pct?: number | null;
  instagram_reach_delta_pct?: number | null;
  linkedin_impressoes_delta_pct?: number | null;
  facebook_engajamento_delta_pct?: number | null;
};

export type ReportSite = {
  sessoes?: number;
  pageviews?: number;
  key_events?: number;
  bounce_rate?: number;
  duracao_media?: number;
  novos_usuarios?: number;
  canal_principal?: string;
  top_pagina?: { path?: string; views?: number; titulo?: string };
};

export type ReportAlerta = {
  titulo?: string;
  urgencia?: "baixa" | "media" | "alta";
  descricao?: string;
};

export type ReportRecomendacao = {
  acao?: string;
  justificativa?: string;
  metrica_base?: string;
};

export type ReportJson = {
  periodo?: { inicio?: string; fim?: string };
  resumo?: string;
  gasto_total?: GastoTotal;
  organico?: {
    instagram?: OrganicNetworkReport;
    facebook?: OrganicNetworkReport;
    linkedin?: OrganicNetworkReport;
  };
  pago?: {
    meta_ads?: PaidPlatformReport;
    google_ads?: PaidPlatformReport;
    linkedin_ads?: PaidPlatformReport;
  };
  site?: ReportSite;
  top_posts?: ReportEntityRef[];
  destaques?: string[];
  alertas?: ReportAlerta[];
  recomendacoes?: ReportRecomendacao[];
  comparativo_periodo_anterior?: ComparativoPeriodo;
};

/** Uma linha de marketing.marketing_reports. */
export type MarketingReport = {
  id: string;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  tipo: ReportTipo;
  report_markdown: string | null;
  report_json: ReportJson | null;
  model: string | null;
  gerado_em: string;
};

/** Item resumido para o seletor de relatórios. */
export type ReportListItem = {
  id: string;
  tipo: ReportTipo;
  model: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  gerado_em: string;
};

// ---------------------------------------------------------------------------
// Enriquecimento de entidades do relatório (6-B)
// ---------------------------------------------------------------------------

export type EnrichedPost = {
  id: string;
  network: "instagram" | "facebook";
  media_type: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  plays: number;
  reactions: number;
  clicks: number;
  is_boosted: boolean;
  ad_spend: number | null;
};

export type EnrichedAd = {
  ad_id: string;
  campaign_name: string | null;
  ad_name: string | null;
  thumbnail_url: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
};

export type ReportEnrichment = {
  posts: Record<string, EnrichedPost>;
  ads: Record<string, EnrichedAd>;
};
