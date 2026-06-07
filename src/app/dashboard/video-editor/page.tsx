import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOrCreateDefaultProject } from '@/app/actions/getOrCreateProject';
import VideoEditor from '@/components/editors/VideoEditor';

export default async function VideoEditorPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const projectId = await getOrCreateDefaultProject();
  return <VideoEditor projectId={projectId} />;
}
