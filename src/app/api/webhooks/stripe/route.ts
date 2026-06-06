import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-04-30.basil' });

const PACKS: Record<string, number> = { starter: 20, creator: 75, studio: 250 };

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });

  const body = await req.text();
  const headerPayload = await headers();
  const sig = headerPayload.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { user_id, pack, credits } = session.metadata ?? {};
    if (!user_id || !pack) return NextResponse.json({ ok: true });

    const amount = Number(credits) || PACKS[pack] || 0;
    if (!amount) return NextResponse.json({ ok: true });

    const db = createServerClient();
    const { data: user } = await db.from('users').select('credits').eq('id', user_id).single();
    const newCredits = (user?.credits ?? 0) + amount;
    await db.from('users').update({ credits: newCredits }).eq('id', user_id);
    await db.from('credit_transactions').insert({
      user_id, amount, type: 'purchase',
      description: `Purchased ${pack} pack (${amount} credits)`,
    });
  }

  return NextResponse.json({ received: true });
}
