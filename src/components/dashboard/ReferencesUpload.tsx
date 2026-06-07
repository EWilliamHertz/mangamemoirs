'use client';

import { useState, useCallback } from 'react';
import BatchUploadModal from './BatchUploadModal';

interface Reference {
  id: string;
  name: string;
  type: string;
  category?: string;
  file_url: string;
  created_at: string;
}

export default function ReferencesUpload({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'text/plain',
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files ?? []));
  };

  const handleFiles = (files: File[]) => {
    setError(null);

    // Validate files
    const valid: File[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name}: unsupported type. Use PDF, image, video, or text.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(`${file.name}: file too large (max 50 MB)`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      setPendingFiles(valid);
    }
  };

  const handleUploadSuccess = (uploaded: any[]) => {
    setReferences(prev => [
      ...uploaded.map(record => ({
        id: record.id,
        name: record.name,
        type: record.type,
        category: record.category,
        file_url: record.file_url ?? '',
        created_at: record.created_at ?? new Date().toISOString(),
      })),
      ...prev,
    ]);
    setPendingFiles([]);
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return '🖼️';
    if (type === 'pdf') return '📄';
    if (type === 'video') return '🎥';
    return '📝';
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'character':
        return '👤 Character';
      case 'animal':
        return '🐾 Animal';
      case 'scene':
        return '🏞️ Scene';
      case 'object':
      default:
        return '📦 Object';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">📎 References Library</h2>
        <p className="text-gray-400">Upload PDFs, images, videos, and text to fuel your creative generation.</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition cursor-pointer ${
          isDragging
            ? 'border-purple-400 bg-purple-900/30'
            : 'border-gray-600 hover:border-purple-400 hover:bg-white/5'
        }`}
      >
        <div className="text-5xl mb-4">📤</div>
        <h3 className="text-2xl font-bold text-white mb-2">Drag & Drop Your References</h3>
        <p className="text-gray-400 mb-6 text-sm max-w-md mx-auto">
          Upload PDF memoirs, images, videos, or text files. You'll rename and categorize them next.
        </p>
        <label>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.txt"
            onChange={handleFileInput}
            disabled={pendingFiles.length > 0}
            className="hidden"
          />
          <span className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-8 rounded-lg inline-block transition-all shadow-lg hover:shadow-xl cursor-pointer">
            {pendingFiles.length > 0 ? '⏳ Preparing…' : '+ Choose Files'}
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* List */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            Your References<span className="text-purple-400 ml-2">({references.length})</span>
          </h3>
        </div>
        {references.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No references uploaded yet</p>
            <p className="text-sm mt-2">Start by uploading your memoir PDFs or inspiration images above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {references.map(ref => (
              <div
                key={ref.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 hover:from-gray-700 hover:to-gray-800 transition-all border border-gray-700 hover:border-purple-500/50 shadow-sm hover:shadow-md group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getFileIcon(ref.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate text-sm group-hover:text-purple-300 transition">{ref.name}</p>
                    <p className="text-gray-500 text-xs capitalize mt-1">{ref.type}</p>
                    <div className="mt-2">
                      <span className="inline-block bg-purple-600/30 border border-purple-500/50 text-purple-200 text-xs px-2 py-1 rounded">
                        {getCategoryBadge(ref.category)}
                      </span>
                    </div>
                  </div>
                  {ref.file_url && (
                    <a
                      href={ref.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-xs font-semibold mt-1"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch Upload Modal */}
      {pendingFiles.length > 0 && (
        <BatchUploadModal
          files={pendingFiles}
          onClose={() => setPendingFiles([])}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
