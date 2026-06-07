-- FIX: Change user_id columns from UUID to TEXT to match Clerk's string user IDs

-- Drop the foreign key constraints first
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE "references" DROP CONSTRAINT IF EXISTS references_user_id_fkey;

-- Change user.id from UUID to TEXT
ALTER TABLE users 
  DROP CONSTRAINT users_pkey,
  ALTER COLUMN id TYPE TEXT;

ALTER TABLE users
  ADD PRIMARY KEY (id);

-- Change user_id columns in other tables to TEXT
ALTER TABLE projects ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE "references" ALTER COLUMN user_id TYPE TEXT;

-- Re-add foreign key constraints
ALTER TABLE projects 
  ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE "references" 
  ADD CONSTRAINT references_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify the changes
SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('users', 'projects', 'references') AND column_name = 'user_id' OR (table_name = 'users' AND column_name = 'id');
