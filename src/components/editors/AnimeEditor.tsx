'use client';

import { Play, Pause, SkipBack, SkipForward, Scissors, Plus, Film, Music, Download } from 'lucide-react';
import { useState } from 'react';

export default function AnimeEditor() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#030305] text-white font-sans overflow-hidden">
      
      {/* Top Half: Preview & Asset Bin */}
      <div className="flex flex-1 overflow-hidden border-b border-white/5">
        
        {/* Asset Bin */}
        <div className="w-80 bg-void border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project Assets</h2>
            <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 p-4 grid grid-cols-2 gap-2 overflow-y-auto content-start">
            {/* Mock Assets */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-video bg-surface rounded border border-white/5 relative group cursor-pointer hover:border-plasma transition-colors">
                <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-bold">0:05</div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Preview Canvas */}
        <div className="flex-1 bg-black flex items-center justify-center relative p-8 speed-lines">
          <div className="w-full max-w-3xl aspect-video bg-surface rounded-xl border border-white/10 shadow-2xl relative overflow-hidden flex items-center justify-center">
             <Film className="w-16 h-16 text-white/10" />
             <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-white/50">
               1920x1080 • 24fps
             </div>
          </div>
        </div>

        {/* Export / Properties */}
        <div className="w-64 bg-void border-l border-white/5 flex flex-col">
           <div className="p-4 border-b border-white/5 bg-black/20">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Export Options</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <button className="w-full py-3 bg-plasma text-white font-bold rounded-xl btn-glow flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Render Anime
            </button>
            <p className="text-xs text-gray-500 text-center">Renders a high-quality MP4 compiled from your timeline.</p>
          </div>
        </div>

      </div>

      {/* Bottom Half: Timeline */}
      <div className="h-72 bg-void flex flex-col shrink-0">
        
        {/* Timeline Controls */}
        <div className="h-12 border-b border-white/5 bg-black/40 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 text-white hover:text-plasma transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <span className="text-xs font-mono text-plasma">00:00:00:00</span>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Split Clip"><Scissors className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          
          {/* Video Track */}
          <div className="flex h-16 bg-surface/50 border border-white/5 rounded-lg items-center relative">
            <div className="w-24 shrink-0 h-full border-r border-white/5 flex items-center justify-center bg-black/40 text-gray-500">
              <Film className="w-4 h-4" />
            </div>
            {/* Placeholder Clip */}
            <div className="absolute left-32 top-2 bottom-2 w-64 bg-plasma/20 border border-plasma rounded-md overflow-hidden flex">
               <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=100')] bg-cover opacity-50" />
            </div>
          </div>

          {/* Audio Track */}
          <div className="flex h-12 bg-surface/50 border border-white/5 rounded-lg items-center relative">
            <div className="w-24 shrink-0 h-full border-r border-white/5 flex items-center justify-center bg-black/40 text-gray-500">
              <Music className="w-4 h-4" />
            </div>
             {/* Placeholder Audio */}
             <div className="absolute left-40 top-2 bottom-2 w-48 bg-bloom/20 border border-bloom rounded-md flex items-center px-2">
                <div className="w-full h-2 bg-bloom/50 rounded-full flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full border-y border-bloom/30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)' }}></div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}