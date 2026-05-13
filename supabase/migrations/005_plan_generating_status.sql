-- Add 'generating' and 'error' to social_media_plans status constraint
ALTER TABLE public.social_media_plans_algoritmo_milionario
  DROP CONSTRAINT IF EXISTS social_media_plans_algoritmo_milionario_status_check;

ALTER TABLE public.social_media_plans_algoritmo_milionario
  ADD CONSTRAINT social_media_plans_algoritmo_milionario_status_check
  CHECK (status IN ('draft', 'generating', 'active', 'completed', 'error'));
