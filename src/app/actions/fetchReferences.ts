'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { nameToTag } from '@/lib/tagUtils';

export type { nameToTag };

export interface ReferenceItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'text';
  category?: 'character' | 'animal' | 'scene' | 'object';
  file_url: string;
  tag: string; // e.g. "hugo", "gloriasroom"
}

export async function fetchReferences(): Promise<ReferenceItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('references')
    .select('id, name, type, category, file_url')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    ...r,
    tag: nameToTag(r.name),
  }));
}
