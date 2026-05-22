-- Instagram insights tables (synced from Meta; idempotent with production).

CREATE TABLE IF NOT EXISTS marketing.instagram_organic_insights (
  data_referencia date PRIMARY KEY,
  impressions integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  profile_views integer NOT NULL DEFAULT 0,
  website_clicks integer NOT NULL DEFAULT 0,
  followers_count integer NOT NULL DEFAULT 0,
  media_count integer NOT NULL DEFAULT 0,
  coletado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.instagram_media_insights (
  media_id text NOT NULL,
  data_referencia date NOT NULL,
  media_type text NOT NULL,
  media_product_type text,
  published_at timestamptz,
  permalink text,
  media_url text,
  thumbnail_url text,
  caption text,
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  saves integer DEFAULT 0,
  shares integer DEFAULT 0,
  plays integer DEFAULT 0,
  replies integer DEFAULT 0,
  exits integer DEFAULT 0,
  taps_forward integer DEFAULT 0,
  taps_back integer DEFAULT 0,
  is_boosted boolean DEFAULT false,
  ad_spend numeric DEFAULT 0,
  ad_impressions integer DEFAULT 0,
  ad_reach integer DEFAULT 0,
  coletado_em timestamptz DEFAULT now(),
  PRIMARY KEY (media_id, data_referencia)
);

CREATE TABLE IF NOT EXISTS marketing.instagram_carousel_children (
  child_media_id text PRIMARY KEY,
  parent_media_id text NOT NULL,
  position integer NOT NULL,
  media_type text NOT NULL,
  media_url text,
  thumbnail_url text,
  coletado_em timestamptz DEFAULT now()
);

ALTER TABLE marketing.instagram_organic_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.instagram_media_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.instagram_carousel_children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_read_instagram_organic ON marketing.instagram_organic_insights;
CREATE POLICY authenticated_read_instagram_organic ON marketing.instagram_organic_insights
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS authenticated_read_instagram_media ON marketing.instagram_media_insights;
CREATE POLICY authenticated_read_instagram_media ON marketing.instagram_media_insights
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS authenticated_read_carousel_children ON marketing.instagram_carousel_children;
CREATE POLICY authenticated_read_carousel_children ON marketing.instagram_carousel_children
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
