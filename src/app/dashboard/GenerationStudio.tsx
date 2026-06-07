'use client';

import { useState } from 'react';
import { generateMangaPanel } from '@/app/actions/generateMangaPanel';
import { Loader2, Sparkles, Image as ImageIcon, Compass, BookOpen, Settings, Send, Paintbrush, Maximize } from 'lucide-react';

export default function GenerationStudio() {
  const [prompt, setPrompt] = useState('');
  const [isColored, setIsColored] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPanels, setGeneratedPanels] = useState<string[]>([]);
  const [activeNav, setActiveNav] = useState('studio');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateMangaPanel({ prompt, isColored, aspectRatio });
      setGeneratedPanels(prev => [result.imageUrl, ...prev]);
      setPrompt(''); // Clear prompt on success
    } catch (error) {
      console.error(error);
      alert('Generation failed. Ensure you have credits.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full bg-[#030305] overflow-hidden text-white font-sans">
      
      {/* THIN LEFT NAVBAR */}
      <nav className="w-20 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col items-center py-6 z-20 shadow-2xl">
        <div className="space-y-6 flex-1 w-full flex flex-col items-center">
          <button onClick={() => setActiveNav('studio')} className={`p-3 rounded-xl transition-all ${activeNav === 'studio' ? 'bg-plasma/20 text-plasma shadow-[0_0_15px_rgba(var(--color-plasma),0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <Sparkles className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveNav('explore')} className={`p-3 rounded-xl transition-all ${activeNav === 'explore' ? 'bg-plasma/20 text-plasma' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <Compass className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveNav('library')} className={`p-3 rounded-xl transition-all ${activeNav === 'library' ? 'bg-plasma/20 text-plasma' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
        <button className="p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      {/* MASSIVE MAIN CANVAS */}
      <main className="flex-1 relative overflow-y-auto speed-lines flex flex-col items-center scroll-smooth">
        
        {/* Gallery Area */}
        <div className="w-full max-w-7xl p-8 pb-48">
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
                      <a href={url} download target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md text-white transition-colors text-xs font-bold border border-white/10">
                        Download HQ
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FLOATING BOTTOM PROMPT BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
          <div className="bg-void/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            {/* Quick Settings Row */}
            <div className="flex items-center gap-4 px-3 py-2 border-b border-white/5 mb-2">
              <button 
                onClick={() => setIsColored(!isColored)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${isColored ? 'bg-bloom/20 text-bloom' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Paintbrush className="w-3.5 h-3.5" /> {isColored ? 'Full Color' : 'B&W Manga'}
              </button>
              
              <div className="h-4 w-px bg-white/10" />
              
              <div className="flex gap-1">
                {['portrait', 'square', 'landscape'].map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${aspectRatio === ratio ? 'bg-surface text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <Maximize className="w-3 h-3" />
                    {ratio.charAt(0).toUpperCase() + ratio.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Row */}
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
                className="w-full bg-transparent border-none p-2 text-sm text-white focus:ring-0 outline-none resize-none max-h-32 min-h-[44px] placeholder:text-gray-600"
                rows={1}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="p-3 rounded-xl bg-plasma text-white btn-glow disabled:opacity-50 flex-shrink-0 transition-transform active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}