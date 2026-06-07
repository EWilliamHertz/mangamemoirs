'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReferencesUpload from './ReferencesUpload';
import StoryboardBuilder from './StoryboardBuilder';
import GenerationStudio from './GenerationStudio';

type TabId = 'references' | 'storyboard' | 'generate' | 'editors';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'references', label: 'References',  icon: '📎' },
  { id: 'storyboard', label: 'Storyboard',  icon: '📖' },
  { id: 'generate',   label: 'Generate',    icon: '✨' },
  { id: 'editors',    label: 'Editors',     icon: '🎨' },
];

export default function DashboardTabs({
  userId,
  projectId,
  credits,
}: {
  userId: string;
  projectId: string;
  credits: number;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('references');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 font-bold text-lg transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-b-purple-500 text-purple-400'
                  : 'border-b-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'references' && (
          <ReferencesUpload userId={userId} projectId={projectId} />
        )}

        {activeTab === 'storyboard' && (
          <StoryboardBuilder projectId={projectId} />
        )}

        {activeTab === 'generate' && (
          <GenerationStudio initialCredits={credits} />
        )}

        {activeTab === 'editors' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Creative Editors</h2>
            <p className="text-gray-400 mb-8">
              Arrange and polish your generated content into a final product.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Video Editor card */}
              <div
                onClick={() => router.push('/dashboard/video-editor')}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-purple-500 rounded-2xl p-6 cursor-pointer group transition-all hover:shadow-xl hover:shadow-purple-900/30"
              >
                <div className="text-5xl mb-4">🎬</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">
                  Video Editor
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Arrange anime clips on a timeline. Control per-clip audio, add background music,
                  set fade-in & fade-out, and export a finished video.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>🎵 Background music upload</li>
                  <li>🌅 Per-clip audio fade in/out</li>
                  <li>🖱 Drag clips on timeline</li>
                  <li>🔊 Master &amp; per-clip volume</li>
                  <li>📤 Export with FFmpeg</li>
                </ul>
                <div className="mt-5 text-sm font-bold text-purple-400 group-hover:text-purple-300 transition">
                  Open Editor →
                </div>
              </div>

              {/* Manga Page Editor card */}
              <div
                onClick={() => router.push('/dashboard/manga-editor')}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-pink-500 rounded-2xl p-6 cursor-pointer group transition-all hover:shadow-xl hover:shadow-pink-900/30"
              >
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition">
                  Manga Chapter Editor
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Compose manga panels into comic-book pages. Pick layouts, drag panels into slots,
                  set reading order, and export as PDF.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>📐 7 page layout presets</li>
                  <li>🖱 Drag-and-drop panels</li>
                  <li>🔢 Reading order numbers</li>
                  <li>↔ Left-to-right / Right-to-left toggle</li>
                  <li>📄 Export as PDF</li>
                </ul>
                <div className="mt-5 text-sm font-bold text-pink-400 group-hover:text-pink-300 transition">
                  Open Editor →
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
