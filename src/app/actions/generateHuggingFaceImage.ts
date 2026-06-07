'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';
const HF_TOKEN = process.env.HUGGING_FACE_API_TOKEN;
const CREDIT_COST = 1;

interface GenerateImageRequest {
  prompt: string;
  model?: string;
  negativePrompt?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

export async function generateHuggingFaceImage({
  prompt,
  model = 'stabilityai/stable-diffusion-3-medium',
  negativePrompt = '',
  numInferenceSteps = 25,
  guidanceScale = 7.5,
}: GenerateImageRequest) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get user and check credits
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (userError || !user) throw new Error('User not found');

  if (user.credits < CREDIT_COST) {
    throw new Error(`Insufficient credits. Need ${CREDIT_COST}, have ${user.credits}`);
  }

  if (!HF_TOKEN) {
    throw new Error('Hugging Face API token not configured');
  }

  try {
    // Call Hugging Face API
    const response = await fetch(`${HUGGING_FACE_API_URL}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: negativePrompt,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    // Response is binary image data
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Deduct credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: supabase.raw('credits - ?', [CREDIT_COST]),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -CREDIT_COST,
      type: 'generation',
      description: `Hugging Face image generation: ${prompt.substring(0, 50)}...`,
    });

    return {
      success: true,
      imageBase64: base64Image,
      creditsRemaining: user.credits - CREDIT_COST,
      prompt,
      model,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List of recommended models for manga panel generation
 */
export const RECOMMENDED_MODELS = [
  {
    id: 'stabilityai/stable-diffusion-3-medium',
    name: 'Stable Diffusion 3 Medium',
    description: 'Best quality, anime-friendly',
    speed: 'Medium',
  },
  {
    id: 'black-forest-labs/FLUX.1-dev',
    name: 'FLUX.1 Dev',
    description: 'Excellent detail, manga-style',
    speed: 'Medium',
  },
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL',
    description: 'Fast, good quality',
    speed: 'Fast',
  },
  {
    id: 'playgroundai/playground-v2.5-1024px-aesthetic',
    name: 'Playground v2.5',
    description: 'Aesthetic, vibrant colors',
    speed: 'Medium',
  },
];

/**
 * Recommended negative prompt for manga panels
 */
export const MANGA_NEGATIVE_PROMPT =
  'blurry, low quality, distorted, deformed, ugly, bad anatomy, worst quality, low effort, watermark, text, logo, signature';
