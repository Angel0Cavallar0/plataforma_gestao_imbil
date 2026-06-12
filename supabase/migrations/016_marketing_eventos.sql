-- =========================================================
-- MIGRATION 016: Marketing — Gestão de Eventos & Leads
-- Tabelas: events, event_costs, lead_forms, event_leads,
--          event_status_history
-- View: v_events_roi · Bucket: marketing-form-qrcodes
-- =========================================================

-- ---------------------------------------------------------
-- Eventos
-- ---------------------------------------------------------
CREATE TABLE marketing.events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name              text NOT NULL,
  edition           text,                                    -- "2026", "15ª edição"
  description       text,
  objective         text,                                    -- objetivo da participação
  event_type        text NOT NULL DEFAULT 'feira' CHECK (event_type IN
                      ('feira','congresso','exposicao','workshop','evento_proprio','outro')),

  -- Quando e onde
  starts_on         date,
  ends_on           date,
  venue             text,
  city              text,
  state             text,
  country           text DEFAULT 'BR',

  -- Pipeline (Kanban)
  status            text NOT NULL DEFAULT 'negociacao' CHECK (status IN
                      ('negociacao','confirmado','em_preparacao','realizado','cancelado')),
  kanban_order      int NOT NULL DEFAULT 0,

  -- Investimento
  investment_planned  numeric(12,2),
  investment_actual   numeric(12,2),
  currency            text NOT NULL DEFAULT 'BRL',

  -- ROI
  estimated_value_per_lead numeric(12,2),

  -- Metadados
  notes             text,
  created_by        uuid NOT NULL REFERENCES public.profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

-- ---------------------------------------------------------
-- Custos detalhados do evento
-- ---------------------------------------------------------
CREATE TABLE marketing.event_costs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES marketing.events(id) ON DELETE CASCADE,
  category     text NOT NULL CHECK (category IN
                 ('inscricao','estande','material','viagem','hospedagem',
                  'equipe','brindes','midia','frete','outro')),
  description  text NOT NULL,
  amount       numeric(12,2) NOT NULL CHECK (amount >= 0),
  paid_at      date,
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- Formulários de captura (entidade própria — builder)
-- ---------------------------------------------------------
CREATE TABLE marketing.lead_forms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES marketing.events(id) ON DELETE CASCADE,

  -- Identificação
  name              text NOT NULL,                           -- "Formulário do estande"
  slug              text UNIQUE NOT NULL,                    -- usado na URL pública
  description       text,                                    -- exibida no topo do form público

  -- Campos customizados (além dos obrigatórios fixos)
  custom_fields     jsonb NOT NULL DEFAULT '[]',

  -- Campos padrão opcionais ativados (empresa, cargo, cidade, interesse, mensagem)
  standard_fields   text[] NOT NULL DEFAULT '{}',

  -- Configuração de interesse (select padrão configurável)
  interest_options  text[] NOT NULL DEFAULT '{}',

  -- Publicação e expiração
  is_active         boolean NOT NULL DEFAULT false,          -- liga/desliga manual
  public_token      uuid NOT NULL DEFAULT gen_random_uuid(), -- segredo da URL (rotacionável)
  expires_at        timestamptz NOT NULL,                    -- OBRIGATÓRIO: link sempre expira

  -- QR Code (gerado automaticamente na criação do link)
  qr_code_path      text,                                    -- caminho no Supabase Storage

  -- Consentimento e privacidade
  consent_text_version text NOT NULL DEFAULT 'v1-2026',
  privacy_policy_text  text,
  privacy_policy_url   text,

  -- Telemetria
  submissions_count int NOT NULL DEFAULT 0,                  -- contador denormalizado (trigger)
  last_submission_at timestamptz,

  created_by        uuid NOT NULL REFERENCES public.profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- Leads capturados
-- ---------------------------------------------------------
CREATE TABLE marketing.event_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES marketing.events(id),
  lead_form_id    uuid REFERENCES marketing.lead_forms(id) ON DELETE SET NULL,
                                                             -- null quando cadastro manual

  -- Dados de contato (campos obrigatórios fixos do formulário)
  full_name       text NOT NULL,
  email           text,
  phone           text,
  company         text,
  job_title       text,
  city            text,
  state           text,
  interest        text,
  message         text,

  -- Respostas dos campos customizados do formulário
  custom_answers  jsonb NOT NULL DEFAULT '{}',

  -- Consentimento LGPD
  marketing_consent       boolean NOT NULL DEFAULT false,
  marketing_consent_at    timestamptz,
  consent_text_version    text,

  -- Origem e rastreamento
  source          text NOT NULL DEFAULT 'form_publico' CHECK (source IN
                    ('form_publico','cadastro_manual','importacao','qr_code','sorteio')),
  captured_by     uuid REFERENCES public.profiles(id),
  user_agent      text,
  submitted_ip    inet,                                      -- reter por prazo limitado (LGPD)

  -- Qualificação
  qualification   text CHECK (qualification IN ('quente','morno','frio','nao_qualificado')),
  qualified_by    uuid REFERENCES public.profiles(id),
  qualified_at    timestamptz,
  qualification_notes text,

  -- Encaminhamento comercial
  forwarded_to_sales    boolean NOT NULL DEFAULT false,
  forwarded_at          timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- Histórico de mudança de status do evento
