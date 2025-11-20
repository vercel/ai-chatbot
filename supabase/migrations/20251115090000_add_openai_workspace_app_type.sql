-- Allow storing OpenAI credentials inside workspace_apps.
ALTER TABLE public.workspace_apps
    DROP CONSTRAINT IF EXISTS workspace_apps_type_check;

ALTER TABLE public.workspace_apps
    ADD CONSTRAINT workspace_apps_type_check CHECK (type = ANY (ARRAY['postgres', 'neon', 'planetscale', 'zapier', 'openai']));

