-- =========================================================
-- mkt_concorrentes — Análise de Concorrentes
-- Submódulo (100% somente leitura) do Módulo de Marketing.
--
-- As tabelas competitor* já existem e são populadas pelos
-- workflows n8n do Carlos. Este migration apenas:
--   1) cria a view consolidada v_competitors_overview
--      (security_invoker → respeita a RLS das tabelas base)
--   2) concede SELECT da view a authenticated/service_role
--   3) completa o padrão de RLS de leitura: 5 das 8 tabelas
--      competitor* já tinham RLS + policy de SELECT; aqui as
--      4 restantes (ig_posts, keyword_rankings, reviews, trends)
--      recebem o mesmo padrão. Apenas SELECT para authenticated;
--      a escrita continua exclusiva do service role (n8n), que
--      ignora RLS. Submódulo não escreve nada.
-- =========================================================

-- ---------------------------------------------------------
-- 1. View consolidada por concorrente (Visão Geral)
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW marketing.v_competitors_overview
WITH (security_invoker = on) AS
SELECT
  c.id,
  c.name,
  c.google_rating,
  c.google_reviews_count,
  c.active,
  c.ig_handle,
  c.yt_handle,
  c.website_url,
  c.profile_updated_at,
  (SELECT yt.subscriber_count FROM marketing.competitor_youtube_stats yt
    WHERE yt.competitor_id = c.id ORDER BY yt.snapshot_date DESC LIMIT 1)  AS yt_subscribers,
  (SELECT yt.view_count FROM marketing.competitor_youtube_stats yt
    WHERE yt.competitor_id = c.id ORDER BY yt.snapshot_date DESC LIMIT 1)  AS yt_views,
  (SELECT yt.video_count FROM marketing.competitor_youtube_stats yt
    WHERE yt.competitor_id = c.id ORDER BY yt.snapshot_date DESC LIMIT 1)  AS yt_videos,
  (SELECT ig.followers_count FROM marketing.competitor_ig_posts ig
    WHERE ig.competitor_id = c.id AND ig.followers_count IS NOT NULL
    ORDER BY ig.snapshot_date DESC LIMIT 1)                                AS ig_followers,
  (SELECT COUNT(*) FROM marketing.competitor_ig_posts ig
    WHERE ig.competitor_id = c.id)                                         AS ig_posts_collected,
  (SELECT COUNT(*) FROM marketing.competitor_ads a
    WHERE a.competitor_id = c.id AND a.status = 'ACTIVE')                  AS active_ads,
  (SELECT COUNT(*) FROM marketing.competitor_reviews r
    WHERE r.competitor_id = c.id)                                          AS reviews_collected,
  (SELECT COUNT(*) FROM marketing.competitor_news n
    WHERE n.competitor_id = c.id)                                         AS news_collected
FROM marketing.competitors c
WHERE c.active = true;

GRANT SELECT ON marketing.v_competitors_overview TO authenticated, service_role;

-- ---------------------------------------------------------
-- 2. RLS de leitura para as 4 tabelas restantes
--    (padrão já aplicado nas outras: SELECT para marketing.read)
-- ---------------------------------------------------------
ALTER TABLE marketing.competitor_ig_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.competitor_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.competitor_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.competitor_trends          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competitor_ig_posts_select ON marketing.competitor_ig_posts;
CREATE POLICY competitor_ig_posts_select ON marketing.competitor_ig_posts
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'marketing', 'read'));

DROP POLICY IF EXISTS competitor_keyword_rankings_select ON marketing.competitor_keyword_rankings;
CREATE POLICY competitor_keyword_rankings_select ON marketing.competitor_keyword_rankings
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'marketing', 'read'));

DROP POLICY IF EXISTS competitor_reviews_select ON marketing.competitor_reviews;
CREATE POLICY competitor_reviews_select ON marketing.competitor_reviews
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'marketing', 'read'));

DROP POLICY IF EXISTS competitor_trends_select ON marketing.competitor_trends;
CREATE POLICY competitor_trends_select ON marketing.competitor_trends
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'marketing', 'read'));

NOTIFY pgrst, 'reload schema';
