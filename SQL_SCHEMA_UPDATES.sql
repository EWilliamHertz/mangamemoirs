-- Add metadata column to projects table (for storing templates)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create scene_bookmarks table
CREATE TABLE IF NOT EXISTS scene_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id TEXT NOT NULL,
  scene_name TEXT NOT NULL,
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, scene_id)
);

-- Create generation_progress table for batch tracking
CREATE TABLE IF NOT EXISTS generation_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  scene_id TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'panel' or 'clip'
  status TEXT DEFAULT 'pending', -- pending, generating, complete, failed
  progress INT DEFAULT 0,
  result TEXT, -- URL or content
  error TEXT,
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  UNIQUE(batch_id, scene_id, task_type)
);

-- Enable RLS on new tables
ALTER TABLE scene_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own bookmarks" ON scene_bookmarks 
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can track own generation progress" ON generation_progress 
  FOR ALL USING (user_id = auth.uid()::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scene_bookmarks_project ON scene_bookmarks(project_id);
CREATE INDEX IF NOT EXISTS idx_scene_bookmarks_user ON scene_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_progress_batch ON generation_progress(batch_id);
CREATE INDEX IF NOT EXISTS idx_generation_progress_user ON generation_progress(user_id);
