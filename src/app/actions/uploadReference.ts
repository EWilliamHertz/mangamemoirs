'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function mimeToRefType(mime: string): 'pdf' | 'text' | 'image' | 'video' {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'text';
}

/**
 * Save reference metadata to database.
 * File must be uploaded directly from browser to Supabase Storage first.
 * This avoids Vercel's 4.5MB serverless function payload limit.
 */
export async function saveReferenceMetadata(
  fileUrl: string,
  fileName: string,
  mimeType: string,
  name?: string,
  category?: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized: must be logged in');

    console.log(`[saveReferenceMetadata] Creating DB record for: ${fileName}, userId: ${userId}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Insert into references table
    const insertPayload = {
      user_id: userId,
      name: name || fileName,
      type: mimeToRefType(mimeType),
      category: category || 'object',
      file_url: fileUrl,
    };
    console.log(`[saveReferenceMetadata] Inserting into references table:`, insertPayload);

    const { data, error } = await supabase
      .from('references')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error(`[saveReferenceMetadata] Database insert error:`, error);
      throw new Error(`Database save failed: ${error.message}`);
    }

    console.log(`[saveReferenceMetadata] Success:`, data);
    return data;
  } catch (err) {
    console.error('[saveReferenceMetadata] Fatal error:', err);
    throw err;
  }
}

/**
 * @deprecated Use saveReferenceMetadata instead (browser uploads to storage directly)
 * Kept for backward compatibility during migration
 */
export async function uploadReference(
  formData: FormData,
  name?: string,
  category?: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized: must be logged in');

    const file = formData.get('file') as File | null;
    if (!file) throw new Error('No file provided');

    console.log(`[uploadReference] Starting upload for file: ${file.name} (${file.type}), userId: ${userId}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upload file to Supabase Storage
    const storagePath = `${userId}/${Date.now()}-${file.name}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[uploadReference] Uploading to storage: ${storagePath} (${buffer.length} bytes)`);

    const { error: uploadError } = await supabase.storage
      .from('references')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error(`[uploadReference] Storage upload error:`, uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log(`[uploadReference] Storage upload successful`);

    // Get public URL
    const { data: urlData } = supabase.storage.from('references').getPublicUrl(storagePath);
    const fileUrl = urlData?.publicUrl ?? '';
    console.log(`[uploadReference] Public URL: ${fileUrl}`);

    // Insert into references table using correct schema columns
    const insertPayload = {
      user_id: userId,
      name: name || file.name,
      type: mimeToRefType(file.type),
      category: category || 'object',
      file_url: fileUrl,
    };
    console.log(`[uploadReference] Inserting into references table:`, insertPayload);

    const { data, error } = await supabase
      .from('references')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error(`[uploadReference] Database insert error:`, error);
      // Clean up storage on DB failure
      await supabase.storage.from('references').remove([storagePath]);
      throw new Error(`Database save failed: ${error.message}`);
    }

    console.log(`[uploadReference] Success:`, data);
    return data;
  } catch (err) {
    console.error('[uploadReference] Fatal error:', err);
    throw err;
  }
}
