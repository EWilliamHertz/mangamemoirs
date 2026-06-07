'use client';

import { useState, useRef, useEffect } from 'react';
import { getReferences } from '@/app/actions/getReferences';
import { generateAnimeClip } from '@/app/actions/generateAnimeClip';
import { Loader2, Clapperboard, Send, Coins, Users, X, CheckCircle2, PlayCircle, Download } from 'lucide-react';

interface VideoEditorProps {
  initialCredits: number;
}

interface Reference {
  name: string;
  url: string;
}

export default function VideoEditor({ initialCredits }: VideoEditorProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'references'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [motionLevel, setMotionLevel] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedClips, setGeneratedClips] = useState<string[]>([]);
  const [credits, setCredits] = useState(initialCredits);

  // References State
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<Reference[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  useEffect(() => {
    // Automatically load all global references saved from the Manga Studio
    const fetchSavedRefs = async () => {
      try {
        const data = await getReferences();
        setReferences(data.map(r => ({ name: r.name, url: r.image_url })));
      } catch (error) {
        console.error("Failed to load references", error);
      } finally {
        setIsLoadingRefs(false);
      }
    };
    fetchSavedRefs();
  }, []);

  const toggleReference = (ref: Reference) => {
    setSelectedRefs(prev => 
      prev.find(r => r.url === ref.url) 
        ? prev.filter(r => r.url !== ref.url) 
        : [...prev, ref] 
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Video generation is more expensive (10 credits)
    if (credits < 10) {
      alert(`You need 10 credits to generate an Anime clip.`);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateAnimeClip({ 
        prompt, 
        motion: motionLevel,
        referenceImageUrl: selectedRefs.length > 0 ? selectedRefs[0].url : undefined
      });
      setGeneratedClips(prev => [result.clipUrl, ...prev]);
      setPrompt('');
      setCredits(prev => prev - 10);
    } catch (error) {
      console.error(error);
      alert('Video generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden text-white font-sans">
      
      {/* DIRECTOR'S CHAIR */}
      <aside className="w-80 border-r border-white/5 bg-void flex flex-col shadow-2xl z-10 relative shrink-0">
        <div className="p-6 pb-0 flex flex-col gap-4 border-b border-white/5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-bold gradient-text tracking-wide flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-plasma" />
              Anime Studio
            </h2>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner" title="Available Credits">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-white">{credits}</span>
            </div>
          </div>

          <div className="flex gap-6 mt-2">
            <button onClick={() => setActiveTab('prompt')} className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'prompt' ? 'border-plasma text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
              Animation
            </button>
            <button onClick={() => setActiveTab('references')} className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'references' ? 'border-plasma text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
              Starting Frame
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'prompt' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Motion Intensity</label>
                <div className="bg-surface p-4 rounded-xl border border-white/5">
                  <input 
                    type="range" 
                    min="1" max="10" 
                    value={motionLevel} 
                    onChange={(e) => setMotionLevel(Number(e.target.value))}
                    className="w-full accent-plasma"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2 font-bold">
                    <span>Subtle</span>
                    <span>Dynamic</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Higher motion intensity creates more movement but may distort complex character designs.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'references' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-3">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" /> Global References
                </label>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Select ONE saved panel or character to use as the starting frame for your animation.
                </p>
                
                {isLoadingRefs ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-plasma" /></div>
                ) : references.length === 0 ? (
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-500 text-center leading-relaxed">
                    No references found. Go to the Manga Studio to generate and save images first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {references.map((ref, idx) => {
                      const isSelected = selectedRefs.some(r => r.url === ref.url);
                      return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            // Only allow one reference for video gen
                            setSelectedRefs(isSelected ? [] : [ref]);
                          }} 
                          className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-square ${isSelected ? 'border-plasma shadow-[0_0_15px_rgba(var(--color-plasma),0.4)]' : 'border-transparent hover:border-white/20'}`}
                        >
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
      <main className="flex-1 relative overflow-y-auto speed-lines flex flex-col items-center scroll-smooth bg-[#030305]">
        <div className="w-full max-w-5xl p-8 pb-56">
          {generatedClips.length === 0 && !isGenerating ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-gray-600 space-y-4">
              <PlayCircle className="w-20 h-20 opacity-10" />
              <p className="text-sm uppercase tracking-widest font-medium">Ready to animate. Describe the motion.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {isGenerating && (
                <div className="w-full aspect-video rounded-2xl shimmer border border-white/10 flex items-center justify-center flex-col gap-4">
                  <Loader2 className="w-10 h-10 text-plasma animate-spin" />
                  <p className="text-sm font-bold text-plasma tracking-widest uppercase animate-pulse">Rendering Video...</p>
                </div>
              )}
              {generatedClips.map((url, i) => (
                <div key={i} className="rounded-2xl overflow-hidden group relative border border-white/5 shadow-2xl bg-black">
                  <video src={url} autoPlay loop muted playsInline controls className="w-full h-auto object-cover max-h-[70vh] mx-auto" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                    <a href={url} download target="_blank" rel="noreferrer" className="px-4 py-2 bg-black/60 hover:bg-plasma/60 rounded-lg backdrop-blur-md text-white transition-colors text-xs font-bold border border-white/10 flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download MP4
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM PROMPT BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
          <div className="bg-void/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Engine:</span>
              <span className="text-xs px-2 py-1 rounded bg-white/10 text-white font-medium">Anime Motion v1 (10 Cr)</span>
            </div>

            {selectedRefs.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 border-b border-white/5">
                {selectedRefs.map(ref => (
                  <div key={ref.url} className="flex items-center gap-1.5 bg-plasma/10 border border-plasma/30 text-plasma px-2 py-1 rounded-lg text-xs font-medium animate-in fade-in zoom-in-95 duration-200">
                    <img src={ref.url} alt={ref.name} className="w-5 h-5 rounded object-cover shadow-sm" />
                    <span>Init Frame: @{ref.name}</span>
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
                placeholder="Describe the animation... e.g. 'Camera pans up slowly as the samurai draws his sword, rain falling heavily' (Press Enter to animate)"
                className="w-full bg-transparent border-none p-3 text-sm text-white focus:ring-0 outline-none resize-none max-h-32 min-h-[48px] placeholder:text-gray-600"
                rows={2}
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