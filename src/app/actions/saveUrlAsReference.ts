'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function saveUrlAsReference(url: string, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('references')
    .insert({
      user_id: userId,
      name: name,
      category: 'Character',
      image_url: url,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);

  return { success: true, reference: data };
}