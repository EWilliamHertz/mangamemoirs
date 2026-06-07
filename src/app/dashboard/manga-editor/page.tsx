import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOrCreateDefaultProject } from '@/app/actions/getOrCreateProject';
import MangaPageEditor from '@/components/editors/MangaPageEditor';

export default async function MangaEditorPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const projectId = await getOrCreateDefaultProject();
  return <MangaPageEditor projectId={projectId} />;
}
