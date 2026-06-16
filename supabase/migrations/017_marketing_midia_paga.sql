-- =========================================================
-- mkt_midia-paga — Gestão de Mídia Paga & Investimentos
-- Submódulo (somente leitura) do Módulo de Marketing.
--
-- Não cria tabelas de insights novas: meta_ads_ad_insights,
-- google_ads_ad_insights e linkedin_ads_creative_insights já
-- existem e são populadas pelos workflows n8n do Carlos.
--
-- Este migration apenas:
--   1) cadastra as plataformas de ads no catálogo marketing.platforms
--   2) cria views normalizadas para a visão geral consolidada
--      (security_invoker → respeitam a RLS das tabelas base)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Catálogo de plataformas de anúncios
-- ---------------------------------------------------------
INSERT INTO marketing.platforms (slug, name, category, icon, color, is_active) VALUES
  ('meta_ads',     'Meta Ads',     'ads', 'facebook', '#1877F2', true),
  ('google_ads',   'Google Ads',   'ads', 'chrome',   '#22C55E', true),
  ('linkedin_ads', 'LinkedIn Ads', 'ads', 'linkedin', '#38BDF8', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------
-- 2.1 View granular unificada (ad/creative × dia)
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW marketing.v_ads_daily
WITH (security_invoker = on) AS
-- META
SELECT
  'meta_ads'::text       AS platform_slug,
  ad_id::text            AS external_ad_id,
  campaign_id::text      AS external_campaign_id,
  campaign_name,
  adset_id::text         AS external_group_id,
  adset_name             AS group_name,
  ad_name,
  ad_type,
  data_referencia,
  impressions,
  reach,
  clicks,
  ctr,
  cpc,
  cpm,
  spend::numeric         AS spend,
  COALESCE(leads, pixel_lead, 0)::int                    AS conversions,
  COALESCE(conversion_value, purchase_value, lead_value) AS conversions_value,
  landing_page_views,
  coletado_em
FROM marketing.meta_ads_ad_insights

UNION ALL
-- GOOGLE
SELECT
  'google_ads',
  ad_id::text,
  campaign_id::text,
  campaign_name,
  adgroup_id::text,
  adgroup_name,
  ad_name,
  ad_type,
  data_referencia,
  impressions,
  NULL::int              AS reach,
  clicks,
  ctr,
  cpc,
  average_cpm            AS cpm,
  cost                   AS spend,
  conversions::int,
  conversions_value,
  NULL::int              AS landing_page_views,
  coletado_em
FROM marketing.google_ads_ad_insights

UNION ALL
-- LINKEDIN
SELECT
  'linkedin_ads',
  creative_id::text,
  campaign_id::text,
  campaign_name,
  campaign_group_id::text,
  campaign_group_name,
  creative_name,
  ad_format,
  data_referencia,
  impressions,
  reach,
  clicks,
  ctr,
  cpc,
  cpm,
  spend,
  lead_gen_submissions::int,
  NULL::numeric          AS conversions_value,
  NULL::int              AS landing_page_views,
  coletado_em
FROM marketing.linkedin_ads_creative_insights;

-- ---------------------------------------------------------
-- 2.2 View agregada por campanha × dia (métricas derivadas)
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW marketing.v_campaigns_daily
WITH (security_invoker = on) AS
SELECT
  platform_slug,
  external_campaign_id,
  campaign_name,
  data_referencia,
  SUM(impressions)                                   AS impressions,
  SUM(reach)                                         AS reach,
  SUM(clicks)                                        AS clicks,
  SUM(spend)                                         AS spend,
  SUM(conversions)                                   AS conversions,
  SUM(conversions_value)                             AS conversions_value,
  CASE WHEN SUM(impressions) > 0
       THEN ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2) END  AS ctr_pct,
  CASE WHEN SUM(clicks) > 0
       THEN ROUND(SUM(spend) / SUM(clicks), 2) END                          AS cpc_calc,
  CASE WHEN SUM(impressions) > 0
       THEN ROUND((SUM(spend) / SUM(impressions)) * 1000, 2) END            AS cpm_calc,
  CASE WHEN SUM(conversions) > 0
       THEN ROUND(SUM(spend) / SUM(conversions), 2) END                     AS cost_per_conversion,
  CASE WHEN SUM(clicks) > 0
       THEN ROUND((SUM(conversions)::numeric / SUM(clicks)) * 100, 2) END   AS conversion_rate_pct,
  CASE WHEN SUM(spend) > 0 AND SUM(conversions_value) > 0
       THEN ROUND(SUM(conversions_value) / SUM(spend), 2) END               AS roas
FROM marketing.v_ads_daily
GROUP BY platform_slug, external_campaign_id, campaign_name, data_referencia;

-- ---------------------------------------------------------
-- 2.3 View consolidada por plataforma (KPI cards / split)
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW marketing.v_platforms_summary
WITH (security_invoker = on) AS
SELECT
  platform_slug,
  COUNT(DISTINCT external_campaign_id)               AS campaigns_total,
  SUM(impressions)                                   AS impressions,
  SUM(clicks)                                        AS clicks,
  SUM(spend)                                         AS spend,
  SUM(conversions)                                   AS conversions,
  SUM(conversions_value)                             AS conversions_value,
  MIN(data_referencia)                               AS first_date,
  MAX(data_referencia)                               AS last_date
FROM marketing.v_ads_daily
GROUP BY platform_slug;

-- ---------------------------------------------------------
-- 3. Grants (PostgREST consome via role authenticated)
--    A RLS efetiva continua nas tabelas base (security_invoker).
-- ---------------------------------------------------------
GRANT SELECT ON marketing.v_ads_daily        TO authenticated, service_role;
GRANT SELECT ON marketing.v_campaigns_daily  TO authenticated, service_role;
GRANT SELECT ON marketing.v_platforms_summary TO authenticated, service_role;
