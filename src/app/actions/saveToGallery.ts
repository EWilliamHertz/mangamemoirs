'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';

export interface GalleryItem {
  title: string;
  description?: string;
  media_url: string;
  media_type: 'manga-panel' | 'anime-clip';
  prompt?: string;
  aspect_ratio?: string;
  is_colored?: boolean;
  generated_model: string;
  credits_used: number;
}

/**
 * Save generated content to user's gallery
 * Called after manga/anime generation completes
 */
export async function saveToGallery(item: GalleryItem) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('user_gallery')
      .insert({
        user_id: userId,
        title: item.title,
        description: item.description,
        media_url: item.media_url,
        media_type: item.media_type,
        prompt: item.prompt,
        aspect_ratio: item.aspect_ratio,
        is_colored: item.is_colored,
        generated_model: item.generated_model,
        credits_used: item.credits_used,
        is_shared: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Gallery save error:', error);
      throw error;
    }

    return { success: true, galleryId: data.id };
  } catch (error) {
    console.error('Failed to save to gallery:', error);
    // Don't throw - let generation complete even if gallery save fails
    return { success: false, error: String(error) };
  }
}

/**
 * Get user's gallery items
 */
export async function getUserGallery(
  mediaType?: 'manga-panel' | 'anime-clip' | 'all'
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    let query = supabase
      .from('user_gallery')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (mediaType && mediaType !== 'all') {
      query = query.eq('media_type', mediaType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, items: data || [] };
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    return { success: false, items: [], error: String(error) };
  }
}

/**
 * Share a gallery item to community
 * Updates the item to is_shared = true and creates community post
 */
export async function shareGalleryToCommunity(
  galleryId: string,
  caption: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get gallery item
    const { data: galleryItem, error: fetchError } = await supabase
      .from('user_gallery')
      .select('*')
      .eq('id', galleryId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !galleryItem) {
      throw new Error('Gallery item not found');
    }

    // Get user's display name from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const userName = clerkUser?.username || clerkUser?.firstName || 'Creator';

    // Create community post
    const { data: communityPost, error: postError } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        title: caption || galleryItem.title,
        description: caption || galleryItem.description,
        media_url: galleryItem.media_url,
        media_type: galleryItem.media_type,
      })
      .select()
      .single();

    if (postError) throw postError;

    // Update gallery item to mark as shared
    const { error: updateError } = await supabase
      .from('user_gallery')
      .update({
        is_shared: true,
        community_post_id: communityPost.id,
      })
      .eq('id', galleryId);

    if (updateError) throw updateError;

    return { success: true, communityPostId: communityPost.id };
  } catch (error) {
    console.error('Failed to share to community:', error);
    throw error;
  }
}

/**
 * Delete gallery item
 */
export async function deleteGalleryItem(galleryId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabase
      .from('user_gallery')
      .delete()
      .eq('id', galleryId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to delete gallery item:', error);
    throw error;
  }
}
