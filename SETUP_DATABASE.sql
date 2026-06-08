-- =====================================================
-- USER GALLERY TABLE (stores all generated content)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'manga-panel' | 'anime-clip'
  prompt TEXT,
  aspect_ratio TEXT, -- 'portrait' | 'square' | 'landscape'
  is_colored BOOLEAN DEFAULT false,
  generated_model TEXT, -- 'banana-pro' | 'seedance-2.0' | 'replicate'
  credits_used INT DEFAULT 0,
  is_shared BOOLEAN DEFAULT false, -- whether it's published to community
  community_post_id UUID, -- link to community_posts if shared
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_gallery_user_id ON user_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gallery_created_at ON user_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_gallery_media_type ON user_gallery(media_type);
CREATE INDEX IF NOT EXISTS idx_user_gallery_is_shared ON user_gallery(is_shared);

-- =====================================================
-- ENABLE RLS (Row Level Security)
-- =====================================================
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;

-- Users can view their own gallery
CREATE POLICY "users_can_view_own_gallery" ON user_gallery FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can insert their own gallery items
CREATE POLICY "users_can_insert_own_gallery" ON user_gallery FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own gallery items
CREATE POLICY "users_can_update_own_gallery" ON user_gallery FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Users can delete their own gallery items
CREATE POLICY "users_can_delete_own_gallery" ON user_gallery FOR DELETE
  USING (user_id = auth.uid()::text);

-- Public can view shared (published) items
CREATE POLICY "public_can_view_shared_gallery" ON user_gallery FOR SELECT
  USING (is_shared = true);
