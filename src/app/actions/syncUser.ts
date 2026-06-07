'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, email, credits: 8 }, { onConflict: 'id', ignoreDuplicates: true })
    .select()
    .single();

  if (error) {
    console.error('syncUser error:', error);
    return null;
  }
  return data;
}
