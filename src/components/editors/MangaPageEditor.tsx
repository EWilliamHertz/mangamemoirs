'use client';

import { useState, useRef, useCallback } from 'react';

/* ─── Types ──────────────────────────────────────────────── */
type PanelSize = 'full' | 'half-h' | 'half-v' | 'quarter' | 'wide' | 'tall';

interface Panel {
  id: string;
  imageUrl: string;
  caption: string;
  order: number;
  size: PanelSize;
  sceneName: string;
}

interface Page {
  id: string;
  title: string;
  panels: Panel[];
  layout: LayoutPreset;
  readingDir: 'ltr' | 'rtl';
}

type LayoutPreset =
  | '2x2'
  | '1+2'
  | '2+1'
  | 'manga-5'
  | 'splash'
  | 'widescreen'
  | 'classic-3';

/* ─── Layout configs ─────────────────────────────────────── */
interface LayoutConfig {
  name: string;
  icon: string;
  slots: { col: string; row: string; label: string }[];
}

const LAYOUTS: Record<LayoutPreset, LayoutConfig> = {
  '2x2': {
    name: '2×2 Grid',
    icon: '⊞',
    slots: [
      { col: 'col-span-1', row: 'row-span-1', label: 'Top Left' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Top Right' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Bottom Left' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Bottom Right' },
    ],
  },
  '1+2': {
    name: 'Big Top',
    icon: '▬▭▭',
    slots: [
      { col: 'col-span-2', row: 'row-span-1', label: 'Full Width Top' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Bottom Left' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Bottom Right' },
    ],
  },
  '2+1': {
    name: 'Big Bottom',
    icon: '▭▭▬',
    slots: [
      { col: 'col-span-1', row: 'row-span-1', label: 'Top Left' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Top Right' },
      { col: 'col-span-2', row: 'row-span-1', label: 'Full Width Bottom' },
    ],
  },
  'manga-5': {
    name: 'Manga 5-Panel',
    icon: '田',
    slots: [
      { col: 'col-span-1', row: 'row-span-2', label: 'Left Strip' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Top Right' },
      { col: 'col-span-1', row: 'row-span-1', label: 'Mid Right' },
      { col: 'col-span-2', row: 'row-span-1', label: 'Bottom Span' },
    ],
  },
  'splash': {
    name: 'Splash Page',
    icon: '⬜',
    slots: [
      { col: 'col-span-2', row: 'row-span-3', label: 'Full Page' },
    ],
  },
  'widescreen': {
    name: 'Cinematic',
    icon: '▬',
    slots: [
      { col: 'col-span-2', row: 'row-span-1', label: 'Wide Top' },
      { col: 'col-span-2', row: 'row-span-1', label: 'Wide Mid' },
      { col: 'col-span-2', row: 'row-span-1', label: 'Wide Bottom' },
    ],
  },
  'classic-3': {
    name: 'Classic Strip',
    icon: '≡',
    slots: [
      { col: 'col-span-2', row: 'row-span-1', label: 'Panel 1' },
      { col: 'col-span-2', row: 'row-span-1', label: 'Panel 2' },
      { col: 'col-span-2', row: 'row-span-1', label: 'Panel 3' },
    ],
  },
};

/* ─── Demo data ──────────────────────────────────────────── */
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#1f2937"/>
    <text x="200" y="150" text-anchor="middle" fill="#374151" font-family="sans-serif" font-size="16">Panel</text>
  </svg>
`);

const DEMO_PANELS: Panel[] = [
  { id: 'p1', imageUrl: PLACEHOLDER, caption: 'The sun rises over the village...', order: 1, size: 'full', sceneName: 'Scene 1' },
  { id: 'p2', imageUrl: PLACEHOLDER, caption: 'She stands at the threshold.', order: 2, size: 'half-h', sceneName: 'Scene 2' },
  { id: 'p3', imageUrl: PLACEHOLDER, caption: 'A lone traveller on the road.', order: 3, size: 'half-h', sceneName: 'Scene 3' },
  { id: 'p4', imageUrl: PLACEHOLDER, caption: '"I will return," he said.', order: 4, size: 'quarter', sceneName: 'Scene 4' },
  { id: 'p5', imageUrl: PLACEHOLDER, caption: 'The letter arrived at dawn.', order: 5, size: 'quarter', sceneName: 'Scene 5' },
  { id: 'p6', imageUrl: PLACEHOLDER, caption: 'Years pass like seasons.', order: 6, size: 'full', sceneName: 'Scene 6' },
];

function makeBlankPage(n: number): Page {
  return {
    id: `pg${n}`,
    title: `Page ${n}`,
    panels: [],
    layout: '2x2',
    readingDir: 'ltr',
  };
}

/* ─── Panel slot component ───────────────────────────────── */
function PanelSlot({
  panel,
  slotLabel,
  order,
  isSelected,
  onSelect,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
}: {
  panel?: Panel;
  slotLabel: string;
  order: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{ border: isSelected ? '2px solid #a855f7' : isDragOver ? '2px dashed #60a5fa' : '1px solid #374151' }}
      className={`relative rounded overflow-hidden cursor-pointer transition group ${
        isDragOver ? 'bg-blue-900/30' : 'bg-gray-900'
      }`}
    >
      {panel ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={panel.imageUrl} alt={panel.sceneName} className="w-full h-full object-cover" />
          {/* Reading order badge */}
          <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center text-xs font-bold text-white border border-purple-500">
            {order}
          </div>
          {/* Caption overlay */}
          {panel.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 pt-4 pb-1">
              <p className="text-xs text-white leading-snug">{panel.caption}</p>
            </div>
          )}
          {/* Scene name badge */}
          <div className="absolute top-1 right-1 bg-black/70 text-xs text-gray-300 px-1 rounded opacity-0 group-hover:opacity-100 transition">
            {panel.sceneName}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center min-h-[100px]">
          <div className="text-2xl text-gray-700 mb-1">+</div>
          <p className="text-xs text-gray-700">{slotLabel}</p>
          <p className="text-xs text-gray-800 mt-1">Drop panel here</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function MangaPageEditor({ projectId }: { projectId: string }) {
  const [pages, setPages] = useState<Page[]>([
    { ...makeBlankPage(1), panels: DEMO_PANELS.slice(0, 4), layout: '2x2' },
    { ...makeBlankPage(2), panels: DEMO_PANELS.slice(4, 6), layout: 'widescreen' },
  ]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [availablePanels] = useState<Panel[]>(DEMO_PANELS);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [draggingPanelId, setDraggingPanelId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  const page = pages[currentPageIdx];
  const layout = LAYOUTS[page.layout];
  const slots = layout.slots;

  const updatePage = (patch: Partial<Page>) => {
    setPages(prev => prev.map((p, i) => i === currentPageIdx ? { ...p, ...patch } : p));
  };

  const setSlotPanel = (slotIdx: number, panel: Panel | undefined) => {
    const newPanels = [...page.panels];
    if (panel) {
      newPanels[slotIdx] = { ...panel, order: slotIdx + 1 };
    } else {
      newPanels[slotIdx] = undefined as unknown as Panel;
    }
    updatePage({ panels: newPanels.filter(Boolean) });
  };

  const getPanelAtSlot = (slotIdx: number): Panel | undefined => {
    // Map panels to slots by their order (1-indexed → 0-indexed)
    return page.panels.find(p => p.order === slotIdx + 1);
  };

  /* drag from library */
  const onLibraryDragStart = (e: React.DragEvent, panel: Panel) => {
    setDraggingPanelId(panel.id);
    e.dataTransfer.setData('panelId', panel.id);
  };

  const onSlotDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    const panelId = e.dataTransfer.getData('panelId');
    const panel = availablePanels.find(p => p.id === panelId);
    if (panel) {
      const assignedPanels = [...page.panels.filter(p => p.order !== slotIdx + 1)];
      assignedPanels.push({ ...panel, order: slotIdx + 1 });
      assignedPanels.sort((a, b) => a.order - b.order);
      updatePage({ panels: assignedPanels });
    }
    setDragOverSlot(null);
    setDraggingPanelId(null);
  };

  /* reorder via drag between slots */
  const onSlotDragStart = (e: React.DragEvent, slotIdx: number) => {
    const panel = getPanelAtSlot(slotIdx);
    if (panel) {
      e.dataTransfer.setData('slotPanelId', panel.id);
      e.dataTransfer.setData('fromSlot', String(slotIdx));
    }
  };

  const onSlotDropReorder = (e: React.DragEvent, toSlot: number) => {
    e.preventDefault();
    const fromSlot = parseInt(e.dataTransfer.getData('fromSlot'));
    const panelId = e.dataTransfer.getData('slotPanelId');
    if (!isNaN(fromSlot) && panelId) {
      const panelA = getPanelAtSlot(fromSlot);
      const panelB = getPanelAtSlot(toSlot);
      const newPanels = page.panels.map(p => {
        if (p.id === panelA?.id) return { ...p, order: toSlot + 1 };
        if (p.id === panelB?.id) return { ...p, order: fromSlot + 1 };
        return p;
      });
      updatePage({ panels: newPanels });
    } else {
      onSlotDrop(e, toSlot);
    }
    setDragOverSlot(null);
  };

  const addPage = () => {
    setPages(prev => [...prev, makeBlankPage(prev.length + 1)]);
    setCurrentPageIdx(pages.length);
  };

  const removePage = (idx: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== idx));
    setCurrentPageIdx(Math.max(0, idx - 1));
  };

  const selectedPanel = selectedSlotIdx !== null ? getPanelAtSlot(selectedSlotIdx) : null;

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden select-none">

      {/* ── Left: panel library ── */}
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Panel Library</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {availablePanels.map(panel => (
            <div
              key={panel.id}
              draggable
              onDragStart={e => onLibraryDragStart(e, panel)}
              className="rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 cursor-grab active:cursor-grabbing transition group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={panel.imageUrl} alt={panel.sceneName} className="w-full h-20 object-cover" />
              <div className="px-2 py-1 bg-gray-800">
                <p className="text-xs font-medium truncate">{panel.sceneName}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Center: page canvas ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Page tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-gray-900 border-b border-gray-800 overflow-x-auto shrink-0">
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setCurrentPageIdx(i); setSelectedSlotIdx(null); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-t text-sm font-medium transition ${
                i === currentPageIdx ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              📄 {p.title}
              {pages.length > 1 && (
                <span
                  onClick={e => { e.stopPropagation(); removePage(i); }}
                  className="ml-1 text-gray-600 hover:text-red-400 text-xs"
                >✕</span>
              )}
            </button>
          ))}
          <button onClick={addPage}
            className="px-3 py-1.5 text-gray-500 hover:text-white text-sm transition">+ Page</button>
        </div>

        {/* Layout picker */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border-b border-gray-800 overflow-x-auto shrink-0">
          <span className="text-xs text-gray-500 shrink-0">Layout:</span>
          {(Object.entries(LAYOUTS) as [LayoutPreset, LayoutConfig][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => updatePage({ layout: key })}
              className={`px-3 py-1 rounded text-xs font-medium transition shrink-0 ${
                page.layout === key ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {cfg.icon} {cfg.name}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => updatePage({ readingDir: page.readingDir === 'ltr' ? 'rtl' : 'ltr' })}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 shrink-0 transition"
          >
            {page.readingDir === 'ltr' ? '→ L to R' : '← R to L'}
          </button>
        </div>

        {/* Page canvas */}
        <div className="flex-1 overflow-auto bg-gray-950 flex items-start justify-center p-8">
          <div
            className="bg-white shadow-2xl rounded"
            style={{
              width: 520,
              aspectRatio: '2/3',
              padding: 8,
              direction: page.readingDir === 'rtl' ? 'rtl' : 'ltr',
            }}
          >
            <div
              className="w-full h-full grid gap-1"
              style={{
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: `repeat(${Math.ceil(slots.length / 2) + 1}, 1fr)`,
              }}
            >
              {slots.map((slot, idx) => {
                const panel = getPanelAtSlot(idx);
                return (
                  <div
                    key={idx}
                    draggable={!!panel}
                    onDragStart={e => onSlotDragStart(e, idx)}
                    className={slot.col + ' ' + slot.row}
                    style={{
                      gridColumn: slot.col === 'col-span-2' ? 'span 2' : undefined,
                      gridRow: slot.row === 'row-span-2' ? 'span 2' : slot.row === 'row-span-3' ? 'span 3' : undefined,
                      minHeight: 80,
                    }}
                  >
                    <PanelSlot
                      panel={panel}
                      slotLabel={slot.label}
                      order={idx + 1}
                      isSelected={selectedSlotIdx === idx}
                      onSelect={() => setSelectedSlotIdx(selectedSlotIdx === idx ? null : idx)}
                      onDrop={e => onSlotDropReorder(e, idx)}
                      isDragOver={dragOverSlot === idx}
                      onDragOver={e => { e.preventDefault(); setDragOverSlot(idx); }}
                      onDragLeave={() => setDragOverSlot(null)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: panel properties ── */}
      <aside className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {selectedPanel ? 'Panel Properties' : 'Page Properties'}
          </p>
        </div>

        {selectedPanel ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Scene</label>
              <p className="text-sm text-white font-medium">{selectedPanel.sceneName}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Caption</label>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-500"
                rows={3}
                value={selectedPanel.caption}
                onChange={e => {
                  const newPanels = page.panels.map(p =>
                    p.id === selectedPanel.id ? { ...p, caption: e.target.value } : p
                  );
                  updatePage({ panels: newPanels });
                }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">Reading Position</label>
              <p className="text-xl font-bold text-purple-400 text-center">
                #{(selectedSlotIdx ?? 0) + 1}
              </p>
            </div>

            <button
              onClick={() => {
                const newPanels = page.panels.filter(p => p.id !== selectedPanel.id);
                updatePage({ panels: newPanels });
                setSelectedSlotIdx(null);
              }}
              className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm rounded-lg border border-red-800 transition"
            >
              Remove from Page
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Page Title</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                value={page.title}
                onChange={e => updatePage({ title: e.target.value })}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Layout</span>
                <span className="text-white">{LAYOUTS[page.layout].name}</span>
              </div>
              <div className="flex justify-between">
                <span>Panels</span>
                <span className="text-white">{page.panels.length} / {slots.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Reading</span>
                <span className="text-white">{page.readingDir === 'ltr' ? 'Left → Right' : 'Right ← Left'}</span>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-3 text-xs text-purple-300">
              💡 Drag panels from the library onto page slots, or drag slots to swap panels.
            </div>

            <button
              onClick={() => {
                const config = { projectId, pages };
                const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'manga-layout.json'; a.click();
              }}
              className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg font-bold transition"
            >
              Export Layout JSON
            </button>

            <button
              onClick={() => alert('PDF export coming soon! Your panel layout will be compiled into a comic-book ready PDF.')}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition"
            >
              Export as PDF 📄
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