-- ---------------------------------------------------------
CREATE TABLE marketing.event_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES marketing.events(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid REFERENCES public.profiles(id),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_events_status        ON marketing.events(status, kanban_order);
CREATE INDEX idx_events_dates         ON marketing.events(starts_on);

CREATE INDEX idx_event_costs_event    ON marketing.event_costs(event_id);

CREATE UNIQUE INDEX idx_lead_forms_token ON marketing.lead_forms(public_token);
CREATE INDEX idx_lead_forms_event     ON marketing.lead_forms(event_id);
CREATE INDEX idx_lead_forms_active    ON marketing.lead_forms(is_active, expires_at);

CREATE INDEX idx_event_leads_event    ON marketing.event_leads(event_id, created_at DESC);
CREATE INDEX idx_event_leads_form     ON marketing.event_leads(lead_form_id);
CREATE INDEX idx_event_leads_qualif   ON marketing.event_leads(event_id, qualification);
CREATE INDEX idx_event_leads_email    ON marketing.event_leads(LOWER(email));
CREATE INDEX idx_event_leads_ip_time  ON marketing.event_leads(submitted_ip, created_at DESC);

CREATE INDEX idx_event_status_history ON marketing.event_status_history(event_id, created_at DESC);

-- =========================================================
-- TRIGGERS
-- =========================================================

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON marketing.events
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

CREATE TRIGGER trg_lead_forms_updated_at
  BEFORE UPDATE ON marketing.lead_forms
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

CREATE TRIGGER trg_event_leads_updated_at
  BEFORE UPDATE ON marketing.event_leads
  FOR EACH ROW EXECUTE FUNCTION marketing.set_updated_at();

-- Timeline automática de status do evento
CREATE OR REPLACE FUNCTION marketing.log_event_status_change() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO marketing.event_status_history (event_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
    RETURN NEW;
  END IF;
  IF (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO marketing.event_status_history (event_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = marketing, public;

CREATE TRIGGER trg_events_status_history
  AFTER INSERT OR UPDATE OF status ON marketing.events
  FOR EACH ROW EXECUTE FUNCTION marketing.log_event_status_change();

-- Timestamp do consentimento
CREATE OR REPLACE FUNCTION marketing.set_consent_timestamp() RETURNS trigger AS $$
BEGIN
  IF NEW.marketing_consent = true AND NEW.marketing_consent_at IS NULL THEN
    NEW.marketing_consent_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = marketing, public;

CREATE TRIGGER trg_event_leads_consent
  BEFORE INSERT OR UPDATE ON marketing.event_leads
  FOR EACH ROW EXECUTE FUNCTION marketing.set_consent_timestamp();

-- Contador denormalizado de submissões por formulário
CREATE OR REPLACE FUNCTION marketing.increment_form_submissions() RETURNS trigger AS $$
BEGIN
  IF NEW.lead_form_id IS NOT NULL THEN
    UPDATE marketing.lead_forms
    SET submissions_count = submissions_count + 1,
        last_submission_at = now()
    WHERE id = NEW.lead_form_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = marketing, public;

CREATE TRIGGER trg_event_leads_count
  AFTER INSERT ON marketing.event_leads
  FOR EACH ROW EXECUTE FUNCTION marketing.increment_form_submissions();

-- =========================================================
-- VIEW DE APOIO — ROI (security_invoker: respeita RLS de events)
-- =========================================================

CREATE OR REPLACE VIEW marketing.v_events_roi
WITH (security_invoker = on) AS
SELECT
  e.id,
  e.name,
  e.edition,
  e.starts_on,
  e.city,
  e.state,
  e.event_type,
  COALESCE(e.investment_actual, (
    SELECT SUM(c.amount) FROM marketing.event_costs c WHERE c.event_id = e.id
  ), e.investment_planned)                                            AS investment,
  COUNT(l.id)                                                         AS leads_total,
  COUNT(l.id) FILTER (WHERE l.qualification IN ('quente','morno'))    AS leads_qualified,
  COUNT(l.id) FILTER (WHERE l.marketing_consent)                      AS leads_with_consent,
  COUNT(l.id) FILTER (WHERE l.forwarded_to_sales)                     AS leads_forwarded,
  e.estimated_value_per_lead,
  CASE
    WHEN COALESCE(e.investment_actual, (
      SELECT SUM(c.amount) FROM marketing.event_costs c WHERE c.event_id = e.id
    ), e.investment_planned) > 0
     AND e.estimated_value_per_lead IS NOT NULL
    THEN ROUND(
      ((COUNT(l.id) FILTER (WHERE l.qualification IN ('quente','morno'))
        * e.estimated_value_per_lead)
       - COALESCE(e.investment_actual, (
           SELECT SUM(c.amount) FROM marketing.event_costs c WHERE c.event_id = e.id
         ), e.investment_planned))
      / COALESCE(e.investment_actual, (
          SELECT SUM(c.amount) FROM marketing.event_costs c WHERE c.event_id = e.id
        ), e.investment_planned) * 100, 1)
  END                                                                 AS roi_estimated_pct
FROM marketing.events e
LEFT JOIN marketing.event_leads l ON l.event_id = e.id
WHERE e.status = 'realizado'
GROUP BY e.id;

-- =========================================================
-- RLS
-- =========================================================

ALTER TABLE marketing.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.event_costs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.lead_forms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.event_leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.event_status_history ENABLE ROW LEVEL SECURITY;

-- events
CREATE POLICY events_select ON marketing.events FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY events_insert ON marketing.events FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY events_update ON marketing.events FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY events_delete ON marketing.events FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

-- event_costs
CREATE POLICY event_costs_select ON marketing.event_costs FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY event_costs_insert ON marketing.event_costs FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY event_costs_update ON marketing.event_costs FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY event_costs_delete ON marketing.event_costs FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

-- lead_forms (rotação de token / expiração: regra supervisao+ aplicada em código)
CREATE POLICY lead_forms_select ON marketing.lead_forms FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY lead_forms_insert ON marketing.lead_forms FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY lead_forms_update ON marketing.lead_forms FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY lead_forms_delete ON marketing.lead_forms FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

-- event_leads
-- ⚠️ SEM policy de INSERT para anon: o formulário público grava via Route
-- Handler server-side com service_role (token + expiração + rate limit +
-- honeypot validados no código). INSERT anônimo via RLS exporia a tabela
-- à API REST do Supabase para qualquer pessoa com a anon key.
CREATE POLICY event_leads_select ON marketing.event_leads FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));
CREATE POLICY event_leads_insert ON marketing.event_leads FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create'));
CREATE POLICY event_leads_update ON marketing.event_leads FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'update'))
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'update'));
CREATE POLICY event_leads_delete ON marketing.event_leads FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'delete'));

-- event_status_history: leitura; escrita apenas via trigger (SECURITY DEFINER)
CREATE POLICY event_status_history_select ON marketing.event_status_history
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));

-- =========================================================
-- STORAGE — bucket privado de QR codes
-- =========================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-form-qrcodes',
  'marketing-form-qrcodes',
  false,
  5242880,
  ARRAY['image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS marketing_qrcodes_select ON storage.objects;

-- Leitura para authenticated com marketing.read (signed URLs geradas server-side).
-- Escrita: somente service_role (geração do QR é sempre server-side) — sem
-- policies de INSERT/UPDATE/DELETE para authenticated.
CREATE POLICY marketing_qrcodes_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'marketing-form-qrcodes'
    AND has_permission(auth.uid(), 'marketing', 'read')
  );
