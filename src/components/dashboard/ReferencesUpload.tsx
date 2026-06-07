'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { addReference } from '@/app/actions/addReference';

interface Reference {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export default function ReferencesUpload({ 
  userId, 
  projectId = 'default' 
}: { 
  userId: string;
  projectId?: string;
}) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if required env vars are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-6 text-red-200">
          <p className="font-bold mb-2">⚠️ Configuration Error</p>
          <p className="text-sm">Supabase environment variables are missing.</p>
          <p className="text-xs mt-2">Contact support or check your deployment settings.</p>
        </div>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'text/plain'];

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
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    setError(null);
    setIsUploading(true);

    try {
      for (const file of files) {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          setError(`${file.name}: File type not supported. Use PDF, images, video, or text.`);
          continue;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          setError(`${file.name}: File too large (max 50MB)`);
          continue;
        }

        try {
          // Upload to Supabase Storage
          const fileName = `${userId}/${Date.now()}-${file.name}`;
          console.log(`Uploading ${file.name} to bucket 'references' at path: ${fileName}`);
          
          const { error: uploadError } = await supabase.storage
            .from('references')
            .upload(fileName, file);

          if (uploadError) {
            console.error(`Upload error for ${file.name}:`, uploadError);
            throw uploadError;
          }

          console.log(`✓ Successfully uploaded ${file.name} to storage`);

          // Now save to database using server action
          try {
            const dbRecord = await addReference(
              projectId,
              file.name,
              file.type,
              file.size,
              fileName
            );

            console.log(`✓ Successfully saved ${file.name} to database`);

            const newRef: Reference = {
              id: dbRecord.id || Math.random().toString(),
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: fileName,
              created_at: new Date().toISOString(),
            };

            setReferences(prev => [newRef, ...prev]);
          } catch (dbErr) {
            // File was uploaded to storage but DB save failed
            // Delete it from storage and notify user
            await supabase.storage.from('references').remove([fileName]);
            const dbErrorMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
            throw new Error(`Database save failed: ${dbErrorMsg}`);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`Failed to upload ${file.name}:`, errorMsg);
          setError(`Failed to upload ${file.name}: ${errorMsg}`);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const deleteReference = async (ref: Reference) => {
    try {
      const { error } = await supabase.storage.from('references').remove([ref.storage_path]);
      if (error) throw error;
      setReferences(prev => prev.filter(r => r.id !== ref.id));
    } catch (err) {
      setError('Failed to delete reference');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'text/plain') return '📝';
    return '📎';
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
          Drag PDF memoirs, images, videos, or text here
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
          <span className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg inline-block transition disabled:opacity-50 disabled:cursor-not-allowed">
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* References List */}
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
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition border border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getFileIcon(ref.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">
                        {ref.file_name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatFileSize(ref.file_size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReference(ref)}
                    className="text-red-400 hover:text-red-300 transition ml-2 flex-shrink-0"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(ref.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
