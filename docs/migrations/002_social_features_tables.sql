-- Migration: Add Social Features Tables
-- Version: 1.0
-- Date: December 6, 2025
-- Description: Add friend connections, sharing, activity feed, and collaboration

-- ============================================
-- 1. USER FRIENDS
-- ============================================

CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  CHECK (user_id != friend_user_id),
  UNIQUE(user_id, friend_user_id)
);

CREATE INDEX idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX idx_user_friends_friend_id ON user_friends(friend_user_id);
CREATE INDEX idx_user_friends_status ON user_friends(status);

COMMENT ON TABLE user_friends IS 'Friend connections (bidirectional)';
COMMENT ON COLUMN user_friends.status IS 'pending, accepted, blocked';

-- ============================================
-- 2. SHARED ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  shared_with_user_id UUID,
  item_type VARCHAR(100) NOT NULL,
  item_id UUID NOT NULL,
  permission_level VARCHAR(50) DEFAULT 'view',
  share_token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_shared_items_owner ON shared_items(owner_user_id);
CREATE INDEX idx_shared_items_recipient ON shared_items(shared_with_user_id);
CREATE INDEX idx_shared_items_token ON shared_items(share_token);
CREATE INDEX idx_shared_items_item ON shared_items(item_type, item_id);

COMMENT ON TABLE shared_items IS 'Shared evaluations, plans, reports';
COMMENT ON COLUMN shared_items.item_type IS 'evaluation, build_plan, report, etc.';
COMMENT ON COLUMN shared_items.permission_level IS 'view, edit, admin';
COMMENT ON COLUMN shared_items.share_token IS 'Public share link token (if shared_with_user_id is NULL)';

-- ============================================
-- 3. USER ACTIVITY FEED
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link_url TEXT,
  is_public BOOLEAN DEFAULT true,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_activity_feed_user_id ON user_activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON user_activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_is_public ON user_activity_feed(is_public);

COMMENT ON TABLE user_activity_feed IS 'Social activity feed (achievements, milestones, shares)';
COMMENT ON COLUMN user_activity_feed.activity_type IS 'achievement_unlocked, friend_joined, milestone, shared_item, etc.';

-- ============================================
-- 4. COLLABORATIVE DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS collaborative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(100) NOT NULL,
  document_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB,
  version INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  locked_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collab_docs_owner ON collaborative_documents(owner_user_id);
CREATE INDEX idx_collab_docs_type ON collaborative_documents(document_type);
CREATE INDEX idx_collab_docs_doc_id ON collaborative_documents(document_id);

COMMENT ON TABLE collaborative_documents IS 'Real-time collaborative editing sessions';
COMMENT ON COLUMN collaborative_documents.content IS 'Y.js CRDT document state';
COMMENT ON COLUMN collaborative_documents.version IS 'Document version number';

-- ============================================
-- 5. DOCUMENT COLLABORATORS
-- ============================================

CREATE TABLE IF NOT EXISTS document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'editor',
  cursor_position JSONB,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_doc_collaborators_doc_id ON document_collaborators(document_id);
CREATE INDEX idx_doc_collaborators_user_id ON document_collaborators(user_id);
CREATE INDEX idx_doc_collaborators_last_seen ON document_collaborators(last_seen_at DESC);

COMMENT ON TABLE document_collaborators IS 'Users with access to collaborative documents';
COMMENT ON COLUMN document_collaborators.role IS 'viewer, editor, admin';
COMMENT ON COLUMN document_collaborators.cursor_position IS 'Real-time cursor position {line, column, selection}';

-- ============================================
-- 6. DOCUMENT COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES document_comments(id),
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_by_user_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_doc_comments_doc_id ON document_comments(document_id);
CREATE INDEX idx_doc_comments_user_id ON document_comments(user_id);
CREATE INDEX idx_doc_comments_parent ON document_comments(parent_comment_id);
CREATE INDEX idx_doc_comments_resolved ON document_comments(resolved);

COMMENT ON TABLE document_comments IS 'Threaded comments on collaborative documents';
COMMENT ON COLUMN document_comments.parent_comment_id IS 'NULL for top-level comments, set for replies';

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_collaborative_documents_updated_at
  BEFORE UPDATE ON collaborative_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update document version on content change
