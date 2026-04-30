-- Normalize model slugs from the legacy million-ai entry to Scale AI PRO
UPDATE public.prompts_algoritmo_milionario
SET model_slug = 'scale-ai-pro'
WHERE model_slug = 'million-ai-1.0';

UPDATE public.agents_algoritmo_milionario
SET default_model = 'scale-ai-pro'
WHERE default_model = 'million-ai-1.0';
