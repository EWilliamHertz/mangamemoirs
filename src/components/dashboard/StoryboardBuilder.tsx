'use client';

import { useState } from 'react';
import { generateStoryboard } from '@/app/actions/generateStoryboard';
import { batchGenerateContent } from '@/app/actions/batchGenerateContent';
import { toggleBookmarkScene } from '@/app/actions/bookmarkActions';
import SceneEditor from './SceneEditor';
import GenerationProgressTracker from './GenerationProgressTracker';
import BookmarkPanel from './BookmarkPanel';
import TemplateManager from './TemplateManager';

interface Scene {
  id: string;
  title: string;
  description: string;
  quote?: string;
  panelPrompt?: string;
  clipPrompt?: string;
  tags?: string[];
  bookmarked?: boolean;
  panelUrl?: string;
  clipUrl?: string;
}

interface StoryboardBuilderProps {
  projectId: string;
}

export default function StoryboardBuilder({ projectId }: StoryboardBuilderProps) {
  const [memoirText, setMemoirText] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'bookmarks'>('preview');

  const handleGenerateStoryboard = async () => {
    if (!memoirText.trim()) {
      alert('Please enter memoir text first');
      return;
    }

    try {
      setLoading(true);
      const result = await generateStoryboard({ projectId, referenceIds: [], memoirContent: memoirText });
      setScenes(result.storyboard?.scenes ?? []);
    } catch (error) {
      console.error('Failed to generate storyboard:', error);
      alert('Failed to generate storyboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (scenes.length === 0) {
      alert('Generate storyboard first');
      return;
    }

    try {
      setGenerationLoading(true);

      // Create batch tasks
      const tasks = scenes.flatMap((scene) => {
        const taskList: any[] = [];
        if (scene.panelPrompt) {
          taskList.push({
            sceneId: scene.id,
            type: 'panel',
            prompt: scene.panelPrompt,
          });
        }
        if (scene.clipPrompt) {
          taskList.push({
            sceneId: scene.id,
            type: 'clip',
            prompt: scene.clipPrompt,
          });
        }
        return taskList;
      });

      if (tasks.length === 0) {
        alert('No panels or clips to generate');
        return;
      }

      const result = await batchGenerateContent(projectId, tasks);
      setBatchProgress(result);
    } catch (error) {
      console.error('Failed to start batch generation:', error);
      alert('Failed to start generation');
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene);
  };

  const handleSaveScene = (updated: Scene) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setEditingScene(null);
  };

  const handleToggleBookmark = async (scene: Scene) => {
    try {
      await toggleBookmarkScene(
        projectId,
        scene.id,
        scene.title,
        !scene.bookmarked,
        '',
        scene.tags
      );
      setScenes((prev) =>
        prev.map((s) =>
          s.id === scene.id ? { ...s, bookmarked: !s.bookmarked } : s
        )
      );
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleLoadTemplate = (template: any) => {
    setScenes(template.sceneTemplate || []);
  };

  if (batchProgress) {
    return (
      <div className="space-y-6">
        <GenerationProgressTracker
          batchId={batchProgress.batchId}
          tasks={batchProgress.tasks}
          onComplete={() => setBatchProgress(null)}
        />
        <button
          onClick={() => setBatchProgress(null)}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          ← Back to Editor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">📖 Storyboard Builder</h2>
        <p className="text-gray-400">Transform your memoir into a visual storyboard with manga panels and anime clips.</p>
      </div>

      {/* Memoir Input */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Your Memoir</h3>
        <textarea
          value={memoirText}
          onChange={(e) => setMemoirText(e.target.value)}
          placeholder="Paste your memoir, diary entry, or story here... (or upload a PDF)"
          rows={6}
          className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none"
        />
        <button
          onClick={handleGenerateStoryboard}
          disabled={loading}
          className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? '⟳ Generating Storyboard...' : '✨ Generate Storyboard'}
        </button>
      </div>

      {/* Tabs */}
      {scenes.length > 0 && (
        <div className="flex gap-1 border-b border-gray-700 bg-gradient-to-b from-gray-800/50 to-gray-900/50 -mx-8 px-8">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 font-semibold transition-all rounded-t-lg ${
              activeTab === 'preview'
                ? 'border-b-2 border-purple-500 text-white bg-purple-600/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎬 Scenes ({scenes.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-6 py-3 font-semibold transition-all rounded-t-lg ${
              activeTab === 'bookmarks'
                ? 'border-b-2 border-purple-500 text-white bg-purple-600/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📖 Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-3 font-semibold transition-all rounded-t-lg ${
              activeTab === 'editor'
                ? 'border-b-2 border-purple-500 text-white bg-purple-600/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Templates
          </button>
        </div>
      )}

      {/* Scene Preview Tab */}
      {activeTab === 'preview' && scenes.length > 0 && (
        <div className="space-y-4">
          {scenes.map((scene, idx) => (
            <div
              key={scene.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Scene {idx + 1}: {scene.title}
                  </h3>
                  {scene.quote && (
                    <p className="text-purple-400 italic text-sm mt-1">
                      "{scene.quote}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleBookmark(scene)}
                    className={`px-3 py-1 text-sm rounded ${
                      scene.bookmarked
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {scene.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                  </button>
                  <button
                    onClick={() => handleEditScene(scene)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    ✎ Edit
                  </button>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{scene.description}</p>

              {/* Tags */}
              {scene.tags && scene.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {scene.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Manga & Anime Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {scene.panelPrompt && (
                  <div className="bg-gray-900 rounded p-3 border border-gray-700">
                    <p className="text-purple-400 text-sm font-semibold mb-2">
                      🖼️ Manga Panel
                    </p>
                    <p className="text-gray-300 text-sm">{scene.panelPrompt}</p>
                  </div>
                )}
                {scene.clipPrompt && (
                  <div className="bg-gray-900 rounded p-3 border border-gray-700">
                    <p className="text-pink-400 text-sm font-semibold mb-2">
                      🎬 Anime Clip (5 sec)
                    </p>
                    <p className="text-gray-300 text-sm">{scene.clipPrompt}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Batch Generation Button */}
          <button
            onClick={handleBatchGenerate}
            disabled={generationLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded"
          >
            {generationLoading ? '⟳ Starting Generation...' : '🚀 Generate All Panels & Clips'}
          </button>
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && scenes.length > 0 && (
        <BookmarkPanel projectId={projectId} />
      )}

      {/* Templates Tab */}
      {activeTab === 'editor' && (
        <TemplateManager
          projectId={projectId}
          scenes={scenes}
          onLoadTemplate={handleLoadTemplate}
        />
      )}

      {/* Scene Editor Modal */}
      {editingScene && (
        <SceneEditor
          scene={editingScene}
          onSave={handleSaveScene}
          onCancel={() => setEditingScene(null)}
        />
      )}
    </div>
  );
}
