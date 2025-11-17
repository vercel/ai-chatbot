-- Seed default workspace roles and guarantee at least one admin membership per workspace
-- Generated on 2025-11-13

do $$
declare
    workspace_record record;
begin
    for workspace_record in select id from public.workspaces loop
        insert into public.roles (workspace_id, id, label, description, level)
        values
            (workspace_record.id, 'admin', 'Admin', 'Full access to all workspace features', 100),
            (workspace_record.id, 'dev', 'Developer', 'Developer access for automations and integrations', 60),
            (workspace_record.id, 'staff', 'Staff', 'Operational access for day-to-day activities', 40),
            (workspace_record.id, 'user', 'User', 'Basic access for end users', 20)
        on conflict (workspace_id, id) do nothing;
    end loop;
end;
$$;

with first_membership as (
    select distinct on (workspace_id)
        id
    from public.workspace_users
    order by workspace_id, created_at
)
update public.workspace_users wu
set role_id = 'admin'
from first_membership fm
where wu.id = fm.id
  and coalesce(wu.role_id, '') <> 'admin';

