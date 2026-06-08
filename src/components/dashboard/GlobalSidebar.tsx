'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Clapperboard, BookOpen, Settings, LayoutTemplate, Users, Globe, Wand2, FileText } from 'lucide-react';

export default function GlobalSidebar() {
  const pathname = usePathname();



  const navItems = [
    { href: '/dashboard', icon: Sparkles, label: 'Manga Studio' },
    { href: '/dashboard/pdf-to-manga', icon: FileText, label: 'PDF to Manga' },
    { href: '/dashboard/manga-editor', icon: LayoutTemplate, label: 'Manga Compiler' },
    { href: '/dashboard/anime-creator', icon: Wand2, label: 'Anime Creator' },
    { href: '/dashboard/anime-editor', icon: Clapperboard, label: 'Anime Editor' },
    { href: '/dashboard/references', icon: Users, label: 'References' },
    { href: '/dashboard/teams', icon: Users, label: 'Teams' },
    { href: '/dashboard/community', icon: Globe, label: 'Community' },
    { href: '/dashboard/library', icon: BookOpen, label: 'Library' },
  ];
  return (
    <nav className="w-20 h-full border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col items-center py-6 z-50 shadow-2xl shrink-0">
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-plasma to-bloom rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center font-bold text-white text-xl">
          M
        </div>
      </div>

      <div className="space-y-4 flex-1 w-full flex flex-col items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} title={item.label}>
              <div className={`p-3 rounded-xl transition-all ${isActive ? 'bg-plasma/20 text-plasma shadow-[0_0_15px_rgba(var(--color-plasma),0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      <Link href="/dashboard/settings" title="Settings">
        <div className="p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-6 h-6" />
        </div>
      </Link>
    </nav>
  );
}