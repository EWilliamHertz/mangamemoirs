import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import VideoEditor from '@/components/editors/VideoEditor';

export default async function VideoEditorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: user } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  const initialCredits = user?.credits || 0;

  return (
    <div className="h-full w-full bg-transparent">
      <VideoEditor initialCredits={initialCredits} />
    </div>
  );
}