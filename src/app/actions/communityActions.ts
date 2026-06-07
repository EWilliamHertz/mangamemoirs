'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Fetch posts, optionally filtered by type
export async function getCommunityPosts(filterType: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false });
  
  if (filterType !== 'all') {
    query = query.eq('content_type', filterType);
  }

  const { data: posts, error } = await query;
  if (error) throw new Error(error.message);

  // Check which posts the current user has liked
  const { data: userLikes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId);

  const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

  return posts.map(post => ({
    ...post,
    hasLiked: likedPostIds.has(post.id)
  }));
}

// Toggle a Like on a post
export async function toggleLike(postId: string, currentHasLiked: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  if (currentHasLiked) {
    // Unlike
    await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
    await supabase.rpc('decrement_like', { row_id: postId }); // We will mock this with a direct update for now
    
    // Direct update fallback if RPC isn't set up
    const { data } = await supabase.from('community_posts').select('likes_count').eq('id', postId).single();
    await supabase.from('community_posts').update({ likes_count: Math.max(0, (data?.likes_count || 1) - 1) }).eq('id', postId);
    
    return { liked: false };
  } else {
    // Like
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    
    // Direct update fallback
    const { data } = await supabase.from('community_posts').select('likes_count').eq('id', postId).single();
    await supabase.from('community_posts').update({ likes_count: (data?.likes_count || 0) + 1 }).eq('id', postId);
    
    return { liked: true };
  }
}