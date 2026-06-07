'use client';

import { useState } from 'react';

interface Scene {
  id: string;
  title: string;
  description: string;
  quote?: string;
  panelPrompt?: string;
  clipPrompt?: string;
  tags?: string[];
}

interface SceneEditorProps {
  scene: Scene;
  onSave: (updated: Scene) => void;
  onCancel: () => void;
}

export default function SceneEditor({ scene, onSave, onCancel }: SceneEditorProps) {
  const [edited, setEdited] = useState(scene);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setEdited({
        ...edited,
        tags: [...(edited.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEdited({
      ...edited,
      tags: (edited.tags || []).filter((t) => t !== tag),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-white">Edit Scene</h2>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scene Title
            </label>
            <input
              type="text"
              value={edited.title}
              onChange={(e) => setEdited({ ...edited, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={edited.description}
              onChange={(e) =>
                setEdited({ ...edited, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500"
            />
          </div>

          {/* Quote */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quote (Optional)
            </label>
            <input
              type="text"
              value={edited.quote || ''}
              onChange={(e) => setEdited({ ...edited, quote: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500"
              placeholder="Add a memorable quote from this scene..."
            />
          </div>

          {/* Manga Panel Prompt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🖼️ Manga Panel Prompt
            </label>
            <textarea
              value={edited.panelPrompt || ''}
              onChange={(e) =>
                setEdited({ ...edited, panelPrompt: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500"
              placeholder="Detailed prompt for generating manga panel art..."
            />
          </div>

          {/* Anime Clip Prompt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🎬 Anime Clip Prompt
            </label>
            <textarea
              value={edited.clipPrompt || ''}
              onChange={(e) =>
                setEdited({ ...edited, clipPrompt: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500"
              placeholder="Detailed prompt for generating 5-second anime video..."
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (Reference Categories)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                }}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500"
                placeholder="e.g., protagonist, forest, antagonist..."
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(edited.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-purple-200"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(edited)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
