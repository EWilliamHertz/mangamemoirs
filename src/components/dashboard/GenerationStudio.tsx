'use client';

import { useState, useRef } from 'react';
import { generateMangaPanel } from '@/app/actions/generateMangaPanel';
import { uploadReference } from '@/app/actions/uploadReference';
import { saveUrlAsReference } from '@/app/actions/saveUrlAsReference';
import { Loader2, Sparkles, Image as ImageIcon, Send, Paintbrush, Coins, UploadCloud, Users, X, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { shareToCommunity } from '@/app/actions/shareToCommunity';

interface GenerationStudioProps {
  initialCredits: number;
}

interface Reference {
  name: string;
  url: string;
}

export default function GenerationStudio({ initialCredits }: GenerationStudioProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'references'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [isColored, setIsColored] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [provider, setProvider] = useState<'replicate' | 'banana'>('replicate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPanels, setGeneratedPanels] = useState<string[]>([]);
  const [credits, setCredits] = useState(initialCredits);

  // References State
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<Reference[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const newRef = { name: res.reference.name, url: res.reference.image_url };
        setReferences(prev => [newRef, ...prev]);
        setSelectedRefs(prev => {
          if (!prev.find(r => r.url === newRef.url)) return [...prev, newRef];
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload character reference.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleReference = (ref: Reference) => {
    setSelectedRefs(prev => 
      prev.find(r => r.url === ref.url) 
        ? prev.filter(r => r.url !== ref.url) 
        : [...prev, ref] 
    );
  };

  const handleSaveAsReference = async (url: string) => {
    const name = window.prompt('Enter a character name for this image:');
    if (!name || !name.trim()) return;

    try {
      const res = await saveUrlAsReference(url, name.trim());
      if (res.success && res.reference) {
        const newRef = { name: res.reference.name, url: res.reference.image_url };
        setReferences(prev => [newRef, ...prev]);
        alert(`Successfully saved @${name.trim()} to your characters!`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save reference.');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    const cost = 3; // Manga panel always costs 3 credits
    if (credits < cost) {
      alert(`You need ${cost} credits to generate using ${provider.toUpperCase()}.`);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMangaPanel({ 
        prompt, 
        isColored, 
        aspectRatio,
        provider,
        referenceImageUrls: selectedRefs.map(r => r.url)
      });
      setGeneratedPanels(prev => [result.imageUrl, ...prev]);
      setPrompt('');
      setCredits(prev => prev - cost);
    } catch (error) {
      console.error(error);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToCommunity = async (url: string, caption: string, type: string) => {
    try {
      await shareToCommunity(url, caption, type);
      alert("Successfully published to community feed!");
    } catch (err) {
      alert("Failed to publish.");
    }
  };

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden text-white font-sans">
      
      {/* DIRECTOR'S CHAIR */}
      <aside className="w-80 border-r border-white/5 bg-void flex flex-col shadow-2xl z-10 relative">
        <div className="p-6 pb-0 flex flex-col gap-4 border-b border-white/5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-bold gradient-text tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-plasma" />
              Manga Studio
            </h2>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner" title="Available Credits">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-white">{credits}</span>
            </div>
          </div>

          <div className="flex gap-6 mt-2">
            <button onClick={() => setActiveTab('prompt')} className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'prompt' ? 'border-plasma text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
              Settings
            </button>
            <button onClick={() => setActiveTab('references')} className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'references' ? 'border-plasma text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
              Characters {references.length > 0 && <span className="bg-white/10 text-xs py-0.5 px-2 rounded-full">{references.length}</span>}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'prompt' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Art Style</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setIsColored(false)} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${!isColored ? 'bg-plasma/10 border-plasma text-plasma shadow-[0_0_20px_rgba(var(--color-plasma),0.1)]' : 'bg-transparent border-white/5 text-gray-500 hover:bg-white/5'}`}>
                    <Paintbrush className="w-6 h-6" />
                    <span className="text-xs font-bold">B&W Ink</span>
                  </button>
                  <button onClick={() => setIsColored(true)} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${isColored ? 'bg-bloom/10 border-bloom text-bloom shadow-[0_0_20px_rgba(var(--color-bloom),0.1)]' : 'bg-transparent border-white/5 text-gray-500 hover:bg-white/5'}`}>
                    <Paintbrush className="w-6 h-6" />
                    <span className="text-xs font-bold">Full Color</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Aspect Ratio</label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
                  {['portrait', 'square', 'landscape'].map(ratio => (
                    <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-1 py-2 text-xs rounded-md transition-all ${aspectRatio === ratio ? 'bg-surface text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>
                      {ratio.charAt(0).toUpperCase() + ratio.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'references' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] hover:border-plasma/50 transition-all cursor-pointer group">
                {isUploading ? <Loader2 className="w-8 h-8 text-plasma animate-spin" /> : (
                  <>
                    <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-plasma" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Upload Character</p>
                      <p className="text-xs text-gray-500 mt-1">Images will be locked into the AI</p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" /> Cast Locker
                </label>
                {references.length === 0 ? (
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-500 text-center leading-relaxed">
                    No characters uploaded. Upload an image above to lock them into your generations.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {references.map((ref, idx) => {
                      const isSelected = selectedRefs.some(r => r.url === ref.url);
                      return (
                        <div key={idx} onClick={() => toggleReference(ref)} className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-square ${isSelected ? 'border-plasma shadow-[0_0_15px_rgba(var(--color-plasma),0.4)]' : 'border-transparent hover:border-white/20'}`}>
                          <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                            <p className="text-xs font-bold truncate text-white">@{ref.name}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-plasma text-white rounded-full p-0.5 shadow-lg">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* CANVAS */}
      <main className="flex-1 relative overflow-y-auto speed-lines flex flex-col items-center scroll-smooth">
        <div className="w-full max-w-7xl p-8 pb-56">
          {generatedPanels.length === 0 && !isGenerating ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-gray-600 space-y-4">
              <ImageIcon className="w-20 h-20 opacity-10" />
              <p className="text-sm uppercase tracking-widest font-medium">The Studio is ready. Describe your scene.</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {isGenerating && (
                <div className="break-inside-avoid w-full aspect-[2/3] rounded-2xl shimmer border border-white/10" />
              )}
              {generatedPanels.map((url, i) => (
                <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden group relative border border-white/5 shadow-2xl transition-transform hover:-translate-y-1">
                  <img src={url} alt={`Generated panel ${i}`} className="w-full h-auto object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-5">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => publishToCommunity(url, prompt || "Manga Panel", "manga-pictures")}
                        className="px-3 py-2 bg-plasma/20 hover:bg-plasma/40 rounded-lg backdrop-blur-md text-plasma border border-plasma/30 text-[10px] font-bold"
                      >
                        Publish to Feed
                      </button>
                      <a href={url} download target="_blank" className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                        Download
                      </a>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleSaveAsReference(url)}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-md text-white border border-white/10"
                      title="Save as Character Reference"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM PROMPT BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
          <div className="bg-void/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            
            {/* Engine Toggle Row */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Engine:</span>
              <button onClick={() => setProvider('replicate')} className={`text-xs px-2 py-1 rounded transition-all ${provider === 'replicate' ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}>
                Stable Diffusion 3.5 (3 Cr)
              </button>
              <button onClick={() => setProvider('banana')} className={`text-xs px-2 py-1 rounded transition-all flex items-center gap-1 ${provider === 'banana' ? 'bg-plasma/20 text-plasma font-medium border border-plasma/30' : 'text-gray-500 hover:text-gray-300'}`}>
                Premium Banana (3 Cr)
              </button>
            </div>

            {selectedRefs.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 border-b border-white/5">
                {selectedRefs.map(ref => (
                  <div key={ref.url} className="flex items-center gap-1.5 bg-plasma/10 border border-plasma/30 text-plasma px-2 py-1 rounded-lg text-xs font-medium animate-in fade-in zoom-in-95 duration-200">
                    <img src={ref.url} alt={ref.name} className="w-5 h-5 rounded object-cover shadow-sm" />
                    <span>@{ref.name}</span>
                    <button onClick={() => toggleReference(ref)} className="text-plasma/60 hover:text-white ml-1 transition-colors p-0.5 rounded-md hover:bg-plasma/40">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 p-2">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Imagine a hyper-detailed cyberpunk city in the rain... (Press Enter to generate)"
                className="w-full bg-transparent border-none p-3 text-sm text-white focus:ring-0 outline-none resize-none max-h-32 min-h-[48px] placeholder:text-gray-600"
                rows={1}
              />
              <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="p-3.5 rounded-xl bg-plasma text-white btn-glow disabled:opacity-50 disabled:shadow-none flex-shrink-0 transition-all active:scale-95">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
