import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import GenerationStudio from '@/components/dashboard/GenerationStudio';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-[#030305]">
      <GenerationStudio />
    </div>
  );
}