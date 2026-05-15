-- Garante leitura pública dos avatares (anon + authenticated)

DROP POLICY IF EXISTS avatars_select ON storage.objects;

CREATE POLICY avatars_select_public ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
