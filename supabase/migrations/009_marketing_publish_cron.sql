-- Agendamento de publicação de posts via Supabase Edge Function + pg_cron
-- Substitui Vercel Cron (requer plano Pro)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove job anterior se existir (re-deploy seguro)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT jobid FROM cron.job WHERE jobname = 'publish-scheduled-marketing-posts'
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END;
$$;

-- Invoca a Edge Function publish-scheduled-posts a cada 5 minutos.
-- Autenticação: service_role (disponível no ambiente do Postgres via vault).
-- Configure o secret no Vault com o mesmo valor de CRON_SECRET da Edge Function:
--   SELECT marketing.store_vault_secret('cron_service_role_key', '<SUPABASE_SERVICE_ROLE_KEY>', 'Cron publish');
CREATE OR REPLACE FUNCTION marketing.invoke_publish_scheduled_posts_edge()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, marketing, vault
AS $$
DECLARE
  v_url text;
  v_service_key text;
  v_request_id bigint;
BEGIN
  v_url := current_setting('app.settings.supabase_url', true);
  IF v_url IS NULL OR v_url = '' THEN
    v_url := 'https://xxitgcaefpufldkjkiym.supabase.co';
  END IF;
  v_url := rtrim(v_url, '/') || '/functions/v1/publish-scheduled-posts';

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'cron_service_role_key'
  LIMIT 1;

  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING 'Vault secret cron_service_role_key ausente. Rode marketing.store_vault_secret com a SUPABASE_SERVICE_ROLE_KEY.';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION marketing.invoke_publish_scheduled_posts_edge() TO postgres;

SELECT cron.schedule(
  'publish-scheduled-marketing-posts',
  '*/5 * * * *',
  $$SELECT marketing.invoke_publish_scheduled_posts_edge();$$
);
