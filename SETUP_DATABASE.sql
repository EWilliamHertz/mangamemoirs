-- =====================================================
-- OURIYE PLATFORM — Complete Supabase Schema (FIXED)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- USERS (synced from Clerk via webhook)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 8,
  total_credits_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- REFERENCES (PDFs, images, videos, text) — quoted as reserved keyword
-- =====================================================
CREATE TABLE IF NOT EXISTS "references" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf','text','image','video')),
  category TEXT DEFAULT 'object' CHECK (category IN ('character','animal','scene','object')),
  content TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TEAMS (for collaboration)
-- =====================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- TEAM MEMBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner','editor','viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- =====================================================
-- PROJECTS (a story + style settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  story TEXT,
  style TEXT DEFAULT 'Anime',
  mood TEXT DEFAULT 'Dramatic',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SCENES (belong to a project)
-- =====================================================
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  index INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  visual_prompt TEXT,
  mood TEXT DEFAULT 'dramatic',
  panel_type TEXT DEFAULT 'full-page',
  panel_url TEXT,
  clip_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- USER GALLERY (all generated content)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  prompt TEXT,
  aspect_ratio TEXT,
  is_colored BOOLEAN DEFAULT false,
  generated_model TEXT,
  credits_used INT DEFAULT 0,
  is_shared BOOLEAN DEFAULT false,
  community_post_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- COMMUNITY POSTS (shared content)
-- =====================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  gallery_id UUID REFERENCES user_gallery(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- CREDIT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- VOUCHERS (admin feature)
-- =====================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ADMIN USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin','moderator')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ── Users ────────────────────────────────────────
CREATE POLICY "users_can_view_own_profile" ON users FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "public_can_view_usernames" ON users FOR SELECT
  USING (true);

-- ── References ────────────────────────────────────
CREATE POLICY "users_can_view_own_references" ON "references" FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_insert_own_references" ON "references" FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_delete_own_references" ON "references" FOR DELETE
  USING (user_id = auth.uid()::text);

-- ── Teams ────────────────────────────────────────
CREATE POLICY "users_can_view_their_teams" ON teams FOR SELECT
  USING (owner_id = auth.uid()::text OR id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()::text
  ));

CREATE POLICY "users_can_create_teams" ON teams FOR INSERT
  WITH CHECK (owner_id = auth.uid()::text);

-- ── Team Members ────────────────────────────────
CREATE POLICY "team_members_can_view_members" ON team_members FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE owner_id = auth.uid()::text
    UNION
    SELECT team_id FROM team_members WHERE user_id = auth.uid()::text
  ));

-- ── Projects ────────────────────────────────────
CREATE POLICY "users_can_view_own_projects" ON projects FOR SELECT
  USING (user_id = auth.uid()::text OR team_id IN (
    SELECT id FROM teams WHERE owner_id = auth.uid()::text
  ));

CREATE POLICY "users_can_create_projects" ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- ── Scenes ──────────────────────────────────────
CREATE POLICY "users_can_view_own_scenes" ON scenes FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_create_scenes" ON scenes FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- ── User Gallery ────────────────────────────────
CREATE POLICY "users_can_view_own_gallery" ON user_gallery FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_insert_own_gallery" ON user_gallery FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_update_own_gallery" ON user_gallery FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "users_can_delete_own_gallery" ON user_gallery FOR DELETE
  USING (user_id = auth.uid()::text);

CREATE POLICY "public_can_view_shared_gallery" ON user_gallery FOR SELECT
  USING (is_shared = true);

-- ── Community Posts ─────────────────────────────
CREATE POLICY "public_can_view_community" ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "users_can_create_community_posts" ON community_posts FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_can_delete_own_posts" ON community_posts FOR DELETE
  USING (user_id = auth.uid()::text);

-- ── Credit Transactions ────────────────────────
CREATE POLICY "users_can_view_own_transactions" ON credit_transactions FOR SELECT
  USING (user_id = auth.uid()::text);

-- ── Vouchers ────────────────────────────────────
CREATE POLICY "admins_can_view_vouchers" ON vouchers FOR SELECT
  USING (created_by = auth.uid()::text OR auth.uid()::text IN (
    SELECT id FROM admin_users
  ));

-- ── Admin Users ─────────────────────────────────
CREATE POLICY "admins_can_view_admins" ON admin_users FOR SELECT
  USING (true);

-- =====================================================
-- STORAGE BUCKETS (references, media, etc.)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('references', 'references', true, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('media', 'media', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE RLS POLICIES (references bucket)
-- =====================================================
CREATE POLICY "Allow authenticated users to upload references" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'references' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow public read access to references" ON storage.objects
  FOR SELECT USING (bucket_id = 'references');

CREATE POLICY "Allow users to delete own reference files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'references' 
    AND auth.uid()::text = owner
  );

-- =====================================================
-- STORAGE RLS POLICIES (media bucket)
-- =====================================================
CREATE POLICY "Allow authenticated users to upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow public read access to media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Allow users to delete own media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' 
    AND auth.uid()::text = owner
  );

-- =====================================================
-- INDEXES (for performance)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_references_user ON "references"(user_id);
CREATE INDEX IF NOT EXISTS idx_references_type ON "references"(type);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_user ON scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_team ON scenes(team_id);
CREATE INDEX IF NOT EXISTS idx_gallery_user ON user_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_team ON user_gallery(team_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created ON user_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_shared ON user_gallery(is_shared);
CREATE INDEX IF NOT EXISTS idx_gallery_media_type ON user_gallery(media_type);
CREATE INDEX IF NOT EXISTS idx_community_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_team ON community_posts(team_id);
CREATE INDEX IF NOT EXISTS idx_community_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================
-- Insert sample user (replace with your Clerk ID)
-- INSERT INTO users (id, email, username, credits)
-- VALUES ('user_YOUR_CLERK_ID', 'you@example.com', 'yourname', 8)
-- ON CONFLICT DO NOTHING;
