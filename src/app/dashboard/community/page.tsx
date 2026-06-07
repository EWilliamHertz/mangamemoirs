'use client';

import { useState, useEffect } from 'react';
import { getCommunityPosts, toggleLike } from '@/app/actions/communityActions';
import { Heart, MessageSquare, Share2, Filter, PlayCircle, BookOpen, Loader2 } from 'lucide-react';

type FilterType = 'all' | 'anime-shorts' | 'anime-movies' | 'manga-pictures' | 'manga-chapters';

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Everything' },
    { id: 'manga-pictures', label: 'Manga Pictures' },
    { id: 'manga-chapters', label: 'Manga Chapters' },
    { id: 'anime-shorts', label: 'Anime Shorts' },
    { id: 'anime-movies', label: 'Anime Movies' },
  ];

  // Load posts whenever the filter changes
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const data = await getCommunityPosts(activeFilter);
        setPosts(data);
      } catch (error) {
        console.error("Failed to load community feed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [activeFilter]);

  // Handle Liking a post
  const handleLike = async (postId: string, currentStatus: boolean) => {
    // Optimistic UI update (feels instant to the user)
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, hasLiked: !currentStatus, likes_count: p.likes_count + (currentStatus ? -1 : 1) };
      }
      return p;
    }));

    // Actual database update
    try {
      await toggleLike(postId, currentStatus);
    } catch (error) {
      console.error("Failed to like post", error);
      // Revert on failure
      const data = await getCommunityPosts(activeFilter);
      setPosts(data);
    }
  };

  const getFormatIcon = (type: string) => {
    if (type.includes('anime')) return <PlayCircle className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />;
    return null;
  };

  const getFormatBadge = (type: string) => {
    const labels: Record<string, {text: string, color: string}> = {
      'anime-shorts': { text: 'Anime Short', color: 'text-bloom' },
      'anime-movies': { text: 'Anime Movie', color: 'text-bloom' },
      'manga-pictures': { text: 'Manga Picture', color: 'text-plasma' },
      'manga-chapters': { text: 'Manga Chapter', color: 'text-plasma' },
    };
    const format = labels[type] || { text: 'Creation', color: 'text-white' };
    
    return (
      <div className={`absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 ${format.color}`}>
        {format.text}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#030305] text-white font-sans overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#030305]/90 backdrop-blur-md border-b border-white/5 p-8">
        <h1 className="text-3xl font-display font-bold gradient-text tracking-wide mb-6">Community Showcase</h1>
        
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === f.id 
                  ? 'bg-plasma text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Canvas */}
      <div className="p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-plasma" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
            No creations found in this category yet. Be the first to share!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <div key={post.id} className="bg-void border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                <div className="aspect-[4/3] bg-surface relative group cursor-pointer">
                  <img src={post.media_url} alt="Community Art" className={`w-full h-full object-cover transition-opacity ${post.content_type.includes('anime') ? 'opacity-60 group-hover:opacity-80' : ''}`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {getFormatIcon(post.content_type)}
                  </div>
                  {getFormatBadge(post.content_type)}
                </div>
                
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-plasma/20 flex items-center justify-center font-bold text-plasma text-xs uppercase">
                      {post.author_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{post.author_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-6 font-medium">{post.caption}</p>
                  
                  <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                    <button 
                      onClick={() => handleLike(post.id, post.hasLiked)}
                      className={`flex items-center gap-2 transition-colors group ${post.hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                    >
                      <Heart className={`w-5 h-5 ${post.hasLiked ? 'fill-current' : 'group-hover:fill-current'}`} /> 
                      <span className="text-xs font-bold">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-plasma transition-colors">
                      <MessageSquare className="w-5 h-5" /> <span className="text-xs font-bold">0</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors ml-auto">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}