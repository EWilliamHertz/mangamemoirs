import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import GlobalSidebar from '@/components/dashboard/GlobalSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex h-screen w-full bg-[#030305] overflow-hidden text-white font-sans">
      <GlobalSidebar />
      <main className="flex-1 relative overflow-hidden bg-[#030305]">
        {children}
      </main>
    </div>
  );
}
