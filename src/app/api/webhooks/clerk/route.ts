import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { SIGNUP_BONUS } from '@/lib/credits';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature)
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });

  const body = await req.text();
  const wh = new Webhook(secret);
  let evt: { type: string; data: { id: string; email_addresses?: Array<{ email_address: string }>; first_name?: string; last_name?: string } };

  try {
    evt = wh.verify(body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature }) as typeof evt;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type === 'user.created') {
    const db = createServerClient();
    const { id, email_addresses, first_name, last_name } = evt.data;
    await db.from('users').upsert({
      id,
      email: email_addresses?.[0]?.email_address ?? '',
      name: [first_name, last_name].filter(Boolean).join(' ') || null,
      credits: SIGNUP_BONUS,
    }, { onConflict: 'id', ignoreDuplicates: true });
  }

  return NextResponse.json({ received: true });
}
