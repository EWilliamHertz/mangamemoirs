-- =====================================================
-- MIGRATION: Add team_id to existing tables
-- Run this in Supabase SQL Editor if you've already created the schema
-- =====================================================

-- Add team_id to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add team_id to user_gallery table
ALTER TABLE user_gallery
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add team_id to community_posts table
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenes_team ON scenes(team_id);
CREATE INDEX IF NOT EXISTS idx_gallery_team ON user_gallery(team_id);
CREATE INDEX IF NOT EXISTS idx_community_team ON community_posts(team_id);
