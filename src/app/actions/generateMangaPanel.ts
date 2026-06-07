'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export interface MangaPanelInput {
  prompt: string;
  isColored?: boolean;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | string;
  resolution?: string;
  style?: string;
  referenceImageUrls?: string[];
  provider?: 'hf' | 'banana';
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

 // 1. Check credits based on provider
  const cost = input.provider === 'banana' ? 3 : 1;
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .maybeSingle();

  if (userErr || !user) throw new Error('User not found');
  if (user.credits < cost) throw new Error(`Insufficient credits — need ${cost} credits for this provider.`);

  // 2. Build the Auto-Prompt for SD3
  const stylePrompt = input.isColored
    ? "vibrant full color manga, high quality anime key visual, studio madhouse, vivid lighting, masterpiece"
    : "black and white manga panel, high contrast ink, screentone, detailed linework, traditional seinen manga, masterpiece";

  const fullPrompt = `${input.prompt}, ${stylePrompt}`;

  // 3. Call Hugging Face API (Stable Diffusion 3.5 Large)
  const hfToken = process.env.HUGGINGFACE_API_KEY;
  if (!hfToken) throw new Error('Missing HUGGINGFACE_API_KEY environment variable');

  // Calculate dimensions based on requested aspect ratio
  const width = input.aspectRatio === 'landscape' ? 1024 : (input.aspectRatio === 'square' ? 1024 : 768);
  const height = input.aspectRatio === 'landscape' ? 768 : 1024;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large",
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          width: width,
          height: height,
          guidance_scale: 6.5,
          num_inference_steps: 25
        }
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} ${errText}`);
  }

  // 4. Convert HF binary response and upload to Supabase Storage
  const imageBuffer = await response.arrayBuffer();
  const fileName = `${userId}/panel_${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from('references')
    .upload(fileName, imageBuffer, { contentType: 'image/png' });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // Retrieve permanent public URL
  const { data: urlData } = supabase.storage.from('references').getPublicUrl(fileName);
  const imageUrl = urlData.publicUrl;

  // 5. Deduct 1 credit
  const { data: updated } = await supabase
    .from('users')
    .update({ credits: user.credits - 1 })
    .eq('id', userId)
    .select('credits')
    .single();

  return {
    imageUrl,
    creditsUsed: 1,
    remainingCredits: updated?.credits ?? user.credits - 1,
  };
}