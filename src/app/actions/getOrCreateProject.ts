'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function getOrCreateDefaultProject(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Try to find an existing project
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (existing?.id) return existing.id;

  // Create a default project
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: 'My First Memoir',
      story: '',
      style: 'Anime',
      mood: 'Dramatic',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data.id;
}
