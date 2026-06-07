'use server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function shareToCommunity(mediaUrl: string, caption: string, contentType: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return await supabase.from('community_posts').insert({
    user_id: userId,
    author_name: 'Creator',
    content_type: contentType,
    media_url: mediaUrl,
    caption: caption
  });
}