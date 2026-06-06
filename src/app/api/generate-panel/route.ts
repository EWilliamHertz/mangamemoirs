import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { CREDIT_COSTS } from '@/lib/credits';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return _openai;
}

const STYLE_PREFIXES: Record<string, string> = {
  shonen:    'shonen manga panel, dynamic action lines, bold ink, high energy, Toriyama/Kishimoto style,',
  shojo:     'shojo manga panel, soft lines, floral backgrounds, expressive eyes, Takeuchi/Watase style,',
  seinen:    'seinen manga, detailed realistic art, dark atmosphere, Berserk/Vagabond style,',
  ghibli:    'Studio Ghibli anime style, painterly backgrounds, warm colors, Miyazaki aesthetic,',
  cyberpunk: 'cyberpunk anime panel, neon lighting, rain, dystopian cityscapes, Ghost in the Shell style,',
  webtoon:   'Korean webtoon style, full color, clean lines, vertical scroll panel,',
  classic:   'classic black and white manga panel, screentone shading, Tezuka Osamu style,',
  anime:     'anime key visual, vibrant colors, cinematic composition, high-detail illustration,',
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();

  const { data: user } = await db.from('users').select('credits').eq('id', userId).single();
  if (!user || user.credits < CREDIT_COSTS.PANEL)
    return NextResponse.json({ error: 'Insufficient credits', credits: user?.credits ?? 0 }, { status: 402 });

  const { sceneId, visualPrompt, style, mood, panelType } = await req.json();

  const stylePrefix = STYLE_PREFIXES[style?.toLowerCase()] ?? STYLE_PREFIXES.anime;
  const fullPrompt = `${stylePrefix} ${visualPrompt}, ${mood || 'dramatic'} mood, ${panelType || 'full-page'} composition, manga panel border, high quality illustration`;

  const response = await getOpenAI().images.generate({
    model: 'dall-e-3',
    prompt: fullPrompt.slice(0, 4000),
    size: '1024x1024',
    quality: 'hd',
    style: 'vivid',
    n: 1,
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });

  await db.from('users').update({ credits: user.credits - CREDIT_COSTS.PANEL }).eq('id', userId);
  await db.from('credit_transactions').insert({
    user_id: userId, amount: -CREDIT_COSTS.PANEL,
    type: 'panel_generation', description: `Panel generated: ${(visualPrompt ?? '').slice(0, 60)}`,
  });

  if (sceneId) {
    await db.from('scenes').update({ panel_url: imageUrl }).eq('id', sceneId).eq('user_id', userId);
  }

  const { data: updatedUser } = await db.from('users').select('credits').eq('id', userId).single();
  return NextResponse.json({ imageUrl, creditsRemaining: updatedUser?.credits ?? 0 });
}
