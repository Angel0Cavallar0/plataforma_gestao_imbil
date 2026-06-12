-- Facebook post insights + cross-post links (synced from Meta; idempotent with production).

CREATE TABLE IF NOT EXISTS marketing.facebook_post_insights (
  post_id text NOT NULL,
  data_referencia date NOT NULL,
  published_at timestamptz,
  permalink text,
  message text,
  post_type text,
  reach integer DEFAULT 0,
  impressions integer,
  engaged_users integer DEFAULT 0,
  reactions_total integer DEFAULT 0,
  reactions_like integer DEFAULT 0,
  reactions_love integer DEFAULT 0,
  reactions_haha integer DEFAULT 0,
  reactions_wow integer DEFAULT 0,
  reactions_sad integer DEFAULT 0,
  reactions_angry integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  clicks integer DEFAULT 0,
  video_views integer DEFAULT 0,
  video_views_organic integer DEFAULT 0,
  video_views_paid integer DEFAULT 0,
  video_complete_views integer DEFAULT 0,
  video_avg_watch_time numeric,
  is_boosted boolean NOT NULL DEFAULT false,
  ad_spend numeric DEFAULT 0,
  ad_impressions integer DEFAULT 0,
  ad_reach integer DEFAULT 0,
  coletado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, data_referencia)
);

CREATE TABLE IF NOT EXISTS marketing.cross_post_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_post_id text NOT NULL,
  instagram_media_id text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  match_method text NOT NULL DEFAULT 'manual'
);

ALTER TABLE marketing.facebook_post_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.cross_post_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_read_facebook_post_insights ON marketing.facebook_post_insights;
CREATE POLICY authenticated_read_facebook_post_insights ON marketing.facebook_post_insights
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS authenticated_read_cross_post_links ON marketing.cross_post_links;
CREATE POLICY authenticated_read_cross_post_links ON marketing.cross_post_links
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
