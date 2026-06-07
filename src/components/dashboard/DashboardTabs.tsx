'use client';

import { useState } from 'react';
import ReferencesUpload from './ReferencesUpload';
import StoryboardBuilder from './StoryboardBuilder';

interface Reference {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

interface Tab {
  id: 'references' | 'storyboard' | 'generate';
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'references', label: 'References', icon: '📎' },
  { id: 'storyboard', label: 'Storyboard', icon: '📖' },
  { id: 'generate', label: 'Generate', icon: '✨' },
];

export default function DashboardTabs({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<'references' | 'storyboard' | 'generate'>('references');
  const [uploadedReferences, setUploadedReferences] = useState<Reference[]>([]);

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
          <ReferencesUpload userId={userId} projectId="default" />
        )}

        {activeTab === 'storyboard' && (
          <StoryboardBuilder projectId="default" />
        )}

        {activeTab === 'generate' && (
          <div className="p-8">
            <div className="text-center py-24">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-3xl font-bold text-white mb-4">Generation Studio</h2>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Once you've created your storyboard, generate manga panels and anime clips scene-by-scene
              </p>
              <button
                onClick={() => setActiveTab('storyboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Create Storyboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
