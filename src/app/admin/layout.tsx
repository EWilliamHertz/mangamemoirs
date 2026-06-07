import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-6">
            <a href="/admin" className="hover:text-blue-400">
              Vouchers
            </a>
            <a href="/admin/users" className="hover:text-blue-400">
              Users
            </a>
            <a href="/admin/admins" className="hover:text-blue-400">
              Admins
            </a>
            <a href="/dashboard" className="hover:text-blue-400">
              Back to App
            </a>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
