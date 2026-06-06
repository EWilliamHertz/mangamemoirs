import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PACKS: Record<string, number> = { starter: 20, creator: 75, studio: 250 };

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });

  const body = await req.text();
  const sig = req.headers.get('webhook-signature') ?? '';
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (sig !== expected) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  const event = JSON.parse(body);
  if (event.type === 'order.paid') {
    const { user_id, pack, credits } = event.data?.metadata ?? {};
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
