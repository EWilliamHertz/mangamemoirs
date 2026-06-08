'use client';

import { useEffect, useState } from 'react';
import { getUserGallery, deleteGalleryItem, shareGalleryToCommunity } from '@/app/actions/saveToGallery';
import { Loader2, Download, Trash2, Share2, Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  media_url: string;
  media_type: 'manga-panel' | 'anime-clip';
  prompt?: string;
  credits_used: number;
  created_at: string;
  is_shared: boolean;
}

export default function LibraryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'manga-panel' | 'anime-clip'>('all');
  const [shareCaption, setShareCaption] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      setIsLoading(true);
      const result = await getUserGallery(filterType === 'all' ? undefined : filterType);
      if (result.success) {
        setItems(result.items as GalleryItem[]);
      }
      setIsLoading(false);
    }
    fetchGallery();
  }, [filterType]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    
    const result = await deleteGalleryItem(id);
    if (result.success) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleShare = async (id: string) => {
    if (!shareCaption.trim()) {
      alert('Please enter a caption');
      return;
    }

    setSharingId(id);
    try {
      const result = await shareGalleryToCommunity(id, shareCaption);
      if (result.success) {
        setItems(prev => 
          prev.map(item => 
            item.id === id ? { ...item, is_shared: true } : item
          )
        );
        setShareCaption('');
        alert('Shared to community!');
      }
    } catch (error) {
      alert('Failed to share: ' + String(error));
    } finally {
      setSharingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#030305]">
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold gradient-text mb-2">Your Creative Library</h1>
          <p className="text-gray-500 text-sm">All your generated manga panels and anime clips in one place</p>
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-3 mb-8 border-b border-white/5 pb-4">
          {[
            { value: 'all' as const, label: 'All', count: items.length },
            { value: 'manga-panel' as const, label: 'Manga Panels', count: items.filter(i => i.media_type === 'manga-panel').length },
            { value: 'anime-clip' as const, label: 'Anime Clips', count: items.filter(i => i.media_type === 'anime-clip').length },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filterType === tab.value
                  ? 'bg-plasma/20 text-plasma border border-plasma/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label} <span className="ml-2 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-plasma" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/5 rounded-full">
                <ImageIcon className="w-12 h-12 text-gray-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No items yet</h3>
            <p className="text-gray-500">Your generated panels will appear here automatically.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {items.map(item => (
              <div
                key={item.id}
                className="break-inside-avoid rounded-2xl overflow-hidden border border-white/5 shadow-2xl group relative hover:border-plasma transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]"
              >
                {/* IMAGE */}
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="w-full h-auto object-cover"
                />

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                  {/* INFO */}
                  <div className="flex-1 flex flex-col justify-end gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-plasma/20 text-plasma rounded font-bold">
                          {item.media_type === 'manga-panel' ? '🎨 Manga' : '🎬 Anime'}
                        </span>
                        {item.is_shared && (
                          <span className="text-xs px-2 py-1 bg-green/20 text-green-400 rounded font-bold">
                            Shared ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{item.prompt || item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(item.created_at)}</p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      <a
                        href={item.media_url}
                        download
                        className="flex-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red/10 hover:bg-red/20 rounded-lg text-red-400 border border-red/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SHARE BUTTON */}
                {!item.is_shared && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSharingId(item.id)}
                      className="p-2 bg-plasma/20 hover:bg-plasma/40 rounded-full text-plasma border border-plasma/30 transition-all"
                      title="Share to community"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SHARE MODAL */}
        {sharingId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-white mb-4">Share to Community</h3>
              
              <textarea
                value={shareCaption}
                onChange={(e) => setShareCaption(e.target.value)}
                placeholder="Add a caption for your creation..."
                maxLength={200}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-plasma"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSharingId(null)}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleShare(sharingId)}
                  disabled={!shareCaption.trim()}
                  className="flex-1 px-4 py-2 bg-plasma text-white rounded-lg font-bold hover:bg-plasma/90 disabled:opacity-50 transition-all"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
