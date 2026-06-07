'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function uploadReference(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const file = formData.get('file') as File;
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;

  if (!file || !name) throw new Error('Missing file or name');

  // Use Service Role to guarantee bypass of RLS for both Storage and DB
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('references')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('references').getPublicUrl(fileName);

    // 2. Insert DB Metadata
    const { data: dbData, error: dbError } = await supabase
      .from('references')
      .insert({
        user_id: userId,
        name: name,
        category: category || 'Character',
        image_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    return { success: true, reference: dbData };
  } catch (error: any) {
    console.error('[uploadReference] Fatal Error:', error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }
}