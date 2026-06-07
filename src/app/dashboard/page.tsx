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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2">
              <span className="inline-block text-sm font-bold tracking-widest text-purple-400 bg-purple-600/10 border border-purple-600/20 px-3 py-1.5 rounded-full mb-4">
                WELCOME BACK
              </span>
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Welcome, {firstName}</h1>
            <p className="text-gray-400 text-lg">Build stunning manga and anime from your stories</p>
          </div>
          <a href="/dashboard/credits" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
            💳 Credits
          </a>
        </div>

        {/* Credits Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-600/40 to-purple-800/40 backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border border-purple-500/30 hover:border-purple-500/60 transition-all group">
            <div className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
              ⚡ Available Credits
            </div>
            <div className="text-5xl font-black mb-3">{credits}</div>
            <div className="text-xs text-purple-300/80 space-y-1">
              <div>Manga panel: 3 cr</div>
              <div>Anime clip (5s): 2 cr</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-600/40 to-pink-800/40 backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border border-pink-500/30 hover:border-pink-500/60 transition-all group">
            <div className="text-sm font-semibold text-pink-300 mb-3 flex items-center gap-2">
              🤖 AI Models
            </div>
            <div className="text-5xl font-black mb-3">2</div>
            <div className="text-xs text-pink-300/80 space-y-1">
              <div>🎨 Nano Banana Pro</div>
              <div>🎬 Seedance 2.0</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/40 to-blue-800/40 backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border border-blue-500/30 hover:border-blue-500/60 transition-all group">
            <div className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
              📎 References
            </div>
            <div className="text-5xl font-black mb-3">—</div>
            <div className="text-xs text-blue-300/80">
              Upload images, PDFs, or videos below to get started
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <DashboardTabs userId={userId} projectId={projectId} credits={credits} />
      </div>
    </div>
  );
}
