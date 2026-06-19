-- =========================================================
-- mkt_insights — Menções à Marca: controle de "respondido"
--
-- Colunas operacionais (aditivas) na marketing.brand_mentions para a equipe
-- marcar se já respondeu a interação. A escrita é feita via Server Action
-- (service role); não há policy de escrita direta.
-- =========================================================
ALTER TABLE marketing.brand_mentions
  ADD COLUMN IF NOT EXISTS respondida     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS respondida_em  timestamptz,
  ADD COLUMN IF NOT EXISTS respondida_por uuid REFERENCES public.profiles(id);

NOTIFY pgrst, 'reload schema';
