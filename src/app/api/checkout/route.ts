import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lemon Squeezy checkout — no Stripe needed!
// Docs: https://docs.lemonsqueezy.com/api/checkouts

const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY ?? '';
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID ?? '';

// Map pack → Lemon Squeezy variant IDs (set these after creating products in LS dashboard)
const PACKS: Record<string, { credits: number; variantId: string; label: string }> = {
  starter: { credits: 20,  variantId: process.env.LS_VARIANT_STARTER  ?? '', label: 'Starter — 20 Credits'  },
  creator: { credits: 75,  variantId: process.env.LS_VARIANT_CREATOR  ?? '', label: 'Creator — 75 Credits'  },
  studio:  { credits: 250, variantId: process.env.LS_VARIANT_STUDIO   ?? '', label: 'Studio — 250 Credits'  },
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pack } = await req.json() as { pack: string };
  const chosen = PACKS[pack];
  if (!chosen) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  if (!LS_API_KEY || !LS_STORE_ID || !chosen.variantId) {
    return NextResponse.json(
      { error: 'Payment not configured yet — contact support.' },
      { status: 503 }
    );
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: { clerk_user_id: userId, pack, credits: chosen.credits },
        },
        product_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mangamemoirs.vercel.app'}/dashboard?payment=success`,
        },
      },
      relationships: {
        store:   { data: { type: 'stores',   id: LS_STORE_ID       } },
        variant: { data: { type: 'variants',  id: chosen.variantId  } },
      },
    },
  };

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LS_API_KEY}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('LemonSqueezy error:', err);
    return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 });
  }

  const data = await res.json() as { data: { attributes: { url: string } } };
  return NextResponse.json({ url: data.data.attributes.url });
}
