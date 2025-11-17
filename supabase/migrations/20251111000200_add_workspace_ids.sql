-- Add workspace_id to tenant-scoped tables
-- Generated on 2025-11-11
DO $$
DECLARE
    default_workspace_id uuid;
BEGIN
    SELECT
        id INTO default_workspace_id
    FROM
        public.workspaces
    WHERE
        slug = 'default';
    IF default_workspace_id IS NULL THEN
        default_workspace_id := gen_random_uuid();
        INSERT INTO public.workspaces(id, name, slug, mode)
            VALUES (default_workspace_id, 'Default Workspace', 'default', 'local');
    END IF;
    -- chats
    ALTER TABLE public.chats
        ADD COLUMN IF NOT EXISTS workspace_id uuid;
    UPDATE
        public.chats
    SET
        workspace_id = default_workspace_id
    WHERE
        workspace_id IS NULL;
    ALTER TABLE public.chats
        ALTER COLUMN workspace_id SET NOT NULL;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'chats_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE public.chats
        ADD CONSTRAINT chats_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
END IF;
    -- messages
    ALTER TABLE public.messages
        ADD COLUMN IF NOT EXISTS workspace_id uuid;
    UPDATE
        public.messages m
    SET
        workspace_id = c.workspace_id
    FROM
        public.chats c
    WHERE
        m.chat_id = c.id
        AND m.workspace_id IS NULL;
    UPDATE
        public.messages
    SET
        workspace_id = default_workspace_id
    WHERE
        workspace_id IS NULL;
    ALTER TABLE public.messages
        ALTER COLUMN workspace_id SET NOT NULL;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'messages_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE public.messages
        ADD CONSTRAINT messages_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
END IF;
    -- documents
    ALTER TABLE public.documents
        ADD COLUMN IF NOT EXISTS workspace_id uuid;
    UPDATE
        public.documents
    SET
        workspace_id = default_workspace_id
    WHERE
        workspace_id IS NULL;
    ALTER TABLE public.documents
        ALTER COLUMN workspace_id SET NOT NULL;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'documents_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE public.documents
        ADD CONSTRAINT documents_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
END IF;
    -- suggestions
    ALTER TABLE public.suggestions
        ADD COLUMN IF NOT EXISTS workspace_id uuid;
    UPDATE
        public.suggestions s
    SET
        workspace_id = d.workspace_id
    FROM
        public.documents d
    WHERE
        s.document_id = d.id
        AND s.document_created_at = d.created_at
        AND s.workspace_id IS NULL;
    UPDATE
        public.suggestions
    SET
        workspace_id = default_workspace_id
    WHERE
        workspace_id IS NULL;
    ALTER TABLE public.suggestions
        ALTER COLUMN workspace_id SET NOT NULL;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'suggestions_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE public.suggestions
        ADD CONSTRAINT suggestions_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
END IF;
    -- streams
    ALTER TABLE public.streams
        ADD COLUMN IF NOT EXISTS workspace_id uuid;
    UPDATE
        public.streams s
    SET
        workspace_id = c.workspace_id
    FROM
        public.chats c
    WHERE
        s.chat_id = c.id
        AND s.workspace_id IS NULL;
    UPDATE
        public.streams
    SET
        workspace_id = default_workspace_id
    WHERE
        workspace_id IS NULL;
    ALTER TABLE public.streams
        ALTER COLUMN workspace_id SET NOT NULL;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'streams_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE public.streams
        ADD CONSTRAINT streams_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
END IF;
    -- votes
    ALTER TABLE public.votes
        ADD COLUMN IF NOT EXISTS workspace_id uuid;
    UPDATE
        public.votes v
    SET
        workspace_id = c.workspace_id
    FROM
        public.chats c
    WHERE
        v.chat_id = c.id
        AND v.workspace_id IS NULL;
    UPDATE
        public.votes
    SET
        workspace_id = default_workspace_id
    WHERE
        workspace_id IS NULL;
    ALTER TABLE public.votes
        ALTER COLUMN workspace_id SET NOT NULL;
    IF NOT EXISTS (
        SELECT
            1
        FROM
            pg_constraint
        WHERE
            conname = 'votes_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE public.votes
        ADD CONSTRAINT votes_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
END IF;
END;
$$;

