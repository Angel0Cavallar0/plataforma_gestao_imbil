export type PostStatus =
  | "rascunho"
  | "agendado"
  | "publicando"
  | "publicado"
  | "falhou"
  | "cancelado";

export type ContentType =
  | "imagem"
  | "video"
  | "carrossel"
  | "reels"
  | "story"
  | "texto"
  | "link";

export type Platform = {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  color: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  campaign_id: string | null;
  platform_id: string;
  credential_id: string | null;
  title: string;
  content_type: ContentType;
  copy: string | null;
  hashtags: string[] | null;
  cta_url: string | null;
  scheduled_at: string;
  published_at: string | null;
  timezone: string;
  status: PostStatus;
  external_post_id: string | null;
  external_post_url: string | null;
  external_container_id: string | null;
  publish_attempts: number;
  last_error_message: string | null;
  last_error_code: string | null;
  last_error_at: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  post_id: string;
  asset_type: "image" | "video";
  storage_path: string;
  public_url: string | null;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_sec: number | null;
  display_order: number;
  alt_text: string | null;
  created_at: string;
};

export type AssetWithPreview = Asset & {
  preview_url: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type IntegrationCredential = {
  id: string;
  platform_id: string;
  label: string;
  external_account_id: string | null;
  external_account_name: string | null;
  credentials: MetaCredentialsJson;
  scopes: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  last_validated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MetaCredentialsJson = {
  app_id?: string;
  facebook_page_id?: string;
  instagram_user_id?: string;
  app_secret_ref?: string;
  system_user_token_ref?: string;
};

export type PostWithRelations = Post & {
  platform: Pick<Platform, "slug" | "name" | "icon" | "color">;
  campaign: Pick<Campaign, "id" | "name" | "color"> | null;
  assigned_to_profile: { full_name: string; avatar_url: string | null } | null;
  assets: AssetWithPreview[];
};

export type CalendarEventSource = "content_post" | "instagram_media";

export type CalendarEventStatus = PostStatus | "instagram_publicado";

export type CalendarPostEvent = {
  id: string;
  title: string;
  start: string;
  status: CalendarEventStatus;
  eventSource: CalendarEventSource;
  platformSlug: string;
  platformName: string;
  platformColor: string | null;
  campaignColor: string | null;
  /** Present for content_post — used to dedupe against instagram media_id */
  externalPostId?: string | null;
};

export type InstagramMediaInsightRow = {
  media_id: string;
  data_referencia: string;
  media_type: string;
  media_product_type: string | null;
  published_at: string | null;
  permalink: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  impressions: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  plays: number | null;
  replies: number | null;
  exits: number | null;
  taps_forward: number | null;
  taps_back: number | null;
  is_boosted: boolean | null;
  ad_spend: number | null;
  ad_impressions: number | null;
  ad_reach: number | null;
  coletado_em: string | null;
};

export type InstagramCarouselChild = {
  child_media_id: string;
  parent_media_id: string;
  position: number;
  media_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  coletado_em: string | null;
};

export type InstagramMediaComment = {
  id: string;
  text: string;
  timestamp: string;
  like_count?: number;
  username?: string;
  from?: { id: string; username?: string };
  replies?: InstagramMediaComment[];
};

export type ContentKpis = {
  scheduledNext7d: number;
  publishedLast30d: number;
  drafts: number;
  failedUnresolved: number;
};
