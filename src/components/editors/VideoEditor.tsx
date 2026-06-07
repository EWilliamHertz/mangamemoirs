'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ─── Types ──────────────────────────────────────────────── */
interface TimelineClip {
  id: string;
  name: string;
  url: string;
  duration: number;   // seconds
  startTime: number;  // position on timeline
  volume: number;     // 0–1
  fadeIn: number;     // seconds
  fadeOut: number;    // seconds
  color: string;
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

const CLIP_COLORS = [
  '#7c3aed', '#2563eb', '#db2777', '#0891b2', '#059669', '#d97706',
];

const PX_PER_SEC = 90;

const DEMO_CLIPS: TimelineClip[] = [
  { id: 'c1', name: 'Scene 1 — Childhood', url: '', duration: 5, startTime: 0,  volume: 1, fadeIn: 0.5, fadeOut: 0.5, color: CLIP_COLORS[0] },
  { id: 'c2', name: 'Scene 2 — Journey',   url: '', duration: 5, startTime: 5,  volume: 1, fadeIn: 0,   fadeOut: 1,   color: CLIP_COLORS[1] },
  { id: 'c3', name: 'Scene 3 — Reunion',   url: '', duration: 6, startTime: 10, volume: 1, fadeIn: 1,   fadeOut: 2,   color: CLIP_COLORS[2] },
];

/* ─── Helpers ────────────────────────────────────────────── */
function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = String(Math.floor(t % 60)).padStart(2, '0');
  const f = String(Math.floor((t % 1) * 10));
  return `${m}:${s}.${f}`;
}

