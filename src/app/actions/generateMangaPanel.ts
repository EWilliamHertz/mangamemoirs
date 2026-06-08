'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { saveToGallery } from './saveToGallery';

// Define the input interface
export interface MangaPanelInput {
  prompt: string;
  isColored?: boolean;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | string;
  provider?: 'replicate' | 'banana';
  referenceImageUrls?: string[];
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateMangaPanel(input: MangaPanelInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Get user & check credits
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (userErr || !user) throw new Error('User not found');
    
    const cost = input.provider === 'banana' ? 3 : 3; // Replicate costs 3 credits
    if (user.credits < cost) {
      throw new Error(`Insufficient credits (Need ${cost}, Have ${user.credits})`);
    }

    // 2. Build prompt with style
    const style = input.isColored 
      ? "vibrant full color manga, high quality anime key visual, masterpiece, beautiful composition"
      : "black and white manga panel, high contrast ink, screentone art, professional manga, masterpiece";
    
    const fullPrompt = `${input.prompt}, ${style}`;

    // 3. Generate with Replicate (using Stable Diffusion 3 for best anime/manga quality)
    let imageUrl = '';

    if (input.provider === 'banana') {
      throw new Error('Banana provider not yet configured');
    } else {
      // Use Stable Diffusion 3 via Replicate
      const output = await replicate.run(
        'stability-ai/stable-diffusion-3.5-large:5f61fcc91b7f11d29b4e675228e1489bb16eacbe8fa71b99dbccc302e8d5e5ee',
        {
          input: {
            prompt: fullPrompt,
            negative_prompt: 'blurry, low quality, distorted, ugly, nsfw',
            num_inference_steps: 28,
            guidance_scale: 7.5,
          },
        }
      ) as string[];

      if (!output || !Array.isArray(output) || output.length === 0) {
        throw new Error('No image generated from Replicate');
      }

      imageUrl = output[0];
    }

    // 4. Save to user's gallery
    const galleryResult = await saveToGallery({
      title: `Manga Panel - ${new Date().toLocaleDateString()}`,
      description: input.prompt,
      media_url: imageUrl,
      media_type: 'manga-panel',
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio || 'portrait',
      is_colored: input.isColored || false,
      generated_model: input.provider === 'banana' ? 'banana-pro' : 'stable-diffusion-3.5',
      credits_used: cost,
    });

    // 5. Deduct credits from user
    const { error: deductError } = await supabase
      .from('users')
      .update({ credits: user.credits - cost })
      .eq('id', userId);

    if (deductError) {
      console.error('Credit deduction failed:', deductError);
      // Don't throw - image was generated, just log the error
    }

    // 6. Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -cost,
      type: 'manga_generation',
      description: 'Generated manga panel',
      reference_id: galleryResult.success ? galleryResult.galleryId : undefined,
    });

    return {
      imageUrl,
      creditsUsed: cost,
      remainingCredits: user.credits - cost,
      galleryId: galleryResult.success ? galleryResult.galleryId : null,
    };
  } catch (err: any) {
    console.error('Manga generation error:', err);
    throw new Error(err.message || 'Failed to generate manga panel');
  }
}