CREATE OR REPLACE FUNCTION increment_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_collab_doc_version
  BEFORE UPDATE ON collaborative_documents
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_version();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(p_user_id UUID, p_friend_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_friendship_id UUID;
BEGIN
  -- Prevent self-friending
  IF p_user_id = p_friend_user_id THEN
    RAISE EXCEPTION 'Cannot send friend request to yourself';
  END IF;

  -- Check if friendship already exists
  SELECT id INTO v_friendship_id
  FROM user_friends
  WHERE (user_id = p_user_id AND friend_user_id = p_friend_user_id)
     OR (user_id = p_friend_user_id AND friend_user_id = p_user_id);

  IF v_friendship_id IS NOT NULL THEN
    RAISE EXCEPTION 'Friend request already exists';
  END IF;

  -- Create friend request
  INSERT INTO user_friends (user_id, friend_user_id, status)
  VALUES (p_user_id, p_friend_user_id, 'pending')
  RETURNING id INTO v_friendship_id;

  RETURN v_friendship_id;
END;
$$ LANGUAGE plpgsql;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_friends
  SET 
    status = 'accepted',
    accepted_at = now()
  WHERE id = p_request_id AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_name VARCHAR,
  status VARCHAR,
  since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN uf.user_id = p_user_id THEN uf.friend_user_id
      ELSE uf.user_id
    END as friend_id,
    '' as friend_name, -- Would join with users table in production
    uf.status,
    uf.accepted_at as since
  FROM user_friends uf
  WHERE (uf.user_id = p_user_id OR uf.friend_user_id = p_user_id)
    AND uf.status = 'accepted';
END;
$$ LANGUAGE plpgsql;

-- Function to create share link
CREATE OR REPLACE FUNCTION create_share_link(
  p_owner_user_id UUID,
  p_item_type VARCHAR,
  p_item_id UUID,
  p_permission_level VARCHAR DEFAULT 'view',
  p_expires_days INTEGER DEFAULT 30
)
RETURNS VARCHAR AS $$
DECLARE
  v_share_token VARCHAR;
BEGIN
  -- Generate random token
  v_share_token := encode(gen_random_bytes(32), 'base64');
  v_share_token := replace(v_share_token, '/', '_');
  v_share_token := replace(v_share_token, '+', '-');

  -- Create share link
  INSERT INTO shared_items (
    owner_user_id,
    item_type,
    item_id,
    permission_level,
    share_token,
    expires_at
  )
  VALUES (
    p_owner_user_id,
    p_item_type,
    p_item_id,
    p_permission_level,
    v_share_token,
    now() + (p_expires_days || ' days')::INTERVAL
  );

  RETURN v_share_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Policies for user_friends
CREATE POLICY "Users can view own friend requests"
  ON user_friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

CREATE POLICY "Users can send friend requests"
  ON user_friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can accept friend requests"
  ON user_friends FOR UPDATE
  USING (auth.uid() = friend_user_id AND status = 'pending');

-- Policies for shared_items
CREATE POLICY "Users can view items shared with them"
  ON shared_items FOR SELECT
  USING (
    auth.uid() = owner_user_id 
    OR auth.uid() = shared_with_user_id
    OR share_token IS NOT NULL
  );

CREATE POLICY "Users can create shares"
  ON shared_items FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Policies for user_activity_feed
CREATE POLICY "Users can view public activity"
  ON user_activity_feed FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own activity"
  ON user_activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for collaborative_documents
CREATE POLICY "Users can view own documents"
  ON collaborative_documents FOR SELECT
  USING (
    auth.uid() = owner_user_id
    OR EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = collaborative_documents.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents"
  ON collaborative_documents FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Collaborators can edit documents"
  ON collaborative_documents FOR UPDATE
  USING (
    auth.uid() = owner_user_id
    OR EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = collaborative_documents.id
        AND user_id = auth.uid()
        AND role IN ('editor', 'admin')
    )
  );

-- Policies for document_collaborators
CREATE POLICY "Collaborators can view themselves"
  ON document_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM collaborative_documents
      WHERE id = document_collaborators.document_id
        AND owner_user_id = auth.uid()
    )
  );

-- Policies for document_comments
CREATE POLICY "Collaborators can view comments"
  ON document_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = document_comments.document_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can add comments"
  ON document_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = document_comments.document_id
        AND user_id = auth.uid()
    )
  );
