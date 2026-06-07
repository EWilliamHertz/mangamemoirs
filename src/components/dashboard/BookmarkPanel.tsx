'use client';

import { useState, useEffect } from 'react';
import { getBookmarkedScenes, updateBookmarkNotes } from '@/app/actions/bookmarkActions';

interface Bookmark {
  id: string;
  sceneId: string;
  sceneName: string;
  notes: string;
  tags: string[];
  createdAt: string;
}

interface BookmarkPanelProps {
  projectId: string;
  onSelectScene?: (sceneId: string) => void;
}

export default function BookmarkPanel({
  projectId,
  onSelectScene,
}: BookmarkPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [projectId]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const result = await getBookmarkedScenes(projectId);
      setBookmarks(result);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async (bookmark: Bookmark) => {
    try {
      await updateBookmarkNotes(bookmark.sceneId, editNotes, bookmark.tags);
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmark.id ? { ...b, notes: editNotes } : b
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading bookmarks...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">📖 Bookmarked Scenes</h3>

      {bookmarks.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No bookmarks yet. Add some scenes as you create your storyboard!
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-gray-900 rounded p-3 border border-gray-700 hover:border-purple-500 transition cursor-pointer"
              onClick={() => onSelectScene?.(bookmark.sceneId)}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-white text-sm">
                  {bookmark.sceneName}
                </p>
              </div>

              {editingId === bookmark.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveNotes(bookmark);
                      }}
                      className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {bookmark.notes && (
                    <p className="text-gray-300 text-xs mb-2">{bookmark.notes}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {bookmark.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(bookmark.id);
                      setEditNotes(bookmark.notes);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    ✎ Edit Notes
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
