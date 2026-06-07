'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY as string);

export async function inpaintPanel(imageUrl: string, maskDataUrl: string, prompt: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  // 1. Fetch images as blobs for the HF API
  const [imageRes, maskRes] = await Promise.all([
    fetch(imageUrl).then(r => r.blob()),
    fetch(maskDataUrl).then(r => r.blob())
  ]);

  // 2. Call In-painting Model
  // Using Stable Diffusion Inpainting optimized for character correction
  const response = await hf.imageToImage({
    model: 'runwayml/stable-diffusion-inpainting',
    inputs: imageRes,
    parameters: {
      mask: maskRes,
      prompt: `${prompt}, high quality, cinematic`,
      strength: 0.6 // Adjusts how much to change the masked area
    }
  });

  // 3. Save result back to Storage
  const buffer = Buffer.from(await response.arrayBuffer());
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const fileName = `${userId}/inpaint_${Date.now()}.png`;
  await supabase.storage.from('references').upload(fileName, buffer);
  const { data } = supabase.storage.from('references').getPublicUrl(fileName);

  return { imageUrl: data.publicUrl };
}