import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { SIGNUP_BONUS } from '@/lib/credits';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();

  // Upsert to handle first-time users who signed up before webhook
  const { data } = await db
    .from('users')
    .upsert({ id: userId, credits: SIGNUP_BONUS }, { onConflict: 'id', ignoreDuplicates: true })
    .select('credits')
    .single();

  const { data: user } = await db.from('users').select('credits').eq('id', userId).single();
  return NextResponse.json({ credits: user?.credits ?? 0 });
}
