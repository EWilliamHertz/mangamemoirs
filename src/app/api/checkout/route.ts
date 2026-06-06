import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const POLAR_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const PACKS: Record<string, { credits: number; envKey: string }> = {
  starter: { credits: 20,  envKey: 'NEXT_PUBLIC_POLAR_PRODUCT_STARTER' },
  creator: { credits: 75,  envKey: 'NEXT_PUBLIC_POLAR_PRODUCT_CREATOR' },
  studio:  { credits: 250, envKey: 'NEXT_PUBLIC_POLAR_PRODUCT_STUDIO' },
};

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!POLAR_TOKEN) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });

  const { pack } = await req.json();
  const packConfig = PACKS[pack];
  if (!packConfig) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

  const productId = process.env[packConfig.envKey];
  if (!productId) return NextResponse.json({ error: 'Product not configured' }, { status: 503 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mangamemoirs.vercel.app';

  const res = await fetch('https://api.polar.sh/v1/checkouts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${POLAR_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      success_url: `${appUrl}/dashboard?credits=added&pack=${pack}`,
      metadata: { user_id: userId, pack, credits: packConfig.credits },
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 });
  const data = await res.json();
  return NextResponse.json({ url: data.url });
}
