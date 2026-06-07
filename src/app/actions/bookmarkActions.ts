'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export interface SceneBookmark {
  id: string;
  userId: string;
  projectId: string;
  sceneId: string;
  sceneName: string;
  notes: string;
  tags: string[];
  createdAt: string;
}

export async function toggleBookmarkScene(
  projectId: string,
  sceneId: string,
  sceneName: string,
  isBookmarked: boolean,
  notes?: string,
  tags?: string[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (isBookmarked) {
    // Remove bookmark
    const { error } = await supabase
      .from('scene_bookmarks')
      .delete()
      .eq('sceneId', sceneId)
      .eq('userId', userId);
    if (error) throw error;
  } else {
    // Add bookmark
    const bookmark: SceneBookmark = {
      id: crypto.randomUUID(),
      userId,
      projectId,
      sceneId,
      sceneName,
      notes: notes || '',
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('scene_bookmarks')
      .insert([bookmark]);
    if (error) throw error;
  }
}

export async function getBookmarkedScenes(projectId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('scene_bookmarks')
    .select('*')
    .eq('projectId', projectId)
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateBookmarkNotes(
  sceneId: string,
  notes: string,
  tags: string[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('scene_bookmarks')
    .update({ notes, tags })
    .eq('sceneId', sceneId)
    .eq('userId', userId);

  if (error) throw error;
}
