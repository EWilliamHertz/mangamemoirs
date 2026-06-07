'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

export interface MangaPanelInput {
  prompt: string;
  referenceImageUrls?: string[]; // up to 14 reference images
  resolution?: '1K' | '2K' | '4K';
  aspectRatio?: 'portrait' | 'landscape' | 'square' | string;
  style?: string; // prepended to prompt
}

export interface MangaPanelResult {
  imageUrl: string;
  creditsUsed: number;
  remainingCredits: number;
}

export async function generateMangaPanel(input: MangaPanelInput): Promise<MangaPanelResult> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check credits (3 per panel)
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !user) throw new Error('User not found');
  if (user.credits < 3) throw new Error('Insufficient credits — need 3 credits per manga panel');

  // Build enhanced prompt
  const stylePrefix = input.style
    ? `${input.style} manga style, `
    : 'manga comic panel, black and white ink, detailed linework, ';

  const fullPrompt = `${stylePrefix}${input.prompt}, high quality manga artwork, dramatic composition, expressive characters`;

  // Map aspect ratio
  const aspectRatioMap: Record<string, string> = {
    portrait: '2:3',
    landscape: '3:2',
    square: '1:1',
  };
  const aspectRatio = aspectRatioMap[input.aspectRatio ?? 'portrait'] ?? input.aspectRatio ?? '2:3';

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
  });

  // Call Nano Banana Pro (google/nano-banana-pro)
  const replicateInput: Record<string, unknown> = {
    prompt: fullPrompt,
    resolution: input.resolution ?? '2K',
    aspect_ratio: aspectRatio,
    output_format: 'jpg',
    safety_filter_level: 'block_only_high',
    allow_fallback_model: true,
  };

  // Add reference images if provided
  if (input.referenceImageUrls && input.referenceImageUrls.length > 0) {
    replicateInput.image_input = input.referenceImageUrls.slice(0, 14);
  }

  const output = await replicate.run('google/nano-banana-pro', { input: replicateInput }) as unknown;

  const imageUrl = typeof output === 'string'
    ? output
    : (output as { url?: () => string }).url?.() ?? String(output);

  // Deduct 3 credits
  const { data: updated } = await supabase
    .from('users')
    .update({ credits: user.credits - 3 })
    .eq('id', userId)
    .select('credits')
    .single();

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -3,
    type: 'generation',
    description: `Manga panel generation: ${input.prompt.substring(0, 50)}...`,
  });

  return {
    imageUrl,
    creditsUsed: 3,
    remainingCredits: updated?.credits ?? user.credits - 3,
  };
}
