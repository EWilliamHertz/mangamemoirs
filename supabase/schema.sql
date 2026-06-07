-- ============================================================
-- MangaMemoirs — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Users (synced from Clerk via webhook)
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,          -- Clerk user ID
  email       TEXT,
  credits     INTEGER NOT NULL DEFAULT 8,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- References library
CREATE TABLE IF NOT EXISTS references (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('pdf','text','image','video')),
  category      TEXT DEFAULT 'object' CHECK (category IN ('character','animal','scene','object')),
  content       TEXT,                    -- extracted text / raw text
  file_url      TEXT,                    -- Supabase Storage public URL
  thumbnail_url TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects (a story + style settings)
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled Project',
  story       TEXT,
  style       TEXT DEFAULT 'Anime',
  mood        TEXT DEFAULT 'Dramatic',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenes (belong to a project)
CREATE TABLE IF NOT EXISTS scenes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  index         INTEGER NOT NULL,
  title         TEXT,
  description   TEXT,
  visual_prompt TEXT,
  mood          TEXT DEFAULT 'dramatic',
  panel_type    TEXT DEFAULT 'full-page',
  panel_url     TEXT,                    -- DALL-E 3 generated image URL
  clip_url      TEXT,                    -- Replicate video URL
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit transaction log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,          -- positive = add, negative = spend
  type        TEXT NOT NULL,             -- signup_bonus | panel_generation | clip_generation | purchase
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE references          ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically (used by Next.js API routes)

-- ── Supabase Storage bucket for references ──────────────────
-- Run this separately if it doesn't exist:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('references', 'references', true);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_references_user ON references(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_user ON scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON credit_transactions(user_id);
