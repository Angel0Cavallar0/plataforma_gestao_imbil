-- Cross-post no LinkedIn + vínculos parciais (idempotente com produção).
-- A marketing.cross_post_links passou a registrar também o LinkedIn e nem todo
-- vínculo tem as três redes, então os ids de cada rede são opcionais.

ALTER TABLE IF EXISTS marketing.cross_post_links
  ADD COLUMN IF NOT EXISTS linkedin_post_id text;

ALTER TABLE IF EXISTS marketing.cross_post_links
  ALTER COLUMN facebook_post_id DROP NOT NULL,
  ALTER COLUMN instagram_media_id DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
