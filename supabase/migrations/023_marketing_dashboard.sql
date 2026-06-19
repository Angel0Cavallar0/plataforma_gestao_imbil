-- =========================================================
-- mkt_dashboard — Dashboard de Marketing (visão executiva)
--
-- Este migration adiciona o suporte de banco para o Dashboard
-- de Marketing (rota /dashboards/marketing). Não cria dados
-- novos de negócio: apenas consome o que os submódulos já
-- produzem. Duas partes:
--
--   1) Tabela marketing.alert_rules — regras de alerta
--      configuráveis pelo usuário (performance e data) + RLS.
--   2) Sete funções de agregação dashboard_*_kpis(p_from, p_to)
--      que devolvem um jsonb com os KPIs já calculados de cada
--      categoria. SECURITY INVOKER + STABLE → respeitam a RLS
--      das tabelas base e podem ser cacheadas pelo planner.
--
-- A página chama as 7 funções em paralelo (uma vez para o
-- período atual e outra para o período anterior, para os deltas).
-- =========================================================

-- ---------------------------------------------------------
-- 1. Regras de alerta configuráveis
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing.alert_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  rule_type     text NOT NULL CHECK (rule_type IN ('performance','date')),

  -- Regras de performance (variação de métrica)
  source        text,                      -- meta_ads, google_ads, linkedin_ads, instagram, ...
  metric        text,                      -- spend, ctr, cpc, reach, followers, leads, ...
  direction     text CHECK (direction IN ('increase','decrease','any')),
  threshold_pct numeric,                   -- ex: 30 = dispara se variar 30%+
  period_window text DEFAULT 'day',        -- day | week | month (janela de comparação)

  -- Regras de data (datas relevantes)
  event_date    date,                      -- data relevante (feira, campanha, sazonalidade)
  remind_days_before int DEFAULT 7,        -- avisar X dias antes

  -- Comum
  severity      text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  is_active     boolean NOT NULL DEFAULT true,
  notify_channel text,                     -- (futuro) email/whatsapp; MVP só exibe no dashboard
  created_by    uuid NOT NULL REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active_type
  ON marketing.alert_rules (is_active, rule_type);

DROP TRIGGER IF EXISTS trg_alert_rules_updated_at ON marketing.alert_rules;
CREATE TRIGGER trg_alert_rules_updated_at
  BEFORE UPDATE ON marketing.alert_rules
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

ALTER TABLE marketing.alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_rules_select" ON marketing.alert_rules;
CREATE POLICY "alert_rules_select" ON marketing.alert_rules FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(),'marketing','read'));

DROP POLICY IF EXISTS "alert_rules_write" ON marketing.alert_rules;
CREATE POLICY "alert_rules_write" ON marketing.alert_rules FOR ALL TO authenticated
  USING (public.current_user_role_level() >= 60)         -- gestor+
  WITH CHECK (public.current_user_role_level() >= 60);

GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.alert_rules TO authenticated;
GRANT ALL ON marketing.alert_rules TO service_role;

-- ---------------------------------------------------------
-- 2. Funções de agregação por categoria
-- ---------------------------------------------------------

-- 2.1 Performance de Conteúdo
CREATE OR REPLACE FUNCTION marketing.dashboard_content_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH pub AS (
    SELECT COUNT(*) AS n FROM marketing.content_posts
     WHERE status = 'publicado' AND published_at::date BETWEEN p_from AND p_to
  ),
  eng AS (
    SELECT
        COALESCE((SELECT SUM(total_interactions) FROM marketing.instagram_organic_insights
                   WHERE data_referencia BETWEEN p_from AND p_to), 0)
      + COALESCE((SELECT SUM(likes + comments + shares) FROM marketing.linkedin_page_insights
                   WHERE data_referencia BETWEEN p_from AND p_to), 0)
      + COALESCE((SELECT SUM(engaged_users) FROM marketing.facebook_page_insights
                   WHERE data_referencia BETWEEN p_from AND p_to), 0) AS total
  )
  SELECT jsonb_build_object(
    'posts_publicados', (SELECT n FROM pub),
    'posts_agendados', (SELECT COUNT(*) FROM marketing.content_posts
                         WHERE status = 'agendado' AND scheduled_at::date >= CURRENT_DATE),
    'seguidores_total',
        COALESCE((SELECT followers_count FROM marketing.instagram_organic_insights
                   ORDER BY data_referencia DESC LIMIT 1), 0)
      + COALESCE((SELECT fans FROM marketing.facebook_page_insights
                   ORDER BY data_referencia DESC LIMIT 1), 0)
      + COALESCE((SELECT followers_count FROM marketing.linkedin_page_insights
                   ORDER BY data_referencia DESC LIMIT 1), 0),
    'seguidores_ganhos', COALESCE((SELECT SUM(followers_gained) FROM marketing.v_followers_history
                                    WHERE data_referencia BETWEEN p_from AND p_to), 0),
    'alcance_organico',
        COALESCE((SELECT SUM(reach) FROM marketing.instagram_organic_insights
                   WHERE data_referencia BETWEEN p_from AND p_to), 0)
      + COALESCE((SELECT SUM(reach) FROM marketing.facebook_page_insights
                   WHERE data_referencia BETWEEN p_from AND p_to), 0),
    'engajamento_medio', CASE WHEN (SELECT n FROM pub) = 0 THEN 0
                              ELSE ROUND((SELECT total FROM eng)::numeric / (SELECT n FROM pub), 1) END
  );
$$;

-- 2.2 Mídia Paga
CREATE OR REPLACE FUNCTION marketing.dashboard_paid_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH agg AS (
    SELECT
      COALESCE(SUM(spend), 0)              AS spend,
      COALESCE(SUM(impressions), 0)        AS impressions,
      COALESCE(SUM(clicks), 0)             AS clicks,
      COALESCE(SUM(conversions), 0)        AS conversions,
      COALESCE(SUM(conversions_value), 0)  AS conversions_value
    FROM marketing.v_campaigns_daily
    WHERE data_referencia BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'spend', spend,
    'impressions', impressions,
    'clicks', clicks,
    'conversions', conversions,
    'ctr', CASE WHEN impressions = 0 THEN 0 ELSE ROUND(clicks::numeric / impressions * 100, 2) END,
    'cpc', CASE WHEN clicks = 0 THEN 0 ELSE ROUND(spend / clicks, 2) END,
    'cpm', CASE WHEN impressions = 0 THEN 0 ELSE ROUND(spend / impressions * 1000, 2) END,
    'cost_per_result', CASE WHEN conversions = 0 THEN 0 ELSE ROUND(spend / conversions, 2) END,
    'roas', CASE WHEN spend = 0 THEN 0 ELSE ROUND(conversions_value / spend, 2) END
  ) FROM agg;
$$;

-- 2.3 Investimento Geral (ads + eventos)
CREATE OR REPLACE FUNCTION marketing.dashboard_investment_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH ads AS (
    SELECT COALESCE(SUM(spend), 0) AS spend,
           COALESCE(SUM(conversions), 0) AS conv,
           COALESCE(SUM(conversions_value), 0) AS val
    FROM marketing.v_campaigns_daily
    WHERE data_referencia BETWEEN p_from AND p_to
  ),
  ev_cost AS (
    SELECT COALESCE(SUM(amount), 0) AS amount
    FROM marketing.event_costs
    WHERE paid_at BETWEEN p_from AND p_to
  ),
  ev_leads AS (
    SELECT COUNT(*) AS n
    FROM marketing.event_leads
    WHERE created_at::date BETWEEN p_from AND p_to
  ),
  ev_return AS (
    SELECT COALESCE(SUM(l.cnt * COALESCE(e.estimated_value_per_lead, 0)), 0) AS val
    FROM marketing.events e
    JOIN LATERAL (
      SELECT COUNT(*) AS cnt FROM marketing.event_leads el
       WHERE el.event_id = e.id AND el.created_at::date BETWEEN p_from AND p_to
    ) l ON true
  )
  SELECT jsonb_build_object(
    'ads_investment', (SELECT spend FROM ads),
    'events_investment', (SELECT amount FROM ev_cost),
    'total_investment', (SELECT spend FROM ads) + (SELECT amount FROM ev_cost),
    'ads_leads', (SELECT conv FROM ads),
    'events_leads', (SELECT n FROM ev_leads),
    'cost_per_lead', CASE WHEN ((SELECT conv FROM ads) + (SELECT n FROM ev_leads)) = 0 THEN 0
        ELSE ROUND(((SELECT spend FROM ads) + (SELECT amount FROM ev_cost))
                   / ((SELECT conv FROM ads) + (SELECT n FROM ev_leads)), 2) END,
    'estimated_return', (SELECT val FROM ads) + (SELECT val FROM ev_return)
  );
$$;

