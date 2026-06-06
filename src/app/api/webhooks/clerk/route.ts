import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { SIGNUP_BONUS } from '@/lib/credits';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');
  if (!svix_id || !svix_timestamp || !svix_signature)
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address ?? null;
    const db = createServerClient();

    await db.from('users').upsert({ id, email, credits: SIGNUP_BONUS }, { onConflict: 'id' });
    await db.from('credit_transactions').insert({
      user_id: id,
      amount: SIGNUP_BONUS,
      type: 'signup_bonus',
      description: `Welcome gift: ${SIGNUP_BONUS} free credits`,
    });
  }

  return NextResponse.json({ received: true });
}
