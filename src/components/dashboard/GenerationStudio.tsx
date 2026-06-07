'use client';

import { useState, useRef, useEffect } from 'react';
import { generateMangaPanel } from '@/app/actions/generateMangaPanel';
import { generateAnimeClip } from '@/app/actions/generateAnimeClip';
import { fetchReferences, type ReferenceItem } from '@/app/actions/fetchReferences';
import MentionTextarea, { resolveMentions } from './MentionTextarea';

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

  // References loaded from Supabase
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);

  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchReferences().then((refs) => {
      setReferences(refs);
      setRefsLoading(false);
    });
  }, []);

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
      // Resolve @mentions → inject their URLs as reference images
      const { cleanPrompt, resolvedUrls } = resolveMentions(prompt, references);

      if (mode === 'panel') {
        const cost = 3;
        if (credits < cost) {
          setError(`Need ${cost} credits but you have ${credits}. Buy more credits below.`);
          setLoading(false);
          return;
        }
        simulateProgress('🎨 Generating manga panel with Nano Banana Pro…', 30000);

        const result = await generateMangaPanel({
          prompt: cleanPrompt,
          resolution: panelRes,
          aspectRatio: panelAspect,
          style: panelStyle,
          referenceImageUrls: resolvedUrls.length > 0 ? resolvedUrls : undefined,
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

        const result = await generateAnimeClip({
          prompt: cleanPrompt,
          duration: clipDuration,
          resolution: clipRes,
          aspectRatio: clipAspect,
          generateAudio: clipAudio,
          referenceImageUrls: resolvedUrls.length > 0 ? resolvedUrls : undefined,
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

  // Image references only (for panel generation)
  const imageRefs = references.filter((r) => r.type === 'image');

  return (
    <div className="flex flex-col gap-6 p-4 text-white min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Reference Library ── */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-200">📚 Reference Tags</h3>
              <span className="text-xs text-white/30">type @ to insert</span>
            </div>

            {refsLoading ? (
              <div className="text-xs text-white/30 italic py-4 text-center">Loading…</div>
            ) : references.length === 0 ? (
              <div className="text-xs text-white/30 italic py-4 text-center">
                No references yet.<br />Upload images in the References tab.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {references.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setPrompt((p) => p + (p.endsWith(' ') || p === '' ? '' : ' ') + `@${r.tag} `)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 transition-all text-left group"
                    title={`Click to insert @${r.tag}`}
                  >
                    {r.type === 'image' ? (
                      <img src={r.file_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                        {r.type === 'video' ? '🎬' : r.type === 'pdf' ? '📄' : '📝'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-purple-300 group-hover:text-purple-200">
                        @{r.tag}
                      </div>
                      <div className="text-xs text-white/40 truncate">{r.name}</div>
                    </div>
                    <div className="ml-auto text-white/20 group-hover:text-purple-400 text-xs">+</div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-white/25 mt-3 leading-relaxed">
              Tag names are auto-derived from file names.<br />
              <span className="text-purple-400">@hugo</span> → injects Hugo's image as a reference for character consistency.
            </p>
          </div>

          {/* Tag syntax guide */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-purple-200 mb-2">💡 Tag Syntax</h3>
            <div className="space-y-1.5 text-xs text-white/50">
              <div><span className="text-purple-300 font-mono">@hugo</span> — character reference</div>
              <div><span className="text-purple-300 font-mono">@gloriasroom</span> — location reference</div>
              <div><span className="text-purple-300 font-mono">@scene1</span> — scene reference</div>
              <div><span className="text-purple-300 font-mono">@forest</span> — background/environment</div>
              <div className="pt-1 text-white/30 italic">Tags auto-inject as reference images.<br />Use spaces between multiple tags.</div>
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Prompt + Controls ── */}
        <div className="flex flex-col gap-4">

          {/* Prompt with @mention */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-sm font-semibold text-purple-200 mb-2">
              ✍️ Prompt
              <span className="text-xs font-normal text-white/40 ml-2">type @ to reference a character, place, or scene</span>
            </label>
            <div className="rounded-lg bg-white/5 border border-white/15 px-3 py-2 focus-within:border-purple-500/60 transition-colors">
              <MentionTextarea
                value={prompt}
                onChange={setPrompt}
                references={references}
                placeholder={mode === 'panel'
                  ? '@hugo stands at the edge of a cliff in @gloriasroom, rain pouring down, katana raised…'
                  : '@hugo and @villaincharacter face off in @burningtemple, cherry blossoms swirling…'}
                rows={5}
                className="w-full bg-transparent placeholder-white/20 outline-none"
              />
            </div>
            {/* Show which @mentions are resolved */}
            {prompt.includes('@') && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Array.from(prompt.matchAll(/@([a-zA-Z0-9]+)/g)).map((m, i) => {
                  const tag = m[1].toLowerCase();
                  const ref = references.find((r) => r.tag === tag);
                  return (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-full font-mono ${ref ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'bg-red-600/20 text-red-400 border border-red-500/30'}`}
                    >
                      @{tag} {ref ? '✓' : '✗ not found'}
                    </span>
                  );
                })}
              </div>
            )}
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
                    <label className="block text-xs text-white/50 mb-1">Duration: {clipDuration}s</label>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      step={1}
                      value={clipDuration}
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
                      🎵 Generate audio
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">{progressLabel}</span>
                <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: mode === 'panel'
                      ? 'linear-gradient(90deg, #9333ea, #db2777)'
                      : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !canAfford}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : !canAfford
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : mode === 'panel'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/50'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/50'
            }`}
          >
            {loading
              ? '✨ Generating…'
              : !canAfford
              ? `⚡ Need ${currentCost} credits`
              : mode === 'panel'
              ? `🎨 Generate Panel — ${currentCost} credits`
              : `🎬 Generate Clip — ${currentCost} credits`}
          </button>

          {/* Model info */}
          <p className="text-xs text-white/25 text-center">
            {mode === 'panel'
              ? "Powered by Google's Nano Banana Pro (Gemini 3 Image). Up to 14 reference images. @mentions auto-inject as references."
              : "Powered by ByteDance Seedance 2.0. Up to 15s, 1080p, native audio. @mentions auto-inject as character references."}
          </p>
        </div>

        {/* ── RIGHT: Preview + Gallery ── */}
        <div className="flex flex-col gap-4">

          {/* Large preview */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden aspect-[3/4] flex items-center justify-center">
            {selected ? (
              selected.type === 'panel' ? (
                <img
                  src={selected.url}
                  alt="Generated manga panel"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={selected.url}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-white/30 text-sm">Your generation will appear here</p>
                <p className="text-white/20 text-xs mt-2">Upload references → tag them → generate</p>
              </div>
            )}
          </div>

          {/* Selected item prompt */}
          {selected && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-white/50 leading-relaxed">
              <span className="text-purple-400 font-semibold text-xs">Prompt used: </span>
              {selected.prompt}
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-purple-200 mb-3">📁 Session Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selected?.id === item.id
                        ? 'border-purple-500 scale-105'
                        : 'border-transparent hover:border-white/30'
                    }`}
                  >
                    {item.type === 'panel' ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-900/40 flex items-center justify-center text-2xl">
                        🎬
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reference images used */}
          {imageRefs.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-purple-200 mb-2">🔗 Your Image References</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {imageRefs.map((r) => (
                  <div key={r.id} className="relative group" title={`@${r.tag}`}>
                    <img src={r.file_url} alt={r.name} className="w-full aspect-square rounded object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-end justify-center pb-1">
                      <span className="text-white text-xs font-mono">@{r.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
