-- Mídia espelhada no bucket privado marketing-content-assets (idempotente com
-- produção). `media_storage_url` = a mídia em si (imagem .jpg ou vídeo .mp4);
-- `thumbnail_storage_url` = a capa .jpg, preenchida só para vídeo.
-- A leitura exige usuário autenticado com permissão marketing.read (policy
-- storage `marketing_content_assets_select`); o app gera URLs assinadas.

ALTER TABLE IF EXISTS marketing.instagram_media_insights
  ADD COLUMN IF NOT EXISTS media_storage_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_url text;

ALTER TABLE IF EXISTS marketing.instagram_carousel_children
  ADD COLUMN IF NOT EXISTS media_storage_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_url text;

ALTER TABLE IF EXISTS marketing.facebook_post_insights
  ADD COLUMN IF NOT EXISTS media_storage_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_url text;

ALTER TABLE IF EXISTS marketing.linkedin_post_insights
  ADD COLUMN IF NOT EXISTS media_storage_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_url text;

NOTIFY pgrst, 'reload schema';
