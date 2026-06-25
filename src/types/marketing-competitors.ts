// Tipos do submódulo Concorrentes (mkt_concorrentes) — 100% leitura.
// Origem: tabelas marketing.competitor* populadas pelos workflows n8n.

/** Nome usado pela própria Imbil nas tabelas de busca/tendências (join por texto). */
export const IMBIL_NAME = "IMBIL";

/**
 * Id sintético da própria IMBIL (benchmark). Não existe em marketing.competitors
 * — usado para incluir a IMBIL em seletores/feeds ao lado dos concorrentes.
 */
export const IMBIL_ID = "imbil";

export type Competitor = {
  id: string;
  name: string;
  country: string | null;
  active: boolean | null;
  notes: string | null;
  ig_handle: string | null;
  yt_handle: string | null;
  yt_channel_id: string | null;
  fb_slug: string | null;
  fb_followers: number | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  website_url: string | null;
  profile_updated_at: string | null;
};

/** Linha de marketing.v_competitors_overview. */
export type CompetitorOverview = {
  id: string;
  name: string;
  google_rating: number | null;
  google_reviews_count: number | null;
  active: boolean | null;
  ig_handle: string | null;
  yt_handle: string | null;
  website_url: string | null;
  profile_updated_at: string | null;
  yt_subscribers: number | null;
  yt_views: number | null;
  yt_videos: number | null;
  ig_followers: number | null;
  ig_posts_collected: number | null;
  active_ads: number | null;
  reviews_collected: number | null;
  news_collected: number | null;
};

export type IgPost = {
  id: string;
  competitor_id: string;
  post_id: string;
  username: string | null;
  caption: string | null;
  media_type: string | null;
  published_at: string | null;
  like_count: number | null;
  comments_count: number | null;
  permalink: string | null;
  followers_count: number | null;
  snapshot_date: string;
};

/** Ponto de série temporal de seguidores IG (por concorrente × dia). */
export type FollowersPoint = {
  competitorId: string;
  competitorName: string;
  snapshot_date: string;
  followers: number;
};

export type YoutubeStat = {
  competitor_id: string;
  snapshot_date: string;
  subscriber_count: number | null;
  view_count: number | null;
  video_count: number | null;
};

export type YoutubeVideo = {
  id: string;
  competitor_id: string;
  video_id: string;
  title: string | null;
  description: string | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  thumbnail_url: string | null;
};

export type SubscribersPoint = {
  competitorId: string;
  competitorName: string;
  snapshot_date: string;
  subscribers: number;
};

export type KeywordRanking = {
  data_referencia: string;
  keyword: string;
  competitor_name: string;
  position: number | null;
  url: string | null;
  title: string | null;
};

/** Matriz keyword × empresa (inclui IMBIL) para o heatmap de busca. */
export type KeywordMatrix = {
  date: string | null;
  keywords: string[];
  /** Ordem das colunas (empresas), IMBIL em destaque. */
  competitors: string[];
  /** position[keyword][competitor] = posição no Google (ou null). */
  positions: Record<string, Record<string, number | null>>;
};

export type TrendPoint = {
  data_referencia: string;
  empresa: string;
  keyword: string;
  interest: number | null;
  geo: string | null;
};

/** Série de interesse (Google Trends) por empresa ao longo do tempo. */
export type TrendSeries = {
  empresa: string;
  points: { date: string; interest: number }[];
};

export type CompetitorReview = {
  id: string;
  competitor_id: string;
  review_id: string;
  rating: number | null;
  texto: string | null;
  autor_nome: string | null;
  imagem_autor_url: string | null;
  data_publicacao: string | null;
  url: string | null;
};

export type CompetitorNews = {
  id: string;
  competitor_id: string;
  article_url: string;
  title: string | null;
  published_at: string | null;
  source_name: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
};

export type CompetitorAd = {
  id: string;
  competitor_id: string;
  ad_archive_id: string;
  ad_creative_body: string | null;
  ad_creative_link_caption: string | null;
  ad_delivery_start_time: string | null;
  ad_delivery_stop_time: string | null;
  ad_snapshot_url: string | null;
  funding_entity: string | null;
  page_name: string | null;
  status: string | null;
  platforms: string[] | null;
  snapshot_date: string | null;
};

/** Perfil consolidado de um concorrente (drill-down). */
export type CompetitorProfile = {
  competitor: Competitor;
  overview: CompetitorOverview | null;
  subscribersTrend: SubscribersPoint[];
  followersTrend: FollowersPoint[];
  recentVideos: YoutubeVideo[];
  recentPosts: IgPost[];
  reviews: CompetitorReview[];
  news: CompetitorNews[];
  ads: CompetitorAd[];
  keywordRankings: KeywordRanking[];
};
