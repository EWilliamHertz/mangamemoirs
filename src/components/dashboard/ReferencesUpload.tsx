'use client';

import { useState, useCallback } from 'react';
import { uploadReference } from '@/app/actions/uploadReference';

interface Reference {
  id: string;
  name: string;
  type: string;
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
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFiles = async (files: File[]) => {
    setError(null);
    setIsUploading(true);
    try {
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          setError(`${file.name}: unsupported type. Use PDF, image, video, or text.`);
          continue;
        }
        if (file.size > 50 * 1024 * 1024) {
          setError(`${file.name}: file too large (max 50 MB)`);
          continue;
        }
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', projectId);

          const record = await uploadReference(formData);
          setReferences(prev => [
            {
              id: record.id,
              name: record.name,
              type: record.type,
              file_url: record.file_url ?? '',
              created_at: record.created_at ?? new Date().toISOString(),
            },
            ...prev,
          ]);
        } catch (err) {
          setError(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return '🖼️';
    if (type === 'pdf') return '📄';
    if (type === 'video') return '🎥';
    return '📝';
  };

  return (
    <div className="p-8">
      {/* Upload Area */}
      <div
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer ${
          isDragging
            ? 'border-purple-400 bg-purple-900 bg-opacity-20'
            : 'border-gray-600 hover:border-purple-400'
        }`}
      >
        <div className="text-4xl mb-4">📤</div>
        <h3 className="text-xl font-bold text-white mb-2">Upload References</h3>
        <p className="text-gray-400 mb-6">
          Drag PDF memoirs, images, videos, or text files here
        </p>
        <label>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.txt"
            onChange={handleFileInput}
            disabled={isUploading}
            className="hidden"
          />
          <span className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg inline-block transition cursor-pointer">
            {isUploading ? '⏳ Uploading…' : 'Choose Files'}
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
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4">
          Your References ({references.length})
        </h3>
        {references.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No references uploaded yet</p>
            <p className="text-sm mt-2">Start by uploading your memoir PDFs or inspiration images!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {references.map(ref => (
              <div
                key={ref.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition border border-gray-600"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getFileIcon(ref.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">{ref.name}</p>
                    <p className="text-gray-400 text-xs capitalize">{ref.type}</p>
                  </div>
                  {ref.file_url && (
                    <a
                      href={ref.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-xs"
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
    </div>
  );
}
