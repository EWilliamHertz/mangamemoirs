'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Download, Image as ImageIcon } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LibraryPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      const { data } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });
      setAssets(data || []);
      setIsLoading(false);
    }
    fetchAssets();
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#030305]">
      <h1 className="text-3xl font-display font-bold gradient-text mb-8">Your Creative Library</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-plasma" /></div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Your generated panels will appear here automatically.</div>
      ) : (
        <div className="columns-1 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl group relative hover:border-plasma transition-all">
              <img src={asset.media_url} className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <a href={asset.media_url} download className="p-3 bg-plasma rounded-full text-white"><Download className="w-5 h-5" /></a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}