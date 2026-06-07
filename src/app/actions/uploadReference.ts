'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function mimeToRefType(mime: string): 'pdf' | 'text' | 'image' | 'video' {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'text';
}

export async function uploadReference(
  formData: FormData,
  name?: string,
  category?: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: must be logged in');

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file provided');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Upload file to Supabase Storage
  const storagePath = `${userId}/${Date.now()}-${file.name}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await supabase.storage
    .from('references')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // Get public URL
  const { data: urlData } = supabase.storage.from('references').getPublicUrl(storagePath);
  const fileUrl = urlData?.publicUrl ?? '';

  // Insert into references table using correct schema columns
  const { data, error } = await supabase
    .from('references')
    .insert({
      user_id: userId,
      name: name || file.name,
      type: mimeToRefType(file.type),
      category: category || 'object',
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) {
    // Clean up storage on DB failure
    await supabase.storage.from('references').remove([storagePath]);
    throw new Error(`Database save failed: ${error.message}`);
  }

  return data;
}
