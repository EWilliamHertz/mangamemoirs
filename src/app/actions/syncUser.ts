'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, credits')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return existing;

  // Insert new user with 8 free credits
  const { data, error } = await supabase
    .from('users')
    .insert({ id: userId, email, credits: 8 })
    .select()
    .single();

  if (error) {
    console.error('syncUser insert error:', error);
    return null;
  }
  return data;
}
