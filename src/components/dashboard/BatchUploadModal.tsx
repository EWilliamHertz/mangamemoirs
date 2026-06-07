'use client';

import { useState } from 'react';
import { uploadReference } from '@/app/actions/uploadReference';

interface FileWithMetadata {
  file: File;
  name: string;
  category: 'character' | 'animal' | 'scene' | 'object';
  preview?: string; // data URL for images
}

interface BatchUploadModalProps {
  files: File[];
  onClose: () => void;
  onSuccess: (uploaded: any[]) => void;
}

const CATEGORIES = [
  { value: 'character', label: '👤 Character', color: 'border-blue-500 bg-blue-50' },
  { value: 'animal', label: '🐾 Animal', color: 'border-green-500 bg-green-50' },
  { value: 'scene', label: '🏞️ Scene', color: 'border-purple-500 bg-purple-50' },
  { value: 'object', label: '📦 Object', color: 'border-orange-500 bg-orange-50' },
];

export default function BatchUploadModal({
  files,
  onClose,
  onSuccess,
}: BatchUploadModalProps) {
  const [items, setItems] = useState<FileWithMetadata[]>(
    files.map(file => ({
      file,
      name: file.name.replace(/\.[^.]+$/, ''), // strip extension
      category: 'object',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
  );

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...items];
    updated[index].name = newName;
    setItems(updated);
  };

  const handleCategoryChange = (index: number, newCategory: 'character' | 'animal' | 'scene' | 'object') => {
    const updated = [...items];
    updated[index].category = newCategory;
    setItems(updated);
  };

  const handleUpload = async () => {
    setError(null);
    setIsUploading(true);
    const uploaded = [];

    try {
      for (const item of items) {
        try {
          const formData = new FormData();
          formData.append('file', item.file);

          const record = await uploadReference(formData, item.name, item.category);
          uploaded.push(record);
        } catch (err) {
          setError(
            `Failed to upload "${item.name}": ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          // Continue with other files
        }
      }

      if (uploaded.length > 0) {
        onSuccess(uploaded);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const categoryObj = (cat: string) =>
    CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-5 border-b border-indigo-700/50 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h2 className="text-xl font-bold">Upload & Categorize References</h2>
          </div>
          <p className="text-indigo-100 text-sm mt-2">
            Rename files and choose their type. Categories help with @mentions and generation.
          </p>
        </div>

        {/* Items list */}
        <div className="p-6 space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                categoryObj(item.category).color
              }`}
            >
              <div className="flex gap-4">
                {/* Preview */}
                {item.preview && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.preview}
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                    />
                  </div>
                )}

                {/* Metadata */}
                <div className="flex-grow space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleNameChange(idx, e.target.value)}
                      onFocus={e => e.currentTarget.select()}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Reference name (without extension)"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={item.category}
                      onChange={e =>
                        handleCategoryChange(idx, e.target.value as any)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 to-white px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || items.length === 0}
            className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span>
                Uploading {items.length}...
              </>
            ) : (
              <>
                ✨ Upload {items.length} Reference{items.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