/* ─── Fade shape SVG ─────────────────────────────────────── */
function FadeShape({ fadeIn, fadeOut, width, height = 40 }: {
  fadeIn: number; fadeOut: number; width: number; height?: number;
}) {
  if (width <= 0) return null;
  const fi = Math.min(fadeIn * PX_PER_SEC, width * 0.45);
  const fo = Math.min(fadeOut * PX_PER_SEC, width * 0.45);
  const pts = [
    `0,${height}`,
    `${fi},0`,
    `${width - fo},0`,
    `${width},${height}`,
  ].join(' ');
  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none opacity-25">
      <polygon points={pts} fill="white" />
    </svg>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export default function VideoEditor({ projectId }: { projectId: string }) {
  const [clips, setClips] = useState<TimelineClip[]>(DEMO_CLIPS);
  const [audio, setAudio] = useState<AudioTrack>({
    id: 'bg', name: 'Background Music', url: '', volume: 0.7, fadeIn: 1, fadeOut: 3,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);

  const dragRef = useRef<{ id: string; startX: number; startTime: number } | null>(null);
  const playRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalDuration = Math.max(...clips.map(c => c.startTime + c.duration), 20) + 2;
  const selected = clips.find(c => c.id === selectedId) ?? null;

  /* playback */
  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(playRef.current!);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playRef.current = setInterval(() => {
        setCurrentTime(t => {
          if (t >= totalDuration) { clearInterval(playRef.current!); setIsPlaying(false); return 0; }
          return +(t + 0.1).toFixed(1);
        });
      }, 100);
    }
  };
  useEffect(() => () => clearInterval(playRef.current!), []);

  /* clip drag */
  const onClipMouseDown = (e: React.MouseEvent, id: string) => {
    const clip = clips.find(c => c.id === id)!;
    dragRef.current = { id, startX: e.clientX, startTime: clip.startTime };
    e.preventDefault();
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const { id, startX, startTime } = dragRef.current;
    const delta = (e.clientX - startX) / PX_PER_SEC;
    setClips(prev => prev.map(c =>
      c.id === id ? { ...c, startTime: Math.max(0, startTime + delta) } : c
    ));
  }, []);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const updateClip = (id: string, patch: Partial<TimelineClip>) =>
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const addClip = () => {
    const maxEnd = Math.max(...clips.map(c => c.startTime + c.duration), 0);
    const newClip: TimelineClip = {
      id: `c${Date.now()}`,
      name: `Scene ${clips.length + 1}`,
      url: '',
      duration: 5,
      startTime: maxEnd,
      volume: 1,
      fadeIn: 0,
      fadeOut: 0,
      color: CLIP_COLORS[clips.length % CLIP_COLORS.length],
    };
    setClips(prev => [...prev, newClip]);
    setSelectedId(newClip.id);
  };

  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  /* timeline ruler ticks */
  const ticks = Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => i);

  const playheadX = currentTime * PX_PER_SEC;

  /* export (triggers server action) */
  const handleExport = () => {
    const config = {
      projectId,
      clips: clips.map(c => ({
        url: c.url, startTime: c.startTime, duration: c.duration,
        volume: c.volume * masterVolume, fadeIn: c.fadeIn, fadeOut: c.fadeOut,
      })),
      audioTrack: { url: audio.url, volume: audio.volume * masterVolume, fadeIn: audio.fadeIn, fadeOut: audio.fadeOut },
    };
    console.log('Export config:', JSON.stringify(config, null, 2));
    alert('Export queued! Your video will be ready shortly. (Connect FFmpeg server action to process.)');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white select-none overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Video Editor</h1>
            <p className="text-xs text-gray-500">Ouriye • Anime Clip Composer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <span>Master Vol</span>
            <input type="range" min="0" max="1" step="0.01"
              value={masterVolume}
              onChange={e => setMasterVolume(+e.target.value)}
              className="w-24 accent-purple-500"
            />
            <span className="w-8">{Math.round(masterVolume * 100)}%</span>
          </label>
          <button
            onClick={handleExport}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-5 py-2 rounded-lg text-sm transition"
          >
            Export ↗
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: clip library ── */}
        <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Clip Library</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {clips.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{ borderColor: c.color }}
                className={`w-full text-left px-3 py-2 rounded-lg border-l-4 text-sm transition ${
                  selectedId === c.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-750'
                }`}
              >
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-gray-500">{c.duration}s</div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800 space-y-2">
            <button onClick={addClip}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition">
              + Add Clip
            </button>
          </div>
        </aside>

        {/* ── Center: timeline + preview ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Preview */}
          <div className="bg-black flex items-center justify-center" style={{ height: 220 }}>
            {selected?.url ? (
              <video ref={videoRef} src={selected.url} className="h-full w-auto" controls={false} />
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2 opacity-30">🎞</div>
                <p className="text-gray-600 text-sm">
                  {selected ? `${selected.name} — no video yet` : 'Select a clip'}
                </p>
              </div>
            )}
          </div>

          {/* Transport controls */}
          <div className="bg-gray-900 border-y border-gray-800 px-6 py-2 flex items-center gap-4 shrink-0">
            <button onClick={() => setCurrentTime(0)}
              className="text-gray-400 hover:text-white text-lg transition">⏮</button>
            <button onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-full font-bold text-lg transition">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={() => { clearInterval(playRef.current!); setIsPlaying(false); setCurrentTime(0); }}
              className="text-gray-400 hover:text-white text-lg transition">⏹</button>
            <span className="font-mono text-purple-400 text-sm w-20">{formatTime(currentTime)}</span>
            <span className="text-gray-600 text-sm">/ {formatTime(totalDuration)}</span>
            <div className="flex-1" />
            <span className="text-xs text-gray-600">{clips.length} clips • {Math.round(totalDuration)}s total</span>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto bg-gray-950">
            <div style={{ width: totalDuration * PX_PER_SEC + 120, minHeight: '100%', position: 'relative' }}>

              {/* Time ruler */}
              <div className="flex items-end h-8 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
                {ticks.map(t => (
                  <div key={t} style={{ left: t * PX_PER_SEC, position: 'absolute' }}
                    className="flex flex-col items-center">
                    <span className="text-xs text-gray-600 font-mono">{t}s</span>
                    <div className="w-px h-2 bg-gray-700" />
                  </div>
                ))}
              </div>

              {/* Playhead */}
              <div
                style={{ left: playheadX + 2, position: 'absolute', top: 32, bottom: 0, width: 2, zIndex: 20, pointerEvents: 'none' }}
                className="bg-purple-400 opacity-80"
              />

              {/* Video track label */}
              <div className="sticky left-0 px-3 py-1 bg-gray-900 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-widest">
                Video
              </div>

              {/* Video clips row */}
              <div className="relative h-16 mx-2 my-2">
                {clips.map(c => {
                  const x = c.startTime * PX_PER_SEC;
                  const w = c.duration * PX_PER_SEC;
                  return (
                    <div
                      key={c.id}
                      onMouseDown={e => onClipMouseDown(e, c.id)}
                      onClick={() => setSelectedId(c.id)}
                      style={{ left: x, width: w, backgroundColor: c.color, border: selectedId === c.id ? '2px solid white' : '1px solid rgba(255,255,255,0.2)' }}
                      className="absolute top-0 h-full rounded cursor-grab active:cursor-grabbing overflow-hidden"
                    >
                      <FadeShape fadeIn={c.fadeIn} fadeOut={c.fadeOut} width={w} height={64} />
                      <div className="px-2 py-1 relative z-10">
                        <div className="text-xs font-semibold truncate text-white">{c.name}</div>
                        <div className="text-xs text-white/60">{c.duration}s</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Audio track label */}
              <div className="sticky left-0 px-3 py-1 bg-gray-900 border-y border-gray-800 text-xs text-gray-500 uppercase tracking-widest">
                Audio — {audio.name}
              </div>

              {/* Audio fade visualization */}
              <div className="relative h-14 mx-2 my-2">
                <div
                  style={{ left: 0, width: totalDuration * PX_PER_SEC, backgroundColor: '#1d4ed8' }}
                  className="absolute top-0 h-full rounded overflow-hidden opacity-80"
                >
                  <FadeShape fadeIn={audio.fadeIn} fadeOut={audio.fadeOut} width={totalDuration * PX_PER_SEC} height={56} />
                  {/* Fake waveform */}
                  <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
                    {Array.from({ length: 80 }, (_, i) => (
                      <rect key={i} x={`${(i / 80) * 100}%`} width="0.8%"
                        height={`${30 + Math.sin(i * 0.7) * 20 + Math.random() * 15}%`}
                        y={`${25 - Math.sin(i * 0.7) * 10}%`} fill="white" />
                    ))}
                  </svg>
                  <div className="px-3 py-1 relative z-10 text-xs text-white/80 font-medium">{audio.name}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Right: properties panel ── */}
        <aside className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {selected ? 'Clip Properties' : 'Audio Properties'}
            </p>
          </div>

          {selected ? (
            <div className="p-4 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Clip Name</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  value={selected.name}
                  onChange={e => updateClip(selected.id, { name: e.target.value })}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration: {selected.duration}s</label>
                <input type="range" min="1" max="30" step="0.5"
                  value={selected.duration}
                  onChange={e => updateClip(selected.id, { duration: +e.target.value })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Volume: {Math.round(selected.volume * 100)}%
                </label>
                <input type="range" min="0" max="1" step="0.01"
                  value={selected.volume}
                  onChange={e => updateClip(selected.id, { volume: +e.target.value })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Fade In */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  🌅 Fade In: {selected.fadeIn.toFixed(1)}s
                </label>
                <input type="range" min="0" max={Math.min(5, selected.duration / 2)} step="0.1"
                  value={selected.fadeIn}
                  onChange={e => updateClip(selected.id, { fadeIn: +e.target.value })}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0s (cut)</span><span>5s (slow fade)</span>
                </div>
              </div>

              {/* Fade Out */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  🌇 Fade Out: {selected.fadeOut.toFixed(1)}s
                </label>
                <input type="range" min="0" max={Math.min(5, selected.duration / 2)} step="0.1"
                  value={selected.fadeOut}
                  onChange={e => updateClip(selected.id, { fadeOut: +e.target.value })}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0s (cut)</span><span>5s (slow fade)</span>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Clip Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CLIP_COLORS.map(col => (
                    <button key={col} onClick={() => updateClip(selected.id, { color: col })}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full border-2 transition ${selected.color === col ? 'border-white scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              <button onClick={() => removeClip(selected.id)}
                className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm rounded-lg border border-red-800 transition">
                🗑 Remove Clip
              </button>
            </div>
          ) : (
            /* No clip selected → show audio properties */
            <div className="p-4 space-y-5">
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 text-xs text-blue-300">
                Click a clip on the timeline to edit it, or adjust the background audio below.
              </div>

              {/* Audio name */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Track Name</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={audio.name}
                  onChange={e => setAudio(a => ({ ...a, name: e.target.value }))}
                />
              </div>

              {/* Audio volume */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Volume: {Math.round(audio.volume * 100)}%
                </label>
                <input type="range" min="0" max="1" step="0.01"
                  value={audio.volume}
                  onChange={e => setAudio(a => ({ ...a, volume: +e.target.value }))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Audio fade in */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  🌅 Fade In: {audio.fadeIn.toFixed(1)}s
                </label>
                <input type="range" min="0" max="10" step="0.5"
                  value={audio.fadeIn}
                  onChange={e => setAudio(a => ({ ...a, fadeIn: +e.target.value }))}
                  className="w-full accent-green-500"
                />
              </div>

              {/* Audio fade out */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  🌇 Fade Out: {audio.fadeOut.toFixed(1)}s
                </label>
                <input type="range" min="0" max="10" step="0.5"
                  value={audio.fadeOut}
                  onChange={e => setAudio(a => ({ ...a, fadeOut: +e.target.value }))}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Upload music */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Upload Music File</label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition">
                  <span className="text-2xl">🎵</span>
                  <span className="text-xs text-gray-500">MP3 / WAV</span>
                  <input type="file" accept="audio/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setAudio(a => ({ ...a, name: f.name, url: URL.createObjectURL(f) }));
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
