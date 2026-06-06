'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserButton } from '@clerk/nextjs';
import {
  BookOpen, Layers, Sparkles, Film, Library, ChevronRight,
  Upload, Plus, Trash2, RefreshCw, Zap, CreditCard, X,
  Image as ImageIcon, FileText, Video, AlertCircle, Check,
  Download, ExternalLink, Settings, Star
} from 'lucide-react';
import { CREDIT_COSTS, PACKS } from '@/lib/credits';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Scene {
  id?: string; index: number; title: string; description: string;
  visualPrompt: string; mood: string; panelType: string;
  characters?: string[]; settingNote?: string;
  panelUrl?: string; clipUrl?: string; generating?: boolean; generatingClip?: boolean;
}
interface Reference {
  id: string; name: string; type: string; content?: string;
  file_url?: string; created_at: string;
}
type Tab = 'story' | 'scenes' | 'generate' | 'storyboard' | 'references';

const STYLES = ['Anime','Shonen','Shojo','Seinen','Ghibli','Cyberpunk','Webtoon','Classic'];
const MOODS  = ['Dramatic','Action','Peaceful','Romantic','Melancholic','Tense','Epic','Mysterious'];

// ── Credit Badge ───────────────────────────────────────────────────────────────
function CreditBadge({ credits, onBuy }: { credits: number; onBuy: () => void }) {
  const low = credits < 5;
  return (
    <button
      onClick={onBuy}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
        low ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 animate-pulse' : 'border-solar/30 bg-solar/10 text-solar'
      }`}
    >
      <Star className="w-3.5 h-3.5" />
      {credits} credits
      {low && <span className="text-xs font-normal opacity-70">— buy more</span>}
    </button>
  );
}

// ── Pricing Modal ──────────────────────────────────────────────────────────────
function PricingModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function buy(pack: string) {
    setLoading(pack);
    try {
      window.location.href = `mailto:ewilliamhe@gmail.com?subject=Ouriye Credits - ${pack}&body=Hi! I'd like to top up credits. My account email is: `;
    } finally { setLoading(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-panel border border-white/10 rounded-2xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black gradient-text">Buy Credits</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-white/50 text-sm mb-6">Panel = {CREDIT_COSTS.PANEL} credits · Anime Clip = {CREDIT_COSTS.CLIP} credits</p>
        <div className="grid grid-cols-3 gap-4">
          {PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => buy(p.id)}
              disabled={!!loading}
              className={`p-4 rounded-xl border text-left transition-all ${
                p.id === 'creator' ? 'border-plasma/50 bg-plasma/10 hover:bg-plasma/20' : 'border-white/10 bg-surface hover:bg-white/5'
              }`}
            >
              {p.id === 'creator' && <span className="text-xs font-bold text-plasma-light bg-plasma/20 px-2 py-0.5 rounded-full mb-2 inline-block">Popular</span>}
              <div className="text-lg font-black">{p.price}</div>
              <div className="text-solar font-semibold">{p.credits} credits</div>
              <div className="text-white/40 text-xs mt-1">{p.label}</div>
              {loading === p.id && <div className="text-xs text-plasma-light mt-2">Redirecting…</div>}
            </button>
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-6">Email to top up · Credits never expire · ewilliamhe@gmail.com</p>
      </div>
    </div>
  );
}

