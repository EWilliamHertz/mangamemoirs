'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

export interface AnimeClipInput {
  prompt: string;
  motion?:number;
  duration?: number; // 1-15 seconds, or -1 for intelligent
  resolution?: '480p' | '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9' | 'adaptive';
  generateAudio?: boolean;
  // Optional first/last frame control
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  // Reference media (up to 9 images, 3 videos, 3 audios)
  referenceImageUrls?: string[];
  referenceVideoUrls?: string[];
  referenceAudioUrls?: string[];
  seed?: number;
}

export interface AnimeClipResult {
  videoUrl: string;
  duration: number;
  creditsUsed: number;
  remainingCredits: number;
}

// Credits: 2 per 5-second clip. Scale with duration.
function calcCredits(durationSec: number): number {
  return Math.max(2, Math.ceil((durationSec / 5) * 2));
}

export async function generateAnimeClip(input: AnimeClipInput): Promise<AnimeClipResult> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const duration = input.duration ?? 5;
  const creditsNeeded = calcCredits(duration === -1 ? 10 : duration);

  // Check credits
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !user) throw new Error('User not found');
  if (user.credits < creditsNeeded) {
    throw new Error(`Insufficient credits — need ${creditsNeeded} credits for a ${duration}s clip`);
  }

  // Build enhanced prompt for anime style
  const stylePrefix = 'anime cinematic style, fluid animation, rich colors, expressive characters, ';
  const fullPrompt = `${stylePrefix}${input.prompt}`;

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
  });

  const replicateInput: Record<string, unknown> = {
    prompt: fullPrompt,
    duration,
    resolution: input.resolution ?? '720p',
    aspect_ratio: input.aspectRatio ?? '16:9',
    generate_audio: input.generateAudio ?? true,
    reference_images: input.referenceImageUrls ?? [],
    reference_videos: input.referenceVideoUrls ?? [],
    reference_audios: input.referenceAudioUrls ?? [],
  };

  if (input.seed !== undefined) replicateInput.seed = input.seed;

  // Note: firstFrameUrl / lastFrameUrl cannot be combined with reference_images per Seedance docs
  // If first frame provided, clear reference arrays and add image
  if (input.firstFrameUrl) {
    replicateInput.image = input.firstFrameUrl;
    replicateInput.reference_images = [];
    replicateInput.reference_videos = [];
    replicateInput.reference_audios = [];
    if (input.lastFrameUrl) {
      replicateInput.last_frame_image = input.lastFrameUrl;
    }
  }

  const output = await replicate.run('bytedance/seedance-2.0', { input: replicateInput });

  const videoUrl = typeof output === 'object' && output !== null && 'url' in output
    ? (output as { url: () => string }).url()
    : String(output);

  // Deduct credits
  const { data: updated } = await supabase
    .from('users')
    .update({ credits: user.credits - creditsNeeded })
    .eq('id', userId)
    .select('credits')
    .single();

  // Log transaction
  const actualDuration = duration === -1 ? 10 : duration;
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -creditsNeeded,
    type: 'generation',
    description: `Anime clip generation (${actualDuration}s): ${input.prompt.substring(0, 50)}...`,
  });

  return {
    videoUrl,
    duration: actualDuration,
    creditsUsed: creditsNeeded,
    remainingCredits: updated?.credits ?? user.credits - creditsNeeded,
  };
}
