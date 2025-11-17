-- Onboarding and RBAC enhancement migration

-- 1. Extend users table with profile and personalization fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS firstname text,
  ADD COLUMN IF NOT EXISTS lastname text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS ai_context text,
  ADD COLUMN IF NOT EXISTS proficiency text,
  ADD COLUMN IF NOT EXISTS ai_tone text,
  ADD COLUMN IF NOT EXISTS ai_guidance text;

-- 2. Extend workspaces table with profile metadata
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS description text;

-- 3. Create roles table (workspace-scoped)
CREATE TABLE IF NOT EXISTS public.roles (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  id text NOT NULL,
  label text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_workspace_id_id_pk PRIMARY KEY (workspace_id, id)
);

CREATE INDEX IF NOT EXISTS roles_workspace_idx ON public.roles (workspace_id);

-- 4. Create teams table (workspace-scoped)
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teams_workspace_idx ON public.teams (workspace_id);

-- 5. Update workspace_users table to reference roles and teams
ALTER TABLE public.workspace_users
  ADD COLUMN IF NOT EXISTS role_id text,
  ADD COLUMN IF NOT EXISTS team_id uuid;

-- Seed roles based on existing workspace_users data
INSERT INTO public.roles (workspace_id, id, label, level)
SELECT DISTINCT
  workspace_id,
  role AS id,
  initcap(role) AS label,
  CASE
    WHEN lower(role) = 'admin' THEN 100
    WHEN lower(role) = 'dev' THEN 60
    WHEN lower(role) = 'staff' THEN 40
    WHEN lower(role) = 'user' THEN 20
    ELSE 10
  END AS level
FROM public.workspace_users
WHERE role IS NOT NULL
ON CONFLICT DO NOTHING;

-- Migrate existing role values into role_id
UPDATE public.workspace_users
SET role_id = COALESCE(role_id, role);

-- Remove legacy role column after migration
ALTER TABLE public.workspace_users
  DROP COLUMN IF EXISTS role;

-- Ensure role_id is present for all rows
ALTER TABLE public.workspace_users
  ALTER COLUMN role_id SET NOT NULL;

-- Add foreign key constraints and indexes
ALTER TABLE public.workspace_users
  ADD CONSTRAINT workspace_users_role_fk
    FOREIGN KEY (workspace_id, role_id)
    REFERENCES public.roles(workspace_id, id)
    ON DELETE RESTRICT;

ALTER TABLE public.workspace_users
  ADD CONSTRAINT workspace_users_team_fk
    FOREIGN KEY (team_id)
    REFERENCES public.teams(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS workspace_users_role_idx
  ON public.workspace_users (workspace_id, role_id);

CREATE INDEX IF NOT EXISTS workspace_users_team_idx
  ON public.workspace_users (team_id);

-- 6. Function to seed default roles for workspaces
CREATE OR REPLACE FUNCTION public.update_workspace_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _workspace_id text := coalesce(NEW.workspace_id, OLD.workspace_id)::text;
  _workspace_id_old text := coalesce(OLD.workspace_id, NEW.workspace_id)::text;
  _user_id uuid := coalesce(NEW.user_id, OLD.user_id);
  _user_id_old uuid := coalesce(OLD.user_id, NEW.user_id);
  _role text := coalesce(NEW.role_id, OLD.role_id);
  _role_old text := coalesce(OLD.role_id, NEW.role_id);
  _raw_app_meta_data jsonb;
BEGIN
  IF _workspace_id IS DISTINCT FROM _workspace_id_old
    OR _user_id IS DISTINCT FROM _user_id_old THEN
    RAISE EXCEPTION 'Changing user_id or workspace_id is not allowed';
  END IF;

  SELECT raw_app_meta_data
  INTO _raw_app_meta_data
  FROM auth.users
  WHERE id = _user_id;

  _raw_app_meta_data := coalesce(_raw_app_meta_data, '{}'::jsonb);

  IF (tg_op = 'DELETE')
    OR (tg_op = 'UPDATE' AND _role IS DISTINCT FROM _role_old) THEN
    _raw_app_meta_data :=
      jsonb_set(
        _raw_app_meta_data,
        '{workspaces}',
        jsonb_strip_nulls(
          coalesce(_raw_app_meta_data -> 'workspaces', '{}'::jsonb)
          || jsonb_build_object(
            _workspace_id,
            (
              SELECT jsonb_agg(val)
              FROM jsonb_array_elements_text(
                coalesce(
                  _raw_app_meta_data -> 'workspaces' -> _workspace_id,
                  '[]'::jsonb
                )
              ) AS vals(val)
              WHERE val <> _role_old
            )
          )
        )
      );
  END IF;

  IF (tg_op = 'INSERT')
    OR (tg_op = 'UPDATE' AND _role IS DISTINCT FROM _role_old) THEN
    _raw_app_meta_data :=
      jsonb_set(
        _raw_app_meta_data,
        '{workspaces}',
        coalesce(_raw_app_meta_data -> 'workspaces', '{}'::jsonb)
        || jsonb_build_object(
          _workspace_id,
          (
            SELECT jsonb_agg(DISTINCT val)
            FROM (
              SELECT val
              FROM jsonb_array_elements_text(
                coalesce(
                  _raw_app_meta_data -> 'workspaces' -> _workspace_id,
                  '[]'::jsonb
                )
              ) AS vals(val)
              UNION
              SELECT _role
            ) AS combined_roles(val)
          )
        )
      );
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = _raw_app_meta_data
  WHERE id = _user_id;

  IF tg_op = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.seed_default_roles(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.roles (workspace_id, id, label, description, level)
  VALUES
    (p_workspace_id, 'admin', 'Admin', 'Full access to all workspace features', 100),
    (p_workspace_id, 'dev', 'Developer', 'Developer-oriented access for building and automation', 60),
    (p_workspace_id, 'staff', 'Staff', 'General staff access for daily operations', 40),
    (p_workspace_id, 'user', 'User', 'Basic access for end users', 20)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Seed default roles for all existing workspaces
SELECT public.seed_default_roles(id) FROM public.workspaces;