// ── Scene Card ─────────────────────────────────────────────────────────────────
function SceneCard({
  scene, index: idx, style, onGenPanel, onGenClip, onEdit, credits
}: {
  scene: Scene; index: number; style: string;
  onGenPanel: (i: number) => void; onGenClip: (i: number) => void;
  onEdit: (i: number, field: string, val: string) => void; credits: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all ${scene.panelUrl ? 'border-plasma/30 bg-plasma/5' : 'border-white/10 bg-panel'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-surface flex items-center justify-center">
            {scene.panelUrl
              ? <img src={scene.panelUrl} alt="" className="w-full h-full object-cover" />
              : <ImageIcon className="w-6 h-6 text-white/20" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-plasma-light">#{scene.index}</span>
              <span className="text-sm font-bold truncate">{scene.title}</span>
              <span className="text-xs text-white/30 bg-surface px-2 py-0.5 rounded-full">{scene.mood}</span>
            </div>
            <p className="text-xs text-white/50 line-clamp-2">{scene.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onGenPanel(idx)}
                disabled={scene.generating || credits < CREDIT_COSTS.PANEL}
                className="flex items-center gap-1.5 text-xs bg-plasma/20 hover:bg-plasma/40 text-plasma-light border border-plasma/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              >
                {scene.generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {scene.generating ? 'Generating…' : `Panel (${CREDIT_COSTS.PANEL}cr)`}
              </button>
              <button
                onClick={() => onGenClip(idx)}
                disabled={scene.generatingClip || credits < CREDIT_COSTS.CLIP}
                className="flex items-center gap-1.5 text-xs bg-bloom/20 hover:bg-bloom/40 text-bloom border border-bloom/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              >
                {scene.generatingClip ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                {scene.generatingClip ? 'Generating…' : `Clip (${CREDIT_COSTS.CLIP}cr)`}
              </button>
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-white/30 hover:text-white/60 ml-auto">
                {expanded ? 'Less' : 'Edit'}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded editor */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Scene Description</label>
              <textarea
                value={scene.description}
                onChange={(e) => onEdit(idx, 'description', e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Visual Prompt (for AI)</label>
              <textarea
                value={scene.visualPrompt}
                onChange={(e) => onEdit(idx, 'visualPrompt', e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-white/40 mb-1 block">Mood</label>
                <select
                  value={scene.mood}
                  onChange={(e) => onEdit(idx, 'mood', e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {MOODS.map(m => <option key={m} value={m.toLowerCase()}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-white/40 mb-1 block">Panel Type</label>
                <select
                  value={scene.panelType}
                  onChange={(e) => onEdit(idx, 'panelType', e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {['full-page','splash','action-sequence','close-up','panoramic','grid-4','grid-6'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Clip preview */}
        {scene.clipUrl && (
          <div className="mt-3">
            <video src={scene.clipUrl} controls className="w-full rounded-xl max-h-40" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reference Library ──────────────────────────────────────────────────────────
function ReferenceLibrary() {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textName, setTextName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadRefs(); }, []);

  async function loadRefs() {
    const res = await fetch('/api/references');
    const { references } = await res.json();
    setRefs(references);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const type = ext === 'pdf' ? 'pdf' : ['mp4','mov','webm'].includes(ext) ? 'video' : 'image';
    const fd = new FormData();
    fd.append('file', file); fd.append('type', type); fd.append('name', file.name);
    await fetch('/api/references', { method: 'POST', body: fd });
    await loadRefs(); setUploading(false);
  }

  async function addText() {
    if (!textInput.trim()) return;
    const fd = new FormData();
    fd.append('type', 'text'); fd.append('name', textName || 'Text Reference'); fd.append('content', textInput);
    await fetch('/api/references', { method: 'POST', body: fd });
    setTextInput(''); setTextName(''); await loadRefs();
  }

  async function deleteRef(id: string) {
    await fetch(`/api/references?id=${id}`, { method: 'DELETE' });
    setRefs(r => r.filter(x => x.id !== id));
  }

  const icon = (type: string) => ({ pdf: <FileText className="w-4 h-4 text-orange-400" />, image: <ImageIcon className="w-4 h-4 text-blue-400" />, video: <Video className="w-4 h-4 text-purple-400" />, text: <FileText className="w-4 h-4 text-green-400" /> }[type] ?? <FileText className="w-4 h-4" />);

  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-2xl border border-white/10 p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-plasma-light" /> Upload Reference</h3>
        <div
          className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-plasma/40 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.webm" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {uploading ? <RefreshCw className="w-8 h-8 mx-auto text-plasma animate-spin mb-2" /> : <Upload className="w-8 h-8 mx-auto text-white/20 mb-2" />}
          <p className="text-white/40 text-sm">{uploading ? 'Uploading…' : 'Drop PDF, image, or video · or click to browse'}</p>
        </div>
      </div>

      <div className="bg-panel rounded-2xl border border-white/10 p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-jade" /> Add Text Reference</h3>
        <input value={textName} onChange={(e) => setTextName(e.target.value)} placeholder="Reference name…" className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white mb-2" />
        <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste text, character descriptions, style notes…" className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white resize-none mb-3" rows={4} />
        <button onClick={addText} className="bg-jade/20 hover:bg-jade/40 border border-jade/30 text-jade text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Text
        </button>
      </div>

      <div className="space-y-3">
        {refs.length === 0 && <p className="text-white/30 text-sm text-center py-4">No references yet. Upload files or add text above.</p>}
        {refs.map(r => (
          <div key={r.id} className="flex items-start gap-3 p-3 bg-panel rounded-xl border border-white/5">
            <div className="mt-0.5">{icon(r.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              {r.type === 'image' && r.file_url && <img src={r.file_url} alt="" className="mt-2 w-full max-h-24 object-cover rounded-lg" />}
              {r.content && <p className="text-xs text-white/40 line-clamp-2 mt-1">{r.content}</p>}
            </div>
            <button onClick={() => deleteRef(r.id)} className="text-white/20 hover:text-red-400 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('story');
  const [credits, setCredits] = useState(0);
  const [showPricing, setShowPricing] = useState(false);

  // Story inputs
  const [story, setStory] = useState('');
  const [style, setStyle] = useState('Anime');
  const [mood, setMood] = useState('Dramatic');
  const [uploadStatus, setUploadStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Scenes
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [breaking, setBreaking] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'} | null>(null);
  function notify(msg: string, type: 'ok'|'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => { loadCredits(); }, []);

  async function loadCredits() {
    const res = await fetch('/api/credits');
    const { credits: c } = await res.json();
    setCredits(c);
  }

  async function uploadPDF(file: File) {
    setUploadStatus('Extracting text from PDF…');
    const fd = new FormData();
    fd.append('file', file); fd.append('type', 'pdf'); fd.append('name', file.name);
    const res = await fetch('/api/references', { method: 'POST', body: fd });
    const { reference } = await res.json();
    if (reference?.content) {
      setStory(reference.content.slice(0, 8000));
      setUploadStatus(`✓ Extracted ${reference.content.length.toLocaleString()} characters from ${file.name}`);
    } else {
      setUploadStatus('Could not extract text. Try pasting manually.');
    }
  }

  async function breakIntoScenes() {
    if (!story.trim()) return notify('Please enter your story first.', 'err');
    setBreaking(true);
    try {
      const res = await fetch('/api/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, style, mood }),
      });
      const { scenes: s, error } = await res.json();
      if (error) throw new Error(error);
      setScenes(s ?? []);
      setTab('scenes');
      notify(`✓ ${(s ?? []).length} scenes created!`);
    } catch (e: any) { notify(e.message, 'err'); }
    finally { setBreaking(false); }
  }

  async function generatePanel(sceneIdx: number) {
    if (credits < CREDIT_COSTS.PANEL) { setShowPricing(true); return; }
    setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, generating: true } : sc));
    try {
      const scene = scenes[sceneIdx];
      const res = await fetch('/api/generate-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualPrompt: scene.visualPrompt, style, mood: scene.mood, panelType: scene.panelType }),
      });
      const { imageUrl, creditsRemaining, error } = await res.json();
      if (error) throw new Error(error);
      setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, panelUrl: imageUrl, generating: false } : sc));
      setCredits(creditsRemaining);
      notify('Panel generated!');
    } catch (e: any) {
      setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, generating: false } : sc));
      notify(e.message, 'err');
    }
  }

  async function generateClip(sceneIdx: number) {
    if (credits < CREDIT_COSTS.CLIP) { setShowPricing(true); return; }
    setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, generatingClip: true } : sc));
    try {
      const scene = scenes[sceneIdx];
      const res = await fetch('/api/generate-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualPrompt: scene.visualPrompt, style, panelUrl: scene.panelUrl }),
      });
      const { predictionId, creditsRemaining, error } = await res.json();
      if (error) throw new Error(error);
      setCredits(creditsRemaining);
      // Poll for completion
      pollClip(predictionId, sceneIdx);
    } catch (e: any) {
      setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, generatingClip: false } : sc));
      notify(e.message, 'err');
    }
  }

  async function pollClip(predictionId: string, sceneIdx: number) {
    const poll = async () => {
      const res = await fetch(`/api/generate-clip?id=${predictionId}`);
      const { status, clipUrl, error } = await res.json();
      if (status === 'succeeded' && clipUrl) {
        setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, clipUrl, generatingClip: false } : sc));
        notify('Anime clip ready!');
      } else if (status === 'failed' || error) {
        setScenes(s => s.map((sc, i) => i === sceneIdx ? { ...sc, generatingClip: false } : sc));
        notify('Clip generation failed', 'err');
      } else {
        setTimeout(poll, 5000);
      }
    };
    setTimeout(poll, 8000);
  }

  function editScene(idx: number, field: string, val: string) {
    setScenes(s => s.map((sc, i) => i === idx ? { ...sc, [field]: val } : sc));
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'story',      label: 'Story',      icon: BookOpen },
    { id: 'scenes',     label: `Scenes (${scenes.length})`, icon: Layers },
    { id: 'generate',   label: 'Generate',   icon: Sparkles },
    { id: 'storyboard', label: 'Storyboard', icon: Film },
    { id: 'references', label: 'References', icon: Library },
  ];

  const donePanels = scenes.filter(s => s.panelUrl).length;
  const doneClips  = scenes.filter(s => s.clipUrl).length;

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-3 bg-void border-b border-white/5 shrink-0">
        <a href="/" className="text-lg font-black gradient-text">🎴 Ouriye</a>
        <div className="flex items-center gap-3">
          <CreditBadge credits={credits} onBuy={() => setShowPricing(true)} />
          <UserButton afterSignOutUrl="/" appearance={{ variables: { colorBackground: '#0f0f1c' } }} />
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 px-6 py-2 bg-void border-b border-white/5 overflow-x-auto shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-plasma text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* STORY TAB */}
        {tab === 'story' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black mb-1">Your Story</h2>
              <p className="text-white/40 text-sm">Upload a PDF memoir or paste/type your story below.</p>
            </div>
            {/* PDF Upload */}
            <div
              className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-plasma/40 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadPDF(f); }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input ref={fileRef} type="file" className="hidden" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPDF(f); }} />
              <BookOpen className="w-10 h-10 mx-auto text-white/20 mb-3" />
              <p className="text-white/50 font-medium">Drop your PDF memoir here</p>
              <p className="text-white/30 text-sm mt-1">or click to browse · Text extracted automatically</p>
              {uploadStatus && <p className="mt-3 text-sm text-plasma-light">{uploadStatus}</p>}
            </div>
            {/* Text input */}
            <div>
              <label className="text-sm text-white/40 mb-2 block">Or type / paste your story</label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Once upon a time, in 1987 Paris, I was…"
                className="w-full bg-panel border border-white/10 rounded-2xl px-4 py-3 text-white text-sm leading-relaxed resize-none"
                rows={12}
              />
              <p className="text-xs text-white/30 mt-1 text-right">{story.length.toLocaleString()} characters</p>
            </div>
            {/* Style + Mood */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/40 mb-2 block">Art Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-panel border border-white/10 rounded-xl px-3 py-2.5 text-white">
                  {STYLES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/40 mb-2 block">Overall Mood</label>
                <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-panel border border-white/10 rounded-xl px-3 py-2.5 text-white">
                  {MOODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={breakIntoScenes}
              disabled={breaking || !story.trim()}
              className="w-full flex items-center justify-center gap-2 bg-plasma hover:bg-plasma-light disabled:opacity-40 text-white font-bold py-4 rounded-2xl btn-glow transition-all"
            >
              {breaking ? <><RefreshCw className="w-5 h-5 animate-spin" /> Breaking into scenes…</> : <><Sparkles className="w-5 h-5" /> Break Into Scenes · Free</>}
            </button>
          </div>
        )}

        {/* SCENES TAB */}
        {tab === 'scenes' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Scene Review</h2>
                <p className="text-white/40 text-sm">{scenes.length} scenes · Edit prompts and moods before generating</p>
              </div>
              <button onClick={breakIntoScenes} disabled={breaking} className="flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 px-3 py-1.5 rounded-xl transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${breaking ? 'animate-spin' : ''}`} /> Re-break
              </button>
            </div>
            {scenes.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No scenes yet. Go to the Story tab and click "Break Into Scenes".</p>
              </div>
            )}
            {scenes.map((scene, i) => (
              <SceneCard key={i} scene={scene} index={i} style={style} onGenPanel={generatePanel} onGenClip={generateClip} onEdit={editScene} credits={credits} />
            ))}
          </div>
        )}

        {/* GENERATE TAB */}
        {tab === 'generate' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-black">Batch Generate</h2>
              <p className="text-white/40 text-sm">Generate all panels or clips at once. You can also generate individually from the Scenes tab.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-panel border border-white/10 rounded-2xl p-6">
                <Sparkles className="w-8 h-8 text-plasma-light mb-4" />
                <h3 className="font-bold text-lg mb-1">All Manga Panels</h3>
                <p className="text-white/40 text-sm mb-4">{scenes.length} scenes · {scenes.length * CREDIT_COSTS.PANEL} credits total</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Generated</span><span>{donePanels}/{scenes.length}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-plasma rounded-full transition-all" style={{ width: scenes.length ? `${(donePanels/scenes.length)*100}%` : '0%' }} />
                  </div>
                </div>
                <button
                  onClick={() => { scenes.forEach((_, i) => { if (!scenes[i].panelUrl && !scenes[i].generating) setTimeout(() => generatePanel(i), i * 2000); }); }}
                  disabled={scenes.length === 0 || credits < CREDIT_COSTS.PANEL}
                  className="w-full bg-plasma/20 hover:bg-plasma/40 border border-plasma/30 text-plasma-light font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40"
                >
                  Generate All Panels
                </button>
              </div>
              <div className="bg-panel border border-white/10 rounded-2xl p-6">
                <Film className="w-8 h-8 text-bloom mb-4" />
                <h3 className="font-bold text-lg mb-1">All Anime Clips</h3>
                <p className="text-white/40 text-sm mb-4">{scenes.length} clips · {scenes.length * CREDIT_COSTS.CLIP} credits total</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Generated</span><span>{doneClips}/{scenes.length}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-bloom rounded-full transition-all" style={{ width: scenes.length ? `${(doneClips/scenes.length)*100}%` : '0%' }} />
                  </div>
                </div>
                <button
                  onClick={() => { scenes.forEach((_, i) => { if (!scenes[i].clipUrl && !scenes[i].generatingClip) setTimeout(() => generateClip(i), i * 3000); }); }}
                  disabled={scenes.length === 0 || credits < CREDIT_COSTS.CLIP}
                  className="w-full bg-bloom/20 hover:bg-bloom/40 border border-bloom/30 text-bloom font-semibold py-2.5 rounded-xl transition-all disabled:opacity-40"
                >
                  Generate All Clips
                </button>
              </div>
            </div>
            {credits < 5 && (
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0" />
                <p className="text-sm text-orange-300">Running low on credits. <button onClick={() => setShowPricing(true)} className="underline hover:no-underline">Top up here</button>.</p>
              </div>
            )}
          </div>
        )}

        {/* STORYBOARD TAB */}
        {tab === 'storyboard' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Storyboard</h2>
                <p className="text-white/40 text-sm">{donePanels} panels · {doneClips} clips</p>
              </div>
            </div>
            {scenes.filter(s => s.panelUrl || s.clipUrl).length === 0 && (
              <div className="text-center py-16 text-white/30">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No panels or clips generated yet. Head to the Generate tab.</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {scenes.filter(s => s.panelUrl).map((scene, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-panel panel-card">
                  <img src={scene.panelUrl!} alt={scene.title} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-xs font-bold">{scene.title}</p>
                    <p className="text-xs text-white/60">Scene {scene.index}</p>
                    <div className="flex gap-2 mt-2">
                      <a href={scene.panelUrl!} target="_blank" rel="noreferrer" className="text-xs bg-white/20 hover:bg-white/40 px-2 py-1 rounded-lg flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
                      {scene.clipUrl && <span className="text-xs bg-bloom/30 px-2 py-1 rounded-lg">+ Clip</span>}
                    </div>
                  </div>
                  {scene.clipUrl && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-bloom flex items-center justify-center"><Film className="w-3 h-3" /></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REFERENCES TAB */}
        {tab === 'references' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-black">Reference Library</h2>
              <p className="text-white/40 text-sm">Upload PDFs, images, video, or text snippets to guide AI generation.</p>
            </div>
            <ReferenceLibrary />
          </div>
        )}
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 ${toast.type === 'ok' ? 'bg-jade/20 border border-jade/30 text-jade' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
          {toast.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Pricing Modal ── */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
