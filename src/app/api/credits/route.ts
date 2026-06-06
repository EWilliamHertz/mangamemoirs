import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { SIGNUP_BONUS } from '@/lib/credits';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();

  await db
    .from('users')
    .upsert({ id: userId, credits: SIGNUP_BONUS }, { onConflict: 'id', ignoreDuplicates: true });

  const { data: user } = await db.from('users').select('credits').eq('id', userId).single();
  return NextResponse.json({ credits: user?.credits ?? 0 });
}
