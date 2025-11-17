-- Pages system schema (renamed from legacy Views)
-- Generated on 2025-11-13
-- Creates the pages table used by the dynamic Pages builder runtime.

create table if not exists public.pages (
    id text primary key,
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    name text not null,
    description text,
    layout jsonb not null default '{}'::jsonb,
    blocks jsonb not null default '[]'::jsonb,
    settings jsonb not null default '{}'::jsonb,
    created_by uuid references public.users(id),
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists pages_workspace_id_idx on public.pages (workspace_id);
create index if not exists pages_created_by_idx on public.pages (created_by);

alter table public.pages
    add constraint pages_name_not_empty check (char_length(btrim(coalesce(name, ''))) > 0);

alter table public.pages enable row level security;

-- RLS: Page data is scoped to its workspace.
drop policy if exists pages_select on public.pages;
create policy pages_select
on public.pages
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists pages_modify on public.pages;
create policy pages_modify
on public.pages
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

comment on table public.pages is 'Dynamic page layout definitions (formerly views).';

