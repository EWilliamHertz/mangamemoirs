import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (browser) — uses anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side — uses service role key to bypass RLS
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type Database = {
  users: {
    id: string;
    email: string | null;
    credits: number;
    created_at: string;
  };
  references: {
    id: string;
    user_id: string;
    name: string;
    type: 'pdf' | 'text' | 'image' | 'video';
    content: string | null;
    file_url: string | null;
    thumbnail_url: string | null;
    created_at: string;
  };
  projects: {
    id: string;
    user_id: string;
    title: string;
    story: string;
    style: string;
    mood: string;
    created_at: string;
  };
  scenes: {
    id: string;
    project_id: string;
    user_id: string;
    index: number;
    description: string;
    visual_prompt: string;
    mood: string;
    panel_type: string;
    panel_url: string | null;
    clip_url: string | null;
    created_at: string;
  };
  credit_transactions: {
    id: string;
    user_id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
  };
};
