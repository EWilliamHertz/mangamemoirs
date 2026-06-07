'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';

// Define the input interface
export interface MangaPanelInput {
  prompt: string;
  isColored?: boolean;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | string;
  provider?: 'hf' | 'banana';
  referenceImageUrls?: string[];
}

// Initialize with the token explicitly
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY as string);

export async function generateMangaPanel(input: MangaPanelInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Credit Logic
  const cost = input.provider === 'banana' ? 3 : 1;
  const { data: user, error: userErr } = await supabase.from('users').select('credits').eq('id', userId).single();
  
  if (userErr || !user) throw new Error('User not found');
  if (user.credits < cost) throw new Error(`Insufficient credits (Need ${cost})`);

  // 2. Prompt Construction
  const style = input.isColored 
    ? "vibrant full color manga, high quality anime key visual, masterpiece" 
    : "black and white manga panel, high contrast ink, screentone, seinen manga, masterpiece";
  const fullPrompt = `${input.prompt}, ${style}`;

  try {
    let imageUrl = '';

    if (input.provider === 'banana') {
      throw new Error("Banana provider configuration required.");
    } else {
      // 3. Fix: Call the model with explicit token auth via the SDK
      const response = await hf.textToImage({
        model: 'stabilityai/stable-diffusion-3.5-large',
        inputs: fullPrompt,
        parameters: { 
          negative_prompt: 'blurry, low quality, distorted, ugly',
          num_inference_steps: 25
        }
      });

      // 4. Save to Storage
      const buffer = Buffer.from(await (response as Blob).arrayBuffer());
      const fileName = `${userId}/panel_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('references')
        .upload(fileName, buffer, { contentType: 'image/png' });
        
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('references').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    // 5. Automatically save to Library (Community Feed)
    await supabase.from('community_posts').insert({
      user_id: userId,
      author_name: 'Creator',
      content_type: 'manga-pictures',
      media_url: imageUrl,
      caption: input.prompt
    });

    // 6. Deduct Credits
    await supabase.from('users').update({ credits: user.credits - cost }).eq('id', userId);
    
    return { 
      imageUrl, 
      creditsUsed: cost, 
      remainingCredits: user.credits - cost 
    };
  } catch (err: any) {
    console.error("Generation Error Details:", err);
    throw new Error(err.message || "Failed to generate");
  }
}