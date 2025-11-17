-- Allow storing OpenAI credentials inside workspace_apps.
alter table public.workspace_apps
drop constraint if exists workspace_apps_type_check;

alter table public.workspace_apps
add constraint workspace_apps_type_check
check (
  type = any (
    array['postgres', 'neon', 'planetscale', 'zapier', 'openai']
  )
);


