-- FIX: Change user_id columns from UUID to TEXT to match Clerk's string user IDs
-- MUST drop policies FIRST before altering column types

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can read own references" ON "references";
DROP POLICY IF EXISTS "Users can insert own references" ON "references";
DROP POLICY IF EXISTS "Users can delete own references" ON "references";

-- Drop foreign key constraints
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE "references" DROP CONSTRAINT IF EXISTS references_user_id_fkey;

-- Drop primary key on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Now alter the column types
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE projects ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE "references" ALTER COLUMN user_id TYPE TEXT;

-- Re-add primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Re-add foreign keys
ALTER TABLE projects 
  ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE "references" 
  ADD CONSTRAINT references_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Re-create RLS policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can read own projects" ON projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can read own references" ON "references" FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own references" ON "references" FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own references" ON "references" FOR DELETE USING (user_id = auth.uid());
