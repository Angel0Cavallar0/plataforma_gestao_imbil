-- Marketing module: base schema + calendário de conteúdo

CREATE SCHEMA IF NOT EXISTS marketing;

GRANT USAGE ON SCHEMA marketing TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA marketing TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing
  GRANT ALL ON TABLES TO authenticated, service_role;

-- =========================================================
-- Base tables (shared module)
-- =========================================================

CREATE TABLE IF NOT EXISTS marketing.platforms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  category     text NOT NULL,
  icon         text,
  color        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.integration_credentials (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id           uuid NOT NULL REFERENCES marketing.platforms(id),
  label                 text NOT NULL,
  external_account_id   text,
  external_account_name text,
  credentials           jsonb NOT NULL DEFAULT '{}'::jsonb,
  scopes                text[],
  is_active             boolean NOT NULL DEFAULT true,
  expires_at            timestamptz,
  last_used_at          timestamptz,
  last_validated_at     timestamptz,
  created_by            uuid REFERENCES public.profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.sync_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id     uuid REFERENCES marketing.platforms(id),
  workflow_name   text NOT NULL,
  status          text NOT NULL CHECK (status IN ('running','success','failed','partial')),
  records_synced  int DEFAULT 0,
  error_message   text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  metadata        jsonb
);

-- =========================================================
-- Calendário de conteúdo
-- =========================================================

