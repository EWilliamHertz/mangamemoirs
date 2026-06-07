'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadReference } from '@/app/actions/uploadReference';
import { getReferences } from '@/app/actions/getReferences';
import { UploadCloud, Loader2, Search, Trash2 } from 'lucide-react';

export default function ReferencesPage() {
  const [references, setReferences] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getReferences();
      setReferences(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.split('.')[0]); 
      formData.append('category', 'Character');

      const res = await uploadReference(formData);
      if (res.success && res.reference) {
        setReferences(prev => [res.reference, ...prev]);
      }
    } catch (err) {
      alert('Failed to upload character reference.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredRefs = references.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#030305] text-white font-sans overflow-y-auto">
      
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-void">
        <h1 className="text-3xl font-display font-bold gradient-text tracking-wide mb-2">Global References</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your characters and style assets. Uploaded characters will appear in your Manga Studio locker.</p>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-plasma hover:bg-plasma/80 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {isUploading ? 'Uploading...' : 'Upload New Character'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search references..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma transition-all text-white placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-plasma" /></div>
        ) : filteredRefs.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
            No references found. Upload a character to get started.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredRefs.map((ref) => (
              <div key={ref.id} className="group relative aspect-square bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-plasma transition-colors">
                <img src={ref.image_url} alt={ref.name} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10 flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-white truncate">@{ref.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{ref.category}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-2 bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}