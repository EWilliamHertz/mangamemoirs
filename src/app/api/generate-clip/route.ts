import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { CREDIT_COSTS } from '@/lib/credits';
import { NextResponse } from 'next/server';

// Uses Replicate's AnimateDiff or WanVideo model for anime clips
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!REPLICATE_TOKEN) return NextResponse.json({ error: 'Video generation not configured. Add REPLICATE_API_TOKEN to your environment.' }, { status: 503 });

  const db = createServerClient();
  const { data: user } = await db.from('users').select('credits').eq('id', userId).single();
  if (!user || user.credits < CREDIT_COSTS.CLIP)
    return NextResponse.json({ error: 'Insufficient credits', credits: user?.credits ?? 0 }, { status: 402 });

  const { sceneId, visualPrompt, style, panelUrl } = await req.json();

  const prompt = `${style || 'anime'} style, ${visualPrompt}, fluid motion, cinematic camera movement, 5 seconds, high quality anime video`;

  // Start Replicate prediction (wan-video or animatediff-lightning)
  const startRes = await fetch('https://api.replicate.com/v1/models/wan-ai/wan-2.1-t2v-480p/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        prompt: prompt.slice(0, 500),
        negative_prompt: 'blurry, low quality, static, watermark',
        num_frames: 120, // ~5s at 24fps
        guidance_scale: 7.5,
        ...(panelUrl ? { image: panelUrl } : {}),
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    return NextResponse.json({ error: `Video service error: ${err}` }, { status: 500 });
  }

  const prediction = await startRes.json();

  // Deduct credits immediately
  await db.from('users').update({ credits: user.credits - CREDIT_COSTS.CLIP }).eq('id', userId);
  await db.from('credit_transactions').insert({
    user_id: userId, amount: -CREDIT_COSTS.CLIP,
    type: 'clip_generation', description: `Anime clip: ${(visualPrompt ?? '').slice(0, 60)}`,
  });

  const { data: updatedUser } = await db.from('users').select('credits').eq('id', userId).single();
  return NextResponse.json({
    predictionId: prediction.id,
    status: prediction.status,
    creditsRemaining: updatedUser?.credits ?? 0,
  });
}

// Poll for completion
export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const predictionId = searchParams.get('id');
  if (!predictionId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
  });
  const data = await pollRes.json();

  const clipUrl = Array.isArray(data.output) ? data.output[0] : (data.output ?? null);
  return NextResponse.json({ status: data.status, clipUrl, error: data.error });
}
