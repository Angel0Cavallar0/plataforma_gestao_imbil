-- Log de erros de agendamento e publicação dos posts do calendário de conteúdo.
-- Escrita apenas via service_role (server actions com admin client e Edge Function);
-- leitura para usuários com permissão de leitura no módulo marketing.

CREATE TABLE IF NOT EXISTS marketing.content_post_error_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES marketing.content_posts(id) ON DELETE CASCADE,
  stage         text NOT NULL CHECK (stage IN ('agendamento', 'publicacao')),
  source        text NOT NULL CHECK (source IN ('app', 'edge_cron')),
  error_message text NOT NULL,
  error_code    text,
  attempt       int,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_post_error_logs_post
  ON marketing.content_post_error_logs (post_id, created_at DESC);

ALTER TABLE marketing.content_post_error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_error_logs_select ON marketing.content_post_error_logs;
CREATE POLICY post_error_logs_select ON marketing.content_post_error_logs
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));

-- Grant explícito: ALTER DEFAULT PRIVILEGES da migration 008 só vale para
-- objetos criados pelo mesmo role que a aplicou.
GRANT SELECT ON marketing.content_post_error_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.content_post_error_logs TO service_role;
