-- =============================================================
-- 1. TABLES (order respects FK dependencies)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.plans_algoritmo_milionario (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  display_name        TEXT NOT NULL,
  price_brl           NUMERIC(10,2),
  limit_chat_messages INT,
  limit_images        INT,
  limit_ebooks        INT,
  limit_experts_uses  INT,
  features            TEXT[] DEFAULT '{}',
  allowed_models      JSONB DEFAULT '[]'::JSONB,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agents_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  avatar_url      TEXT,
  system_prompt   TEXT NOT NULL,
  default_model   TEXT NOT NULL,
  category        TEXT,
  is_official     BOOLEAN DEFAULT TRUE,
  is_active       BOOLEAN DEFAULT TRUE,
  required_plan   TEXT DEFAULT 'free',
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompts_algoritmo_milionario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  content       TEXT NOT NULL,
  category      TEXT,
  model_slug    TEXT,
  required_plan TEXT DEFAULT 'free',
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles_algoritmo_milionario (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  avatar_url      TEXT,
  plan_id         UUID REFERENCES public.plans_algoritmo_milionario(id),
  plan_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations_algoritmo_milionario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  agent_id    UUID REFERENCES public.agents_algoritmo_milionario(id),
  model_slug  TEXT NOT NULL,
  is_pinned   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON public.conversations_algoritmo_milionario(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.messages_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations_algoritmo_milionario(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  tokens_used     INT,
  model_slug      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages_algoritmo_milionario(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_user
  ON public.messages_algoritmo_milionario(user_id);

CREATE TABLE IF NOT EXISTS public.usage_counters_algoritmo_milionario (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period           TEXT NOT NULL,
  chat_messages    INT DEFAULT 0,
  images_generated INT DEFAULT 0,
  ebooks_generated INT DEFAULT 0,
  experts_uses     INT DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);

CREATE TABLE IF NOT EXISTS public.generated_images_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations_algoritmo_milionario(id) ON DELETE SET NULL,
  prompt          TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  model_used      TEXT,
  width           INT,
  height          INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_images_user
  ON public.generated_images_algoritmo_milionario(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.generated_ebooks_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  theme           TEXT DEFAULT 'breeze',
  page_count      INT DEFAULT 10,
  tone            TEXT DEFAULT 'professional',
  target_audience TEXT,
  language        TEXT DEFAULT 'pt-BR',
  storage_path    TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','generating','done','error')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_ebooks_user
  ON public.generated_ebooks_algoritmo_milionario(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.subscriptions_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES public.plans_algoritmo_milionario(id),
  provider        TEXT NOT NULL,
  provider_sub_id TEXT,
  status          TEXT NOT NULL CHECK (status IN ('active','cancelled','expired','pending')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  metadata        JSONB
);

-- =============================================================
-- 2. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.plans_algoritmo_milionario           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents_algoritmo_milionario          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts_algoritmo_milionario         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_algoritmo_milionario        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations_algoritmo_milionario   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_algoritmo_milionario        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters_algoritmo_milionario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_ebooks_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_algoritmo_milionario   ENABLE ROW LEVEL SECURITY;

-- Policies via DO block (CREATE POLICY IF NOT EXISTS not supported before PG17)
DO $$ BEGIN

  -- plans
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plans_algoritmo_milionario' AND policyname='plans: leitura para autenticados') THEN
    CREATE POLICY "plans: leitura para autenticados"
      ON public.plans_algoritmo_milionario FOR SELECT
      USING (auth.role() = 'authenticated' AND is_active = TRUE);
  END IF;

  -- agents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agents_algoritmo_milionario' AND policyname='agents: leitura para autenticados') THEN
    CREATE POLICY "agents: leitura para autenticados"
      ON public.agents_algoritmo_milionario FOR SELECT
      USING (auth.role() = 'authenticated' AND is_active = TRUE);
  END IF;

  -- prompts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prompts_algoritmo_milionario' AND policyname='prompts: leitura para autenticados') THEN
    CREATE POLICY "prompts: leitura para autenticados"
      ON public.prompts_algoritmo_milionario FOR SELECT
      USING (auth.role() = 'authenticated' AND is_active = TRUE);
  END IF;

  -- profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles_algoritmo_milionario' AND policyname='profile: usuário lê o próprio') THEN
    CREATE POLICY "profile: usuário lê o próprio"
      ON public.profiles_algoritmo_milionario FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles_algoritmo_milionario' AND policyname='profile: usuário atualiza o próprio') THEN
    CREATE POLICY "profile: usuário atualiza o próprio"
      ON public.profiles_algoritmo_milionario FOR UPDATE
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles_algoritmo_milionario' AND policyname='profile: service_role faz tudo') THEN
    CREATE POLICY "profile: service_role faz tudo"
      ON public.profiles_algoritmo_milionario FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

  -- conversations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='conversations_algoritmo_milionario' AND policyname='conv: usuário acessa as próprias') THEN
    CREATE POLICY "conv: usuário acessa as próprias"
      ON public.conversations_algoritmo_milionario FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages_algoritmo_milionario' AND policyname='msg: usuário acessa as próprias') THEN
    CREATE POLICY "msg: usuário acessa as próprias"
      ON public.messages_algoritmo_milionario FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- usage_counters
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usage_counters_algoritmo_milionario' AND policyname='usage: usuário lê o próprio') THEN
    CREATE POLICY "usage: usuário lê o próprio"
      ON public.usage_counters_algoritmo_milionario FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usage_counters_algoritmo_milionario' AND policyname='usage: service_role escreve') THEN
    CREATE POLICY "usage: service_role escreve"
      ON public.usage_counters_algoritmo_milionario FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

  -- generated_images
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='generated_images_algoritmo_milionario' AND policyname='img: usuário acessa as próprias') THEN
    CREATE POLICY "img: usuário acessa as próprias"
      ON public.generated_images_algoritmo_milionario FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- generated_ebooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='generated_ebooks_algoritmo_milionario' AND policyname='ebook: usuário acessa os próprios') THEN
    CREATE POLICY "ebook: usuário acessa os próprios"
      ON public.generated_ebooks_algoritmo_milionario FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions_algoritmo_milionario' AND policyname='sub: usuário lê as próprias') THEN
    CREATE POLICY "sub: usuário lê as próprias"
      ON public.subscriptions_algoritmo_milionario FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions_algoritmo_milionario' AND policyname='sub: service_role gerencia') THEN
    CREATE POLICY "sub: service_role gerencia"
      ON public.subscriptions_algoritmo_milionario FOR ALL
      USING (auth.role() = 'service_role');
  END IF;

END $$;

-- =============================================================
-- 3. FUNCTIONS & TRIGGERS
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_algoritmo_milionario (id, full_name, avatar_url, plan_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    (SELECT id FROM public.plans_algoritmo_milionario WHERE name = 'free' LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS VOID AS $$
DECLARE
  v_period TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO public.usage_counters_algoritmo_milionario (user_id, period)
  VALUES (p_user_id, v_period)
  ON CONFLICT (user_id, period) DO NOTHING;

  EXECUTE FORMAT(
    'UPDATE public.usage_counters_algoritmo_milionario
     SET %I = %I + 1, updated_at = NOW()
     WHERE user_id = $1 AND period = $2',
    p_feature, p_feature
  ) USING p_user_id, v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_period       TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_plan_limit   INT;
  v_current_use  INT;
BEGIN
  SELECT
    CASE p_feature
      WHEN 'chat_messages'    THEN p.limit_chat_messages
      WHEN 'images_generated' THEN p.limit_images
      WHEN 'ebooks_generated' THEN p.limit_ebooks
      WHEN 'experts_uses'     THEN p.limit_experts_uses
    END
  INTO v_plan_limit
  FROM public.profiles_algoritmo_milionario pr
  JOIN public.plans_algoritmo_milionario p ON p.id = pr.plan_id
  WHERE pr.id = p_user_id;

  IF v_plan_limit IS NULL THEN RETURN TRUE; END IF;

  EXECUTE FORMAT(
    'SELECT COALESCE(%I, 0)
     FROM public.usage_counters_algoritmo_milionario
     WHERE user_id = $1 AND period = $2',
    p_feature
  ) INTO v_current_use USING p_user_id, v_period;

  RETURN COALESCE(v_current_use, 0) < v_plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- 4. SEED — Default plans
-- =============================================================

INSERT INTO public.plans_algoritmo_milionario
  (name, display_name, price_brl, limit_chat_messages, limit_images, limit_ebooks, limit_experts_uses, features, allowed_models)
VALUES
  ('free', 'Gratuito', 0, 30, 5, 1, 5, '{chat}',
   '[{"slug":"openai/gpt-4o","display_name":"Million AI 1.0","provider":"OpenAI","max_tokens":128000,"is_reasoning":false,"badge":"Grátis"}]'::jsonb),
  ('pro', 'Pro', 47.00, 500, 50, 10, 50, '{chat,images,ebooks,experts,prompts}',
   '[{"slug":"openai/gpt-4o","display_name":"GPT-4o","provider":"OpenAI","max_tokens":128000,"is_reasoning":false,"badge":"Favorito"},{"slug":"anthropic/claude-sonnet-4-5","display_name":"Claude Sonnet 4.5","provider":"Anthropic","max_tokens":200000,"is_reasoning":false,"badge":"Mais usado"},{"slug":"google/gemini-2.5-pro","display_name":"Gemini 2.5 Pro","provider":"Google","max_tokens":1000000,"is_reasoning":false,"badge":null}]'::jsonb),
  ('premium', 'Premium', 97.00, NULL, NULL, NULL, NULL, '{chat,images,ebooks,experts,prompts}',
   '[{"slug":"openai/gpt-4o","display_name":"GPT-4o","provider":"OpenAI","max_tokens":128000,"is_reasoning":false,"badge":"Favorito"},{"slug":"anthropic/claude-sonnet-4-5","display_name":"Claude Sonnet 4.5","provider":"Anthropic","max_tokens":200000,"is_reasoning":false,"badge":"Mais usado"},{"slug":"google/gemini-2.5-pro","display_name":"Gemini 2.5 Pro","provider":"Google","max_tokens":1000000,"is_reasoning":false,"badge":null},{"slug":"deepseek/deepseek-v3","display_name":"DeepSeek V3","provider":"DeepSeek","max_tokens":64000,"is_reasoning":true,"badge":null}]'::jsonb)
ON CONFLICT (name) DO NOTHING;
