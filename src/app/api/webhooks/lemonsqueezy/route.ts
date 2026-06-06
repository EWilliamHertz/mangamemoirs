import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface LSOrderPayload {
  meta: {
    event_name: string;
    custom_data?: { clerk_user_id?: string; credits?: number; pack?: string };
  };
  data: {
    attributes: {
      status: string;
    };
  };
}

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '';
  const rawBody = await req.text();
  const sig = req.headers.get('x-signature') ?? '';

  // Verify signature
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (secret && sig !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LSOrderPayload;
  const { event_name, custom_data } = payload.meta;

  if (event_name === 'order_created' && payload.data.attributes.status === 'paid') {
    const userId  = custom_data?.clerk_user_id;
    const credits = Number(custom_data?.credits ?? 0);

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    const currentCredits = (profile as { credits?: number } | null)?.credits ?? 0;

    await supabase
      .from('profiles')
      .update({ credits: currentCredits + credits })
      .eq('id', userId);
  }

  return NextResponse.json({ received: true });
}
