'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function addReference(
  projectId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  storagePath: string
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthorized: must be logged in');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key on server
  );

  const { data, error } = await supabase
    .from('references')
    .insert({
      project_id: projectId,
      user_id: userId,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    throw new Error(`Failed to save reference: ${error.message}`);
  }

  return data;
}
