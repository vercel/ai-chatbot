-- Workspace & RBAC schema for multi-tenant support
-- Generated on 2025-11-11
SET check_function_bodies = OFF;

-- Helper to maintain updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
BEGIN
    NEW.updated_at = timezone('UTC', now());
    RETURN new;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.workspaces(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text,
    owner_user_id uuid REFERENCES auth.users(id),
    mode text NOT NULL DEFAULT 'hosted' CHECK (mode IN ('local', 'hosted')),
    metadata jsonb NOT NULL DEFAULT '{}' ::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.workspace_users(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}' ::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    UNIQUE (workspace_id, user_id, ROLE)
);

CREATE TABLE IF NOT EXISTS public.workspace_invites(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    roles text[] NOT NULL CHECK (cardinality(roles) > 0),
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    email text,
    user_id uuid,
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    accepted_at timestamptz,
    CONSTRAINT workspace_invites_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.workspace_apps(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('postgres', 'neon', 'planetscale', 'zapier')),
    credential_ref text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}' ::jsonb,
    created_at timestamptz NOT NULL DEFAULT timezone('UTC', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('UTC', now())
);

CREATE INDEX IF NOT EXISTS workspace_apps_workspace_id_idx ON public.workspace_apps(workspace_id);

CREATE INDEX IF NOT EXISTS workspace_users_workspace_id_idx ON public.workspace_users(workspace_id);

CREATE INDEX IF NOT EXISTS workspace_users_user_id_idx ON public.workspace_users(user_id);

CREATE INDEX IF NOT EXISTS workspace_invites_workspace_id_idx ON public.workspace_invites(workspace_id);

CREATE TRIGGER set_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_workspace_users_updated_at
    BEFORE UPDATE ON public.workspace_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_workspace_apps_updated_at
    BEFORE UPDATE ON public.workspace_apps
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Session helpers adapted from Supabase tenant RBAC template
CREATE OR REPLACE FUNCTION public.db_pre_request()
    RETURNS void
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $function$
DECLARE
    workspace_roles jsonb;
BEGIN
    SELECT
        raw_app_meta_data -> 'workspaces' INTO workspace_roles
    FROM
        auth.users
    WHERE
        id = auth.uid();
    PERFORM
        set_config('request.workspaces', coalesce(workspace_roles, '{}'::jsonb)::text, FALSE);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_workspace_claims()
    RETURNS jsonb
    LANGUAGE sql
    STABLE
    SET search_path = public
    AS $function$
    SELECT
        coalesce(current_setting('request.workspaces', TRUE)::jsonb, auth.jwt() -> 'app_metadata' -> 'workspaces')::jsonb;
$function$;

CREATE OR REPLACE FUNCTION public.jwt_is_expired()
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE
    SET search_path = public
    AS $function$
BEGIN
    RETURN extract(epoch FROM now()) > coalesce(auth.jwt() ->> 'exp', '0')::numeric;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_workspace_role(p_workspace_id uuid, p_role text)
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE
    SET search_path = public
    AS $function$
DECLARE
    auth_role text := auth.role();
    has_role boolean;
BEGIN
    IF auth_role = 'authenticated' THEN
        IF public.jwt_is_expired() THEN
            RAISE EXCEPTION 'invalid_jwt'
                USING hint = 'jwt is expired or missing';
            END IF;
            SELECT
                coalesce((public.get_user_workspace_claims() -> p_workspace_id::text ? p_role), FALSE) INTO has_role;
            RETURN has_role;
        ELSIF auth_role = 'anon' THEN
            RETURN FALSE;
        ELSE
            IF SESSION_USER = 'postgres' THEN
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_workspace_member(p_workspace_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE
    SET search_path = public
    AS $function$
DECLARE
    auth_role text := auth.role();
    is_member boolean;
BEGIN
    IF auth_role = 'authenticated' THEN
        IF public.jwt_is_expired() THEN
            RAISE EXCEPTION 'invalid_jwt'
                USING hint = 'jwt is expired or missing';
            END IF;
            SELECT
                coalesce(public.get_user_workspace_claims() ? p_workspace_id::text, FALSE) INTO is_member;
            RETURN is_member;
        ELSIF auth_role = 'anon' THEN
            RETURN FALSE;
        ELSE
            IF SESSION_USER = 'postgres' THEN
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END IF;
END;
$function$;

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
    _role text := coalesce(NEW.role, OLD.role);
    _role_old text := coalesce(OLD.role, NEW.role);
    _raw_app_meta_data jsonb;
BEGIN
    IF _workspace_id IS DISTINCT FROM _workspace_id_old OR _user_id IS DISTINCT FROM _user_id_old THEN
        RAISE EXCEPTION 'Changing user_id or workspace_id is not allowed';
    END IF;
    SELECT
        raw_app_meta_data INTO _raw_app_meta_data
    FROM
        auth.users
    WHERE
        id = _user_id;
    _raw_app_meta_data := coalesce(_raw_app_meta_data, '{}'::jsonb);
    IF (tg_op = 'DELETE') OR (tg_op = 'UPDATE' AND _role IS DISTINCT FROM _role_old) THEN
        _raw_app_meta_data := jsonb_set(_raw_app_meta_data, '{workspaces}', jsonb_strip_nulls(coalesce(_raw_app_meta_data -> 'workspaces', '{}'::jsonb) || jsonb_build_object(_workspace_id,(
                        SELECT
                            jsonb_agg(val)
                        FROM jsonb_array_elements_text(coalesce(_raw_app_meta_data -> 'workspaces' ->(_workspace_id), '[]'::jsonb)) AS vals(val)
                        WHERE
                            val <> _role_old))));
    END IF;
    IF (tg_op = 'INSERT') OR (tg_op = 'UPDATE' AND _role IS DISTINCT FROM _role_old) THEN
        _raw_app_meta_data := jsonb_set(_raw_app_meta_data, '{workspaces}', coalesce(_raw_app_meta_data -> 'workspaces', '{}'::jsonb) || jsonb_build_object(_workspace_id,(
                    SELECT
                        jsonb_agg(DISTINCT val)
                    FROM (
                        SELECT
                            val
                        FROM jsonb_array_elements_text(coalesce(_raw_app_meta_data -> 'workspaces' ->(_workspace_id), '[]'::jsonb)) AS vals(val)
                UNION
                SELECT
                    _role) AS combined_roles(val))));
    END IF;
    UPDATE
        auth.users
    SET
        raw_app_meta_data = _raw_app_meta_data
    WHERE
        id = _user_id;
    IF tg_op = 'DELETE' THEN
        RETURN old;
    END IF;
    RETURN new;
END;
$function$;

CREATE TRIGGER on_workspace_user_change
    AFTER INSERT OR UPDATE OR DELETE ON public.workspace_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workspace_roles();

ALTER ROLE authenticator SET pgrst.db_pre_request = 'db_pre_request';

NOTIFY pgrst,
'reload config';

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_apps ENABLE ROW LEVEL SECURITY;

