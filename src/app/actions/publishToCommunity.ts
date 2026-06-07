'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function publishToCommunity(imageUrl: string, caption: string, type: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Insert into Community Feed
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: userId,
      author_name: 'Creator', // In next iteration, fetch from user profile
      content_type: type, // 'manga-pictures' | 'anime-shorts'
      media_url: imageUrl,
      caption: caption,
      likes_count: 0
    })
    .select()
    .single();

  if (error) throw new Error('Failed to publish to community');
  return data;
}