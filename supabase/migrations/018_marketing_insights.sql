-- =========================================================
-- mkt_insights — Insights e Relatórios (submódulo de Marketing)
--
-- Objetos NOVOS (aditivos) para o submódulo de Insights e Relatórios:
--   1) marketing.module_settings    — configs do módulo (webhook de relatórios)
--   2) marketing.report_requests    — controle de solicitações (limite global 3/dia)
--   3) marketing.v_followers_history — histórico de seguidores (total + ganho)
--   4) marketing.marketing_reports adicionada à publicação de Realtime
--
-- As tabelas de origem (insights) já existem e são populadas pelos
-- workflows n8n do Carlos. Este submódulo é majoritariamente somente
-- leitura; as únicas escritas são a config do webhook e o registro de
-- solicitações de relatório (controle de cota).
-- =========================================================

-- ---------------------------------------------------------
-- 1. module_settings (chave-valor de configs do módulo)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing.module_settings (
  key          text PRIMARY KEY,
  value        jsonb NOT NULL,
  description  text,
  updated_by   uuid REFERENCES public.profiles(id),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO marketing.module_settings (key, value, description) VALUES
  ('reports_webhook_url', '""'::jsonb,
   'URL do webhook do n8n que gera os relatórios de marketing')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE marketing.module_settings ENABLE ROW LEVEL SECURITY;

-- Leitura/escrita: gestor+ (URL de webhook é sensível)
DROP POLICY IF EXISTS module_settings_select ON marketing.module_settings;
CREATE POLICY module_settings_select ON marketing.module_settings
  FOR SELECT TO authenticated
  USING (public.current_user_role_level() >= 60);

DROP POLICY IF EXISTS module_settings_write ON marketing.module_settings;
CREATE POLICY module_settings_write ON marketing.module_settings
  FOR ALL TO authenticated
  USING (public.current_user_role_level() >= 60)
  WITH CHECK (public.current_user_role_level() >= 60);

-- ---------------------------------------------------------
-- 2. report_requests (controle de cota diária GLOBAL)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketing.report_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by  uuid NOT NULL REFERENCES public.profiles(id),
  scope         text NOT NULL CHECK (scope IN ('redes_sociais','midia_paga','midia_paga_insights','geral')),
  data_inicio   date,
  data_fim      date,
  status        text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','webhook_sent','completed','failed')),
  report_id     uuid REFERENCES marketing.marketing_reports(id),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_report_requests_daily
  ON marketing.report_requests (requested_at);

ALTER TABLE marketing.report_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_requests_select ON marketing.report_requests;
CREATE POLICY report_requests_select ON marketing.report_requests
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'marketing', 'read'));
-- INSERT/UPDATE feitos via Server Action (service role) — sem policy de escrita direta

-- ---------------------------------------------------------
-- 3. v_followers_history (total + ganho por rede/dia)
--    security_invoker → respeita a RLS das tabelas base
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW marketing.v_followers_history AS
-- Instagram: ganho = diferença do total cumulativo entre dias consecutivos
SELECT
  'instagram'::text AS network,
  data_referencia,
  followers_count AS total_followers,
  followers_count - LAG(followers_count) OVER (ORDER BY data_referencia) AS followers_gained
FROM marketing.instagram_organic_insights
UNION ALL
-- Facebook: usa os campos diretos de added/removed
SELECT
  'facebook',
  data_referencia,
  fans AS total_followers,
  (COALESCE(fans_added, 0) - COALESCE(fans_removed, 0)) AS followers_gained
FROM marketing.facebook_page_insights
UNION ALL
-- LinkedIn: soma ganho orgânico + pago
SELECT
  'linkedin',
  data_referencia,
  followers_count AS total_followers,
  (COALESCE(organic_followers_gain, 0) + COALESCE(paid_followers_gain, 0)) AS followers_gained
FROM marketing.linkedin_page_insights;

ALTER VIEW marketing.v_followers_history SET (security_invoker = true);

-- ---------------------------------------------------------
-- 4. Grants (PostgREST consome via role authenticated; RLS efetiva nas tabelas)
-- ---------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.module_settings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.report_requests TO authenticated, service_role;
GRANT SELECT ON marketing.v_followers_history TO authenticated, service_role;

-- ---------------------------------------------------------
-- 5. Realtime — detectar relatório pronto (INSERT em marketing_reports)
-- ---------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'marketing'
      AND tablename = 'marketing_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketing.marketing_reports;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
