'use client';

import { useState } from 'react';
import { generateMangaPanel } from '@/app/actions/generateMangaPanel';
import { Loader2, Image as ImageIcon, Sparkles, Paintbrush, Palette, UploadCloud, Users, Settings2 } from 'lucide-react';

export default function GenerationStudio() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'references'>('prompt');
  
  // Prompt State
  const [prompt, setPrompt] = useState('');
  const [isColored, setIsColored] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('portrait');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPanels, setGeneratedPanels] = useState<string[]>([]);
  
  // Reference State (Mocked for UI, connect to your DB fetch logic)
  const [references, setReferences] = useState<{name: string, url: string}[]>([
    // Example placeholder: { name: 'KidHugo', url: '...' }
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateMangaPanel({ prompt, isColored, aspectRatio });
      setGeneratedPanels(prev => [result.imageUrl, ...prev]);
    } catch (error) {
      console.error(error);
      alert('Generation failed. Ensure you have credits.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full bg-ink overflow-hidden text-white font-sans">
      
      {/* LEFT PANEL: Director's Chair */}
      <aside className="w-80 border-r border-surface bg-void flex flex-col shadow-2xl z-10 overflow-hidden relative">
        
        {/* Sidebar Header & Tabs */}
        <div className="p-6 pb-2 border-b border-surface">
          <h2 className="text-xl font-display font-bold gradient-text tracking-wide flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-plasma" />
            Studio Controls
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('prompt')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'prompt' ? 'border-plasma text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              Generation
            </button>
            <button 
              onClick={() => setActiveTab('references')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'references' ? 'border-plasma text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              References {references.length > 0 && <span className="bg-surface text-xs py-0.5 px-2 rounded-full">{references.length}</span>}
            </button>
          </div>
        </div>
        
        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* PROMPT TAB */}
          {activeTab === 'prompt' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Scene Description</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A lone samurai standing under a cherry blossom tree... Use @KidHugo to include a character."
                  className="w-full h-32 bg-panel border border-surface rounded-lg p-3 text-sm focus:border-plasma focus:ring-1 focus:ring-plasma outline-none resize-none transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Art Style</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsColored(false)}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${!isColored ? 'bg-panel border-plasma text-white shadow-[0_0_15px_rgba(var(--color-plasma),0.2)]' : 'bg-transparent border-surface text-gray-500 hover:border-gray-600'}`}
                  >
                    <Paintbrush className="w-5 h-5" />
                    <span className="text-xs font-medium">B&W Ink</span>
                  </button>
                  <button 
                    onClick={() => setIsColored(true)}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${isColored ? 'bg-panel border-bloom text-white shadow-[0_0_15px_rgba(var(--color-bloom),0.2)]' : 'bg-transparent border-surface text-gray-500 hover:border-gray-600'}`}
                  >
                    <Palette className="w-5 h-5" />
                    <span className="text-xs font-medium">Full Color</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Aspect Ratio</label>
                <div className="flex gap-2">
                  {['portrait', 'square', 'landscape'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-2 text-xs rounded border transition-colors ${aspectRatio === ratio ? 'bg-surface border-plasma text-white' : 'border-surface text-gray-500 hover:text-white'}`}
                    >
                      {ratio.charAt(0).toUpperCase() + ratio.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REFERENCES TAB */}
          {activeTab === 'references' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-2 border-dashed border-surface rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-panel/50 hover:bg-panel hover:border-plasma transition-all cursor-pointer group">
                <div className="p-3 bg-surface rounded-full group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-plasma" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Upload Character</p>
                  <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" /> Your Cast
                </label>
                {references.length === 0 ? (
                  <div className="p-4 bg-panel border border-surface rounded-lg text-xs text-gray-500 text-center">
                    No characters uploaded yet. Upload "KidHugo" above to use him in your prompts!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {references.map((ref, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-surface aspect-square">
                        <img src={ref.url} alt={ref.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                          <p className="text-xs font-bold truncate">@{ref.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generate Button (Sticky Bottom) */}
        <div className="p-6 border-t border-surface bg-void/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || activeTab !== 'prompt'}
            className="w-full py-3 rounded-lg bg-plasma text-white font-bold btn-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Drawing...' : 'Generate Panel (1 Cr)'}
          </button>
        </div>
      </aside>

      {/* RIGHT PANEL: Storyboard Canvas */}
      <main className="flex-1 bg-ink relative overflow-y-auto p-8 speed-lines">
        {generatedPanels.length === 0 && !isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
            <ImageIcon className="w-16 h-16 opacity-20" />
            <p className="text-sm uppercase tracking-widest font-medium">Your storyboard is empty.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {isGenerating && (
              <div className="break-inside-avoid w-full aspect-[2/3] rounded-lg shimmer manga-border" />
            )}
            {generatedPanels.map((url, i) => (
              <div key={i} className="break-inside-avoid panel-card manga-border rounded-lg overflow-hidden group relative">
                <img src={url} alt={`Generated panel ${i}`} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex justify-end gap-2">
                    <a href={url} download target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded backdrop-blur-md text-white transition-colors text-xs font-medium border border-white/10">
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}