import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-04-30.basil' });

const PACKS: Record<string, { credits: number; price: number; label: string }> = {
  starter: { credits: 20,  price: 499,   label: 'Starter — 20 Credits'  },
  creator: { credits: 75,  price: 1499,  label: 'Creator — 75 Credits'  },
  studio:  { credits: 250, price: 3999,  label: 'Studio — 250 Credits'  },
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });

  const { pack } = await req.json() as { pack: string };
  const packConfig = PACKS[pack];
  if (!packConfig) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mangamemoirs.vercel.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: packConfig.price,
        product_data: {
          name: `MangaMemoirs ${packConfig.label}`,
          description: `${packConfig.credits} generation credits for MangaMemoirs`,
          images: [`${appUrl}/og.png`],
        },
      },
      quantity: 1,
    }],
    metadata: { user_id: userId, pack, credits: String(packConfig.credits) },
    success_url: `${appUrl}/dashboard?credits=added&pack=${pack}`,
    cancel_url:  `${appUrl}/dashboard?credits=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
