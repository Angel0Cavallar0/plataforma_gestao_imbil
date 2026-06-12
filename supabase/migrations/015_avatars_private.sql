-- Torna o bucket de avatares privado.
-- Antes, a leitura era pública (anon), permitindo que qualquer pessoa não
-- autenticada baixasse a foto de um usuário conhecendo o UUID (caminho previsível).
-- Agora a leitura exige autenticação e é feita via URL assinada de curta duração
-- gerada no servidor (getAvatarSignedUrl).

UPDATE storage.buckets
SET public = false
WHERE id = 'avatars';

-- Remove as policies de leitura pública/aberta criadas anteriormente.
DROP POLICY IF EXISTS avatars_select_public ON storage.objects;
DROP POLICY IF EXISTS avatars_select ON storage.objects;

-- Leitura restrita a usuários autenticados (necessária para assinar a URL).
CREATE POLICY avatars_select_authenticated ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');