CREATE TABLE IF NOT EXISTS marketing.content_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  start_date      date,
  end_date        date,
  color           text,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS marketing.content_posts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           uuid REFERENCES marketing.content_campaigns(id) ON DELETE SET NULL,
  platform_id           uuid NOT NULL REFERENCES marketing.platforms(id),
  credential_id         uuid REFERENCES marketing.integration_credentials(id),
  title                 text NOT NULL,
  content_type          text NOT NULL CHECK (content_type IN
    ('imagem','video','carrossel','reels','story','texto','link')),
  copy                  text,
  hashtags              text[],
  cta_url               text,
  scheduled_at          timestamptz NOT NULL,
  published_at          timestamptz,
  timezone              text NOT NULL DEFAULT 'America/Sao_Paulo',
  status                text NOT NULL DEFAULT 'rascunho' CHECK (status IN
    ('rascunho','agendado','publicando','publicado','falhou','cancelado')),
  external_post_id      text,
  external_post_url     text,
  external_container_id text,
  publish_attempts      int NOT NULL DEFAULT 0,
  last_error_message    text,
  last_error_code       text,
  last_error_at         timestamptz,
  assigned_to           uuid REFERENCES public.profiles(id),
  created_by            uuid NOT NULL REFERENCES public.profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.content_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES marketing.content_posts(id) ON DELETE CASCADE,
  asset_type    text NOT NULL CHECK (asset_type IN ('image','video')),
  storage_path  text NOT NULL,
  public_url    text,
  file_name     text NOT NULL,
  mime_type     text,
  size_bytes    bigint,
  width         int,
  height        int,
  duration_sec  numeric,
  display_order int NOT NULL DEFAULT 0,
  alt_text      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.content_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES marketing.content_posts(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES public.profiles(id),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON marketing.sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON marketing.sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON marketing.content_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON marketing.content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON marketing.content_posts(platform_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_campaign ON marketing.content_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_assigned ON marketing.content_posts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_content_posts_published ON marketing.content_posts(published_at DESC)
  WHERE status = 'publicado';
CREATE INDEX IF NOT EXISTS idx_content_posts_ready ON marketing.content_posts(scheduled_at)
  WHERE status = 'agendado';
CREATE INDEX IF NOT EXISTS idx_content_assets_post ON marketing.content_assets(post_id, display_order);
CREATE INDEX IF NOT EXISTS idx_content_comments_post ON marketing.content_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_platform ON marketing.integration_credentials(platform_id);

-- updated_at triggers
CREATE OR REPLACE FUNCTION marketing.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_posts_updated_at ON marketing.content_posts;
CREATE TRIGGER trg_content_posts_updated_at
  BEFORE UPDATE ON marketing.content_posts
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

DROP TRIGGER IF EXISTS trg_content_campaigns_updated_at ON marketing.content_campaigns;
CREATE TRIGGER trg_content_campaigns_updated_at
  BEFORE UPDATE ON marketing.content_campaigns
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

DROP TRIGGER IF EXISTS trg_content_comments_updated_at ON marketing.content_comments;
CREATE TRIGGER trg_content_comments_updated_at
  BEFORE UPDATE ON marketing.content_comments
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

DROP TRIGGER IF EXISTS trg_integration_credentials_updated_at ON marketing.integration_credentials;
CREATE TRIGGER trg_integration_credentials_updated_at
  BEFORE UPDATE ON marketing.integration_credentials
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

-- Seed platforms
INSERT INTO marketing.platforms (slug, name, category, icon, color, is_active) VALUES
  ('instagram', 'Instagram', 'social', 'instagram', '#E4405F', true),
  ('facebook', 'Facebook', 'social', 'facebook', '#1877F2', true),
  ('linkedin', 'LinkedIn', 'social', 'linkedin', '#0A66C2', false),
  ('youtube', 'YouTube', 'social', 'youtube', '#FF0000', false),
  ('meta_ads', 'Meta Ads', 'ads', 'megaphone', '#1877F2', true),
  ('google_ads', 'Google Ads', 'ads', 'bar-chart', '#4285F4', true),
  ('linkedin_ads', 'LinkedIn Ads', 'ads', 'linkedin', '#0A66C2', false),
  ('email_rd', 'RD Station', 'email', 'mail', '#00B4D8', false),
  ('email_mailchimp', 'Mailchimp', 'email', 'mail', '#FFE01B', false)
ON CONFLICT (slug) DO NOTHING;

-- Vault helpers (requires supabase_vault extension)
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE OR REPLACE FUNCTION marketing.store_vault_secret(
  p_name text,
  p_secret text,
  p_description text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF current_user_role_level() < 60 AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Sem permissão para armazenar segredos';
  END IF;
  SELECT vault.create_secret(p_secret, p_name, COALESCE(p_description, p_name)) INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION marketing.read_vault_secret(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret text;
BEGIN
  IF auth.role() <> 'service_role' AND current_user_role_level() < 60 THEN
    RAISE EXCEPTION 'Sem permissão para ler segredos';
  END IF;
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
  RETURN v_secret;
END;
$$;

GRANT EXECUTE ON FUNCTION marketing.store_vault_secret(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION marketing.read_vault_secret(text) TO authenticated, service_role;

-- RLS
ALTER TABLE marketing.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.content_comments ENABLE ROW LEVEL SECURITY;

-- platforms: read all authenticated
DROP POLICY IF EXISTS platforms_select ON marketing.platforms;
CREATE POLICY platforms_select ON marketing.platforms
  FOR SELECT TO authenticated USING (true);

-- integration_credentials
DROP POLICY IF EXISTS credentials_select ON marketing.integration_credentials;
DROP POLICY IF EXISTS credentials_insert ON marketing.integration_credentials;
DROP POLICY IF EXISTS credentials_update ON marketing.integration_credentials;
DROP POLICY IF EXISTS credentials_delete ON marketing.integration_credentials;

CREATE POLICY credentials_select ON marketing.integration_credentials
  FOR SELECT TO authenticated
  USING (current_user_role_level() >= 60);

CREATE POLICY credentials_insert ON marketing.integration_credentials
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY credentials_update ON marketing.integration_credentials
  FOR UPDATE TO authenticated
  USING (current_user_role_level() >= 60)
  WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY credentials_delete ON marketing.integration_credentials
  FOR DELETE TO authenticated
  USING (current_user_role_level() >= 100);

-- sync_runs: read supervisao+
DROP POLICY IF EXISTS sync_runs_select ON marketing.sync_runs;
CREATE POLICY sync_runs_select ON marketing.sync_runs
  FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

-- content tables
DROP POLICY IF EXISTS campaigns_select ON marketing.content_campaigns;
DROP POLICY IF EXISTS campaigns_insert ON marketing.content_campaigns;
DROP POLICY IF EXISTS campaigns_update ON marketing.content_campaigns;
DROP POLICY IF EXISTS campaigns_delete ON marketing.content_campaigns;

CREATE POLICY campaigns_select ON marketing.content_campaigns FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY campaigns_insert ON marketing.content_campaigns FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY campaigns_update ON marketing.content_campaigns FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY campaigns_delete ON marketing.content_campaigns FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

DROP POLICY IF EXISTS posts_select ON marketing.content_posts;
DROP POLICY IF EXISTS posts_insert ON marketing.content_posts;
DROP POLICY IF EXISTS posts_update ON marketing.content_posts;
DROP POLICY IF EXISTS posts_delete ON marketing.content_posts;

CREATE POLICY posts_select ON marketing.content_posts FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY posts_insert ON marketing.content_posts FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY posts_update ON marketing.content_posts FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY posts_delete ON marketing.content_posts FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

DROP POLICY IF EXISTS assets_select ON marketing.content_assets;
DROP POLICY IF EXISTS assets_insert ON marketing.content_assets;
DROP POLICY IF EXISTS assets_update ON marketing.content_assets;
DROP POLICY IF EXISTS assets_delete ON marketing.content_assets;

CREATE POLICY assets_select ON marketing.content_assets FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY assets_insert ON marketing.content_assets FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY assets_update ON marketing.content_assets FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY assets_delete ON marketing.content_assets FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

DROP POLICY IF EXISTS comments_select ON marketing.content_comments;
DROP POLICY IF EXISTS comments_insert ON marketing.content_comments;
DROP POLICY IF EXISTS comments_update ON marketing.content_comments;
DROP POLICY IF EXISTS comments_delete ON marketing.content_comments;

CREATE POLICY comments_select ON marketing.content_comments FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY comments_insert ON marketing.content_comments FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create') AND author_id = auth.uid());
CREATE POLICY comments_update ON marketing.content_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_delete ON marketing.content_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR current_user_role_level() >= 60);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-content-assets',
  'marketing-content-assets',
  false,
  1073741824,
  ARRAY['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS marketing_assets_select ON storage.objects;
DROP POLICY IF EXISTS marketing_assets_insert ON storage.objects;
DROP POLICY IF EXISTS marketing_assets_update ON storage.objects;
DROP POLICY IF EXISTS marketing_assets_delete ON storage.objects;

CREATE POLICY marketing_assets_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'marketing-content-assets'
    AND has_permission(auth.uid(), 'marketing', 'read')
  );

CREATE POLICY marketing_assets_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-content-assets'
    AND has_permission(auth.uid(), 'marketing', 'create')
  );

CREATE POLICY marketing_assets_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'marketing-content-assets'
    AND has_permission(auth.uid(), 'marketing', 'update')
  );

CREATE POLICY marketing_assets_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'marketing-content-assets'
    AND has_permission(auth.uid(), 'marketing', 'delete')
  );
