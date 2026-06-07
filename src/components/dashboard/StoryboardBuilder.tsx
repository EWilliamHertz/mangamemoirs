'use client';

import { useState } from 'react';
import { generateStoryboard } from '@/app/actions/generateStoryboard';
import { ChevronRight, Plus, Zap } from 'lucide-react';

interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  memoirExcerpt: string;
  mangaPrompt: string;
  animePrompt: string;
  referenceIds: string[];
  suggestedStyle?: string;
  estimatedDuration?: number;
}

interface Storyboard {
  title: string;
  totalScenes: number;
  estimatedCreditsNeeded: {
    mangaPanels: number;
    animeClips: number;
  };
  scenes: Scene[];
}

export default function StoryboardBuilder({
  userId,
  projectId,
  uploadedReferences,
}: {
  userId: string;
  projectId: string;
  uploadedReferences: { id: string; file_name: string }[];
}) {
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoirText, setMemoirText] = useState('');

  const handleGenerateStoryboard = async () => {
    if (!uploadedReferences.length && !memoirText.trim()) {
      setError('Please upload references or paste memoir text');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateStoryboard({
        projectId,
        referenceIds: uploadedReferences.map(r => r.id),
        memoirContent: memoirText || undefined,
        numScenes: 3,
        style: 'manga',
      });

      if (result.success) {
        setStoryboard(result.storyboard);
        if (result.storyboard.scenes.length > 0) {
          setSelectedScene(result.storyboard.scenes[0]);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to generate storyboard: ${errorMsg}`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!storyboard) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">📖 Storyboard Builder</h2>
          <p className="text-gray-400">
            Transform your memoir into a manga or anime storyboard with AI-generated scene prompts
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Memoir Text Input */}
        <div className="mb-6">
          <label className="block text-white font-bold mb-3">
            📝 Paste Memoir Text (or use uploaded references)
          </label>
          <textarea
            value={memoirText}
            onChange={e => setMemoirText(e.target.value)}
            placeholder="Paste your memoir excerpt or story here. The AI will break it into scenes and generate manga/anime prompts..."
            className="w-full h-32 p-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-400 focus:outline-none resize-none"
          />
          <p className="text-gray-400 text-sm mt-2">
            Minimum 100 characters recommended for best results
          </p>
        </div>

        {/* Uploaded References */}
        {uploadedReferences.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-bold mb-3">📎 Uploaded References</h3>
            <div className="flex flex-wrap gap-2">
              {uploadedReferences.map(ref => (
                <div
                  key={ref.id}
                  className="px-3 py-1 bg-purple-600 bg-opacity-30 border border-purple-500 rounded-full text-sm text-purple-200"
                >
                  ✓ {ref.file_name}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              PDFs and images will be analyzed for additional context
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateStoryboard}
          disabled={isGenerating || (!memoirText.trim() && !uploadedReferences.length)}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⚙️</span>
              Generating Storyboard...
            </>
          ) : (
            <>
              <Zap size={20} />
              Generate Storyboard
            </>
          )}
        </button>
      </div>
    );
  }

  // Storyboard Display
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{storyboard.title}</h2>
          <p className="text-gray-400">
            {storyboard.totalScenes} scenes • {storyboard.estimatedCreditsNeeded.mangaPanels} credits for manga •{' '}
            {storyboard.estimatedCreditsNeeded.animeClips} credits for anime
          </p>
        </div>
        <button
          onClick={() => setStoryboard(null)}
          className="text-gray-400 hover:text-white transition"
        >
          ← Edit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Scene List (Left) */}
        <div className="col-span-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-750">
            <h3 className="text-white font-bold">Scenes</h3>
          </div>
          <div className="overflow-y-auto max-h-96">
            {storyboard.scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setSelectedScene(scene)}
                className={`w-full text-left p-4 border-b border-gray-700 transition hover:bg-gray-700 ${
                  selectedScene?.id === scene.id ? 'bg-purple-900 bg-opacity-50 border-l-2 border-l-purple-400' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-purple-300">Scene {scene.sceneNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    scene.suggestedStyle === 'anime'
                      ? 'bg-blue-900 bg-opacity-50 text-blue-200'
                      : 'bg-orange-900 bg-opacity-50 text-orange-200'
                  }`}>
                    {scene.suggestedStyle || 'manga'}
                  </span>
                </div>
                <p className="text-sm text-white font-medium truncate">{scene.title}</p>
                <p className="text-xs text-gray-400 line-clamp-2 mt-1">{scene.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scene Detail (Right) */}
        {selectedScene && (
          <div className="col-span-2 space-y-6">
            {/* Title & Description */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{selectedScene.title}</h3>
              <p className="text-gray-300 text-sm mb-4">{selectedScene.description}</p>
              <div className="bg-gray-700 rounded p-3">
                <p className="text-gray-400 text-sm italic">"{selectedScene.memoirExcerpt}"</p>
              </div>
            </div>

            {/* Manga Prompt */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">🖼️ Manga Panel Prompt</h4>
                  <p className="text-gray-400 text-sm">Use this to generate manga art</p>
                </div>
                <button className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition">
                  Generate Panel
                </button>
              </div>
              <div className="bg-gray-700 rounded p-4 text-white">
                <p>{selectedScene.mangaPrompt}</p>
              </div>
            </div>

            {/* Anime Prompt */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">🎬 Anime Clip Prompt</h4>
                  <p className="text-gray-400 text-sm">
                    {selectedScene.estimatedDuration}s clip • Generate video
                  </p>
                </div>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition">
                  Generate Clip
                </button>
              </div>
              <div className="bg-gray-700 rounded p-4 text-white">
                <p>{selectedScene.animePrompt}</p>
              </div>
            </div>

            {/* Tags/References */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h4 className="text-lg font-bold text-white mb-3">🏷️ Scene References</h4>
              <p className="text-gray-400 text-sm mb-3">Tag people, animals, places, and objects in this scene</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 rounded border border-dashed border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-300 transition text-sm">
                  <Plus size={14} className="inline mr-1" /> Add Reference Tag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
