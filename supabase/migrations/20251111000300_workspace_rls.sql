-- RLS policies for workspace-scoped tables
-- Generated on 2025-11-11

alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.suggestions enable row level security;
alter table public.streams enable row level security;
alter table public.votes enable row level security;

-- Workspaces
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select
on public.workspaces
for select
to authenticated
using (public.user_is_workspace_member(id) or public.user_has_workspace_role(id, 'admin'));

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update
on public.workspaces
for update
to authenticated
using (public.user_has_workspace_role(id, 'admin'))
with check (public.user_has_workspace_role(id, 'admin'));

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert
on public.workspaces
for insert
to authenticated
with check (true);

-- Workspace users
drop policy if exists workspace_users_select on public.workspace_users;
create policy workspace_users_select
on public.workspace_users
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists workspace_users_modify on public.workspace_users;
create policy workspace_users_modify
on public.workspace_users
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Workspace invites
drop policy if exists workspace_invites_select on public.workspace_invites;
create policy workspace_invites_select
on public.workspace_invites
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists workspace_invites_modify on public.workspace_invites;
create policy workspace_invites_modify
on public.workspace_invites
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Workspace apps
drop policy if exists workspace_apps_select on public.workspace_apps;
create policy workspace_apps_select
on public.workspace_apps
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists workspace_apps_modify on public.workspace_apps;
create policy workspace_apps_modify
on public.workspace_apps
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Chats
drop policy if exists chats_select on public.chats;
create policy chats_select
on public.chats
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists chats_modify on public.chats;
create policy chats_modify
on public.chats
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Messages
drop policy if exists messages_select on public.messages;
create policy messages_select
on public.messages
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists messages_modify on public.messages;
create policy messages_modify
on public.messages
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Documents
drop policy if exists documents_select on public.documents;
create policy documents_select
on public.documents
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists documents_modify on public.documents;
create policy documents_modify
on public.documents
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Suggestions
drop policy if exists suggestions_select on public.suggestions;
create policy suggestions_select
on public.suggestions
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists suggestions_modify on public.suggestions;
create policy suggestions_modify
on public.suggestions
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Streams
drop policy if exists streams_select on public.streams;
create policy streams_select
on public.streams
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists streams_modify on public.streams;
create policy streams_modify
on public.streams
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));

-- Votes
drop policy if exists votes_select on public.votes;
create policy votes_select
on public.votes
for select
to authenticated
using (public.user_is_workspace_member(workspace_id));

drop policy if exists votes_modify on public.votes;
create policy votes_modify
on public.votes
for all
to authenticated
using (public.user_has_workspace_role(workspace_id, 'admin'))
with check (public.user_has_workspace_role(workspace_id, 'admin'));





