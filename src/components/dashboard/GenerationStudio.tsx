'use client';

import { useState, useRef } from 'react';
import { generateMangaPanel } from '@/app/actions/generateMangaPanel';
import { generateAnimeClip } from '@/app/actions/generateAnimeClip';

type Mode = 'panel' | 'clip';
type PanelResolution = '1K' | '2K' | '4K';
type ClipResolution = '480p' | '720p' | '1080p';
type AspectRatioPanel = 'portrait' | 'landscape' | 'square';
type AspectRatioClip = '16:9' | '9:16' | '1:1' | '4:3' | 'adaptive';

interface GeneratedItem {
  id: string;
  type: 'panel' | 'clip';
  url: string;
  prompt: string;
  timestamp: Date;
}

interface GenerationStudioProps {
  initialCredits: number;
}

export default function GenerationStudio({ initialCredits }: GenerationStudioProps) {
  const [mode, setMode] = useState<Mode>('panel');
  const [prompt, setPrompt] = useState('');
  const [credits, setCredits] = useState(initialCredits);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState<GeneratedItem[]>([]);
  const [selected, setSelected] = useState<GeneratedItem | null>(null);

  // Panel settings
  const [panelRes, setPanelRes] = useState<PanelResolution>('2K');
  const [panelAspect, setPanelAspect] = useState<AspectRatioPanel>('portrait');
  const [panelStyle, setPanelStyle] = useState('manga comic panel, black and white ink, detailed linework');

  // Clip settings
  const [clipDuration, setClipDuration] = useState(5);
  const [clipRes, setClipRes] = useState<ClipResolution>('720p');
  const [clipAspect, setClipAspect] = useState<AspectRatioClip>('16:9');
  const [clipAudio, setClipAudio] = useState(true);

  // Reference images (URLs)
  const [refImages, setRefImages] = useState<string>('');

  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const STYLE_PRESETS: { label: string; value: string }[] = [
    { label: '⬛ Classic Manga', value: 'manga comic panel, black and white ink, detailed linework' },
    { label: '🎨 Anime Color', value: 'anime style, vibrant colors, cel shading, Studio Ghibli inspired' },
    { label: '🌑 Dark Fantasy', value: 'dark manga, heavy shadows, dramatic lighting, Berserk style' },
    { label: '✨ Shojo', value: 'shojo manga style, soft lines, sparkles, romantic atmosphere' },
    { label: '💥 Action', value: 'action manga, dynamic poses, speed lines, explosive energy, One Piece style' },
    { label: '🏯 Historical', value: 'samurai manga style, feudal Japan setting, traditional ink art' },
  ];

  function simulateProgress(label: string, durationMs: number) {
    setProgress(0);
    setProgressLabel(label);
    const step = 100 / (durationMs / 300);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 90;
        }
        return p + step;
      });
    }, 300);
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (mode === 'panel') {
        const cost = 3;
        if (credits < cost) {
          setError(`Need ${cost} credits but you have ${credits}. Buy more credits below.`);
          setLoading(false);
          return;
        }
        simulateProgress('🎨 Generating manga panel with Nano Banana Pro…', 30000);

        const refs = refImages.trim()
          ? refImages.split('\n').map((u) => u.trim()).filter(Boolean)
          : undefined;

        const result = await generateMangaPanel({
          prompt,
          resolution: panelRes,
          aspectRatio: panelAspect,
          style: panelStyle,
          referenceImageUrls: refs,
        });

        setProgress(100);
        setCredits(result.remainingCredits);
        const item: GeneratedItem = {
          id: crypto.randomUUID(),
          type: 'panel',
          url: result.imageUrl,
          prompt,
          timestamp: new Date(),
        };
        setGallery((prev) => [item, ...prev]);
        setSelected(item);
      } else {
        const cost = Math.max(2, Math.ceil((clipDuration / 5) * 2));
        if (credits < cost) {
          setError(`Need ${cost} credits but you have ${credits}. Buy more credits below.`);
          setLoading(false);
          return;
        }
        simulateProgress(`🎬 Generating ${clipDuration}s anime clip with Seedance 2.0…`, 120000);

        const refs = refImages.trim()
          ? refImages.split('\n').map((u) => u.trim()).filter(Boolean)
          : undefined;

        const result = await generateAnimeClip({
          prompt,
          duration: clipDuration,
          resolution: clipRes,
          aspectRatio: clipAspect,
          generateAudio: clipAudio,
          referenceImageUrls: refs,
        });

        setProgress(100);
        setCredits(result.remainingCredits);
        const item: GeneratedItem = {
          id: crypto.randomUUID(),
          type: 'clip',
          url: result.videoUrl,
          prompt,
          timestamp: new Date(),
        };
        setGallery((prev) => [item, ...prev]);
        setSelected(item);
      }
    } catch (err) {
      if (progressRef.current) clearInterval(progressRef.current);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      if (progressRef.current) clearInterval(progressRef.current);
      setLoading(false);
      setProgress(0);
      setProgressLabel('');
    }
  }

  const costPanel = 3;
  const costClip = Math.max(2, Math.ceil((clipDuration / 5) * 2));
  const currentCost = mode === 'panel' ? costPanel : costClip;
  const canAfford = credits >= currentCost;

  return (
    <div className="flex flex-col gap-6 p-4 text-white min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Generation Studio</h2>
          <p className="text-purple-300 text-sm mt-1">
            Manga panels via <span className="font-semibold text-yellow-300">Nano Banana Pro</span> · Anime clips via <span className="font-semibold text-blue-300">Seedance 2.0</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-full text-sm font-bold border ${canAfford ? 'bg-green-900/40 border-green-500 text-green-300' : 'bg-red-900/40 border-red-500 text-red-300'}`}>
            ⚡ {credits} credits
          </div>
          <a
            href={`mailto:ewilliamhe@gmail.com?subject=Credit Request - Ouriye&body=Hi, I'd like to purchase more credits for my Ouriye account (user email on file). Current credits: ${credits}.`}
            className="px-3 py-2 bg-yellow-500/20 border border-yellow-500 text-yellow-300 text-xs rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            + Buy Credits
          </a>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border border-purple-700/50 w-fit">
        <button
          onClick={() => setMode('panel')}
          className={`px-6 py-3 text-sm font-bold transition-all ${mode === 'panel'
            ? 'bg-purple-600 text-white'
            : 'bg-white/5 text-purple-300 hover:bg-white/10'}`}
        >
          🖼️ Manga Panel
          <span className="ml-2 text-xs opacity-70">3 credits</span>
        </button>
        <button
          onClick={() => setMode('clip')}
          className={`px-6 py-3 text-sm font-bold transition-all ${mode === 'clip'
            ? 'bg-blue-600 text-white'
            : 'bg-white/5 text-blue-300 hover:bg-white/10'}`}
        >
          🎬 Anime Clip
          <span className="ml-2 text-xs opacity-70">{costClip} credits</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="flex flex-col gap-4">

          {/* Prompt */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-semibold text-purple-200 mb-2">
              ✍️ Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'panel'
                ? 'A samurai stands at the edge of a cliff, rain pouring down, katana raised toward a stormy sky…'
                : 'Two anime warriors face off in a burning temple, cherry blossom petals swirling in slow motion…'}
              rows={4}
              className="w-full bg-transparent text-white placeholder-white/30 outline-none resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Style presets (panel only) */}
          {mode === 'panel' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <label className="block text-sm font-semibold text-purple-200 mb-3">🎨 Style Preset</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setPanelStyle(preset.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${panelStyle === preset.value
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-purple-300 hover:bg-white/10'}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-semibold text-purple-200 mb-3">⚙️ Settings</label>
            <div className="grid grid-cols-2 gap-3">
              {mode === 'panel' ? (
                <>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Resolution</label>
                    <select
                      value={panelRes}
                      onChange={(e) => setPanelRes(e.target.value as PanelResolution)}
                      className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20 outline-none"
                    >
                      <option value="1K">1K (fast)</option>
                      <option value="2K">2K (default)</option>
                      <option value="4K">4K (best)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Aspect Ratio</label>
                    <select
                      value={panelAspect}
                      onChange={(e) => setPanelAspect(e.target.value as AspectRatioPanel)}
                      className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20 outline-none"
                    >
                      <option value="portrait">Portrait (2:3) — manga page</option>
                      <option value="landscape">Landscape (3:2) — wide panel</option>
                      <option value="square">Square (1:1) — social</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Duration: {clipDuration === -1 ? 'Auto' : `${clipDuration}s`}</label>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      step={1}
                      value={clipDuration === -1 ? 5 : clipDuration}
                      onChange={(e) => setClipDuration(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>3s</span><span>15s</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Resolution</label>
                    <select
                      value={clipRes}
                      onChange={(e) => setClipRes(e.target.value as ClipResolution)}
                      className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20 outline-none"
                    >
                      <option value="480p">480p (fast)</option>
                      <option value="720p">720p (balanced)</option>
                      <option value="1080p">1080p (premium)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Aspect Ratio</label>
                    <select
                      value={clipAspect}
                      onChange={(e) => setClipAspect(e.target.value as AspectRatioClip)}
                      className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20 outline-none"
                    >
                      <option value="16:9">16:9 — Widescreen</option>
                      <option value="9:16">9:16 — Vertical</option>
                      <option value="1:1">1:1 — Square</option>
                      <option value="4:3">4:3 — Classic</option>
                      <option value="adaptive">Adaptive — Auto</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="clipAudio"
                      checked={clipAudio}
                      onChange={(e) => setClipAudio(e.target.checked)}
                      className="accent-blue-500 w-4 h-4"
                    />
                    <label htmlFor="clipAudio" className="text-sm text-white/70">
                      🎵 Generate audio (dialogue, SFX, music)
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reference images */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-semibold text-purple-200 mb-1">
              🖼️ Reference Image URLs
              <span className="text-xs font-normal text-white/40 ml-2">
                {mode === 'panel' ? '(up to 14 images)' : '(up to 9 images — for character consistency)'}
              </span>
            </label>
            <textarea
              value={refImages}
              onChange={(e) => setRefImages(e.target.value)}
              placeholder="Paste image URLs, one per line (from your uploaded references)"
              rows={3}
              className="w-full bg-transparent text-white/70 placeholder-white/20 outline-none resize-none text-xs font-mono"
            />
            <p className="text-xs text-white/30 mt-1">
              Tip: Reference your characters as [Image1], [Image2] etc. in your prompt for character consistency
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/40 border border-red-500 rounded-xl p-3 text-red-300 text-sm">
              ⚠️ {error}
              {error.includes('credits') && (
                <a
                  href={`mailto:ewilliamhe@gmail.com?subject=Credit Request - Ouriye&body=Hi, I'd like to purchase more credits.`}
                  className="block mt-2 text-yellow-300 underline text-xs"
                >
                  → Request more credits by email
                </a>
              )}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden ${loading || !prompt.trim()
              ? 'opacity-50 cursor-not-allowed bg-white/10'
              : mode === 'panel'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/50'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/50'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-xl">⚙️</span>
                {progressLabel || 'Generating…'}
              </span>
            ) : mode === 'panel' ? (
              `✨ Generate Manga Panel — ${costPanel} credits`
            ) : (
              `🎬 Generate Anime Clip — ${costClip} credits`
            )}
            {/* Progress bar */}
            {loading && progress > 0 && (
              <div
                className="absolute bottom-0 left-0 h-1 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: mode === 'panel'
                    ? 'linear-gradient(90deg, #a855f7, #ec4899)'
                    : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                }}
              />
            )}
          </button>

          {/* Credit info */}
          <p className="text-xs text-center text-white/30">
            Manga panel = 3 credits · Anime 5s clip = 2 credits · 10s = 4 credits · 15s = 6 credits
          </p>
        </div>

        {/* Right: Preview + Gallery */}
        <div className="flex flex-col gap-4">
          {/* Selected preview */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
            style={{ minHeight: 320 }}>
            {selected ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                  <span className="text-xs text-white/50">
                    {selected.type === 'panel' ? '🖼️ Manga Panel' : '🎬 Anime Clip'} · {selected.timestamp.toLocaleTimeString()}
                  </span>
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-300 hover:underline"
                  >
                    Open full size ↗
                  </a>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  {selected.type === 'panel' ? (
                    <img
                      src={selected.url}
                      alt={selected.prompt}
                      className="max-h-80 max-w-full rounded-lg object-contain"
                    />
                  ) : (
                    <video
                      src={selected.url}
                      controls
                      autoPlay
                      loop
                      className="max-h-80 max-w-full rounded-lg"
                    />
                  )}
                </div>
                <div className="px-4 pb-3">
                  <p className="text-xs text-white/40 italic truncate">"{selected.prompt}"</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-white/20 gap-3">
                <div className="text-6xl">
                  {mode === 'panel' ? '🖼️' : '🎬'}
                </div>
                <p className="text-sm">Your generated {mode === 'panel' ? 'panel' : 'clip'} will appear here</p>
                <p className="text-xs">
                  {mode === 'panel' ? 'Powered by Nano Banana Pro' : 'Powered by Seedance 2.0'}
                </p>
              </div>
            )}
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white/70 mb-3">📂 Session Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`relative rounded-lg overflow-hidden border transition-all ${selected?.id === item.id
                      ? 'border-purple-400 ring-2 ring-purple-500'
                      : 'border-white/10 hover:border-white/30'}`}
                  >
                    {item.type === 'panel' ? (
                      <img
                        src={item.url}
                        alt={item.prompt}
                        className="w-full h-20 object-cover"
                      />
                    ) : (
                      <div className="w-full h-20 bg-blue-900/40 flex items-center justify-center">
                        <span className="text-2xl">🎬</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                      <p className="text-xs text-white/60 truncate">{item.prompt.slice(0, 20)}…</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Model info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border transition-all ${mode === 'panel' ? 'border-yellow-500/50 bg-yellow-900/20' : 'border-white/10 bg-white/5'}`}>
              <p className="text-xs font-bold text-yellow-300">🍌 Nano Banana Pro</p>
              <p className="text-xs text-white/40 mt-1">Google's Gemini 3 Pro Image model. Up to 14 reference images. 2K resolution. Best-in-class manga panel quality.</p>
            </div>
            <div className={`rounded-xl p-3 border transition-all ${mode === 'clip' ? 'border-blue-500/50 bg-blue-900/20' : 'border-white/10 bg-white/5'}`}>
              <p className="text-xs font-bold text-blue-300">🌱 Seedance 2.0</p>
              <p className="text-xs text-white/40 mt-1">ByteDance's cinematic video model. Up to 15s, 1080p, native audio generation, character consistency via reference images.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