-- 2.4 Eventos
CREATE OR REPLACE FUNCTION marketing.dashboard_events_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH leads AS (
    SELECT COUNT(*) AS n FROM marketing.event_leads
     WHERE created_at::date BETWEEN p_from AND p_to
  ),
  cost AS (
    SELECT COALESCE(SUM(amount), 0) AS amount FROM marketing.event_costs
     WHERE paid_at BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'por_status', COALESCE((SELECT jsonb_object_agg(status, c)
        FROM (SELECT status, COUNT(*) AS c FROM marketing.events
               WHERE status IS NOT NULL GROUP BY status) s), '{}'::jsonb),
    'leads_periodo', (SELECT n FROM leads),
    'cpl', CASE WHEN (SELECT n FROM leads) = 0 THEN 0
               ELSE ROUND((SELECT amount FROM cost) / (SELECT n FROM leads), 2) END,
    'roi_medio', COALESCE((SELECT ROUND(AVG(roi_estimated_pct), 1) FROM marketing.v_events_roi), 0),
    'proximo_evento', (SELECT to_jsonb(x) FROM (
        SELECT id, name, edition, starts_on, city, state
        FROM marketing.events
        WHERE starts_on >= CURRENT_DATE AND status <> 'cancelado'
        ORDER BY starts_on LIMIT 1) x)
  );
$$;

-- 2.5 Insights
CREATE OR REPLACE FUNCTION marketing.dashboard_insights_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT jsonb_build_object(
    'sessions', COALESCE((SELECT SUM(sessions) FROM marketing.google_analytics_daily
                           WHERE data_referencia BETWEEN p_from AND p_to), 0),
    'youtube_subscribers', COALESCE((SELECT subscriber_count FROM marketing.imbil_youtube_stats
                                      ORDER BY snapshot_date DESC LIMIT 1), 0),
    'brand_mentions', COALESCE((SELECT COUNT(*) FROM marketing.brand_mentions
                                 WHERE data_publicacao::date BETWEEN p_from AND p_to), 0),
    'avg_rating', (SELECT ROUND(AVG(rating)::numeric, 2) FROM marketing.brand_mentions
                    WHERE rating IS NOT NULL AND data_publicacao::date BETWEEN p_from AND p_to),
    'ultimo_relatorio', (SELECT to_jsonb(x) FROM (
        SELECT id, tipo, gerado_em, periodo_inicio, periodo_fim
        FROM marketing.marketing_reports ORDER BY gerado_em DESC LIMIT 1) x)
  );
$$;

-- 2.6 Concorrentes (benchmark direto Imbil × concorrentes)
CREATE OR REPLACE FUNCTION marketing.dashboard_competitors_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH kw AS (
    SELECT
      AVG(position) FILTER (WHERE upper(competitor_name) = 'IMBIL') AS imbil_pos,
      AVG(position) FILTER (WHERE upper(competitor_name) <> 'IMBIL') AS comp_pos
    FROM marketing.competitor_keyword_rankings
    WHERE data_referencia BETWEEN p_from AND p_to
  ),
  tr AS (
    SELECT
      COALESCE(SUM(interest) FILTER (WHERE upper(empresa) = 'IMBIL'), 0) AS imbil_int,
      COALESCE(SUM(interest), 0) AS total_int
    FROM marketing.competitor_trends
    WHERE data_referencia BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'ativos', (SELECT COUNT(*) FROM marketing.competitors WHERE active),
    'imbil_position', (SELECT ROUND(imbil_pos, 1) FROM kw),
    'competitors_position', (SELECT ROUND(comp_pos, 1) FROM kw),
    'share_of_interest', (SELECT CASE WHEN total_int = 0 THEN 0
                                      ELSE ROUND(imbil_int::numeric / total_int * 100, 1) END FROM tr),
    'imbil_rating', (SELECT ROUND(AVG(rating)::numeric, 2) FROM marketing.brand_mentions WHERE rating IS NOT NULL),
    'competitors_rating', (SELECT ROUND(AVG(google_rating), 2) FROM marketing.competitors
                            WHERE active AND google_rating IS NOT NULL),
    'yt_leader', (SELECT to_jsonb(x) FROM (
        SELECT name, yt_subscribers FROM marketing.v_competitors_overview
        WHERE yt_subscribers IS NOT NULL ORDER BY yt_subscribers DESC LIMIT 1) x)
  );
$$;

-- 2.7 Alertas Inteligentes
CREATE OR REPLACE FUNCTION marketing.dashboard_alerts_kpis(p_from date, p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH a AS (
    SELECT * FROM marketing.alertas_inteligentes
     WHERE data_referencia BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM a),
    'criticos', (SELECT COUNT(*) FROM a WHERE ABS(COALESCE(desvio_pct, 0)) >= 50),
    'por_fonte', COALESCE((SELECT jsonb_object_agg(fonte, c)
        FROM (SELECT fonte, COUNT(*) AS c FROM a GROUP BY fonte) s), '{}'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION marketing.dashboard_content_kpis(date, date)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.dashboard_paid_kpis(date, date)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.dashboard_investment_kpis(date, date)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.dashboard_events_kpis(date, date)      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.dashboard_insights_kpis(date, date)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.dashboard_competitors_kpis(date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.dashboard_alerts_kpis(date, date)      TO authenticated, service_role;
