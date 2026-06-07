import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncUser } from '@/app/actions/syncUser';
import { getOrCreateDefaultProject } from '@/app/actions/getOrCreateProject';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();

  // Ensure user row exists in Supabase and get/create default project
  const dbUser = await syncUser();
  const projectId = await getOrCreateDefaultProject();

  const firstName = user?.firstName ?? 'User';
  const credits = dbUser?.credits ?? 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, {firstName}</h1>
          <p className="text-gray-400">Create your manga masterpieces</p>
        </div>

        {/* Credits Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 text-white shadow-xl">
            <div className="text-sm font-medium text-purple-200 mb-2">Available Credits</div>
            <div className="text-4xl font-bold">{credits}</div>
            <div className="text-sm text-purple-300 mt-2">Panel = 3cr · 5s clip = 2cr</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-6 text-white shadow-xl">
            <div className="text-sm font-medium text-pink-200 mb-2">AI Models Active</div>
            <div className="text-4xl font-bold">2</div>
            <div className="text-sm text-pink-300 mt-2">Nano Banana · Seedance 2.0</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-xl">
            <div className="text-sm font-medium text-blue-200 mb-2">References</div>
            <div className="text-4xl font-bold">—</div>
            <div className="text-sm text-blue-300 mt-2">Upload below to get started</div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <DashboardTabs userId={userId} projectId={projectId} credits={credits} />
      </div>
    </div>
  );
}
