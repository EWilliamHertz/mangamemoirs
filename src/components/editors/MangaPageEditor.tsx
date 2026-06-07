'use client';

import { useState } from 'react';
import { Plus, Trash2, Layout, Settings2, Download } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
type PanelSize = 'full' | 'half-h' | 'half-v' | 'quarter' | 'wide' | 'tall';

interface Panel {
  id: string;
  imageUrl: string;
  caption: string;
  order: number;
  sceneName: string;
}

interface Page {
  id: string;
  title: string;
  panels: Panel[];
  layout: LayoutPreset;
  readingDir: 'ltr' | 'rtl';
}

type LayoutPreset = '2x2' | '1+2' | '2+1' | 'manga-5' | 'splash' | 'widescreen' | 'classic-3';

/* ─── Layout configs ─────────────────────────────────────── */
interface LayoutConfig {
  name: string;
  slots: { col: string; row: string; label: string }[];
}

const LAYOUTS: Record<LayoutPreset, LayoutConfig> = {
  '2x2': { name: '2×2 Grid', slots: [{ col: 'col-span-1', row: 'row-span-1', label: '1' }, { col: 'col-span-1', row: 'row-span-1', label: '2' }, { col: 'col-span-1', row: 'row-span-1', label: '3' }, { col: 'col-span-1', row: 'row-span-1', label: '4' }] },
  '1+2': { name: 'Big Top', slots: [{ col: 'col-span-2', row: 'row-span-1', label: '1' }, { col: 'col-span-1', row: 'row-span-1', label: '2' }, { col: 'col-span-1', row: 'row-span-1', label: '3' }] },
  '2+1': { name: 'Big Bottom', slots: [{ col: 'col-span-1', row: 'row-span-1', label: '1' }, { col: 'col-span-1', row: 'row-span-1', label: '2' }, { col: 'col-span-2', row: 'row-span-1', label: '3' }] },
  'manga-5': { name: 'Manga 5-Panel', slots: [{ col: 'col-span-1', row: 'row-span-2', label: '1' }, { col: 'col-span-1', row: 'row-span-1', label: '2' }, { col: 'col-span-1', row: 'row-span-1', label: '3' }, { col: 'col-span-2', row: 'row-span-1', label: '4' }] },
  'splash': { name: 'Splash Page', slots: [{ col: 'col-span-2', row: 'row-span-3', label: '1 (Full)' }] },
  'widescreen': { name: 'Cinematic', slots: [{ col: 'col-span-2', row: 'row-span-1', label: '1' }, { col: 'col-span-2', row: 'row-span-1', label: '2' }, { col: 'col-span-2', row: 'row-span-1', label: '3' }] },
  'classic-3': { name: 'Classic Strip', slots: [{ col: 'col-span-2', row: 'row-span-1', label: '1' }, { col: 'col-span-2', row: 'row-span-1', label: '2' }, { col: 'col-span-2', row: 'row-span-1', label: '3' }] },
};

/* ─── Demo data ──────────────────────────────────────────── */
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#1f2937"/><text x="200" y="150" text-anchor="middle" fill="#374151" font-family="sans-serif" font-size="16">Panel</text>
  </svg>
`);

const DEMO_PANELS: Panel[] = [
  { id: 'p1', imageUrl: PLACEHOLDER, caption: 'The sun rises over the village...', order: 1, sceneName: 'Scene 1' },
  { id: 'p2', imageUrl: PLACEHOLDER, caption: 'She stands at the threshold.', order: 2, sceneName: 'Scene 2' },
  { id: 'p3', imageUrl: PLACEHOLDER, caption: 'A lone traveller on the road.', order: 3, sceneName: 'Scene 3' },
  { id: 'p4', imageUrl: PLACEHOLDER, caption: '"I will return," he said.', order: 4, sceneName: 'Scene 4' },
];

function makeBlankPage(n: number): Page {
  return { id: `pg${Date.now()}_${n}`, title: `Page ${n}`, panels: [], layout: '2x2', readingDir: 'ltr' };
}

/* ─── Main component ─────────────────────────────────────── */
export default function MangaPageEditor({ projectId }: { projectId: string }) {
  const [pages, setPages] = useState<Page[]>([
    { ...makeBlankPage(1), panels: DEMO_PANELS.slice(0, 4), layout: '2x2' },
    { ...makeBlankPage(2), panels: [], layout: 'splash' },
  ]);
  const [availablePanels] = useState<Panel[]>(DEMO_PANELS);
  
  // Selection State for Properties Sidebar
  const [selectedPageIdx, setSelectedPageIdx] = useState<number | null>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  // Drag State
  const [dragOverInfo, setDragOverInfo] = useState<{pageIdx: number, slotIdx: number} | null>(null);

  /* --- Helpers --- */
  const updatePage = (pageIdx: number, patch: Partial<Page>) => {
    setPages(prev => prev.map((p, i) => i === pageIdx ? { ...p, ...patch } : p));
  };

  const getPanelAtSlot = (pageIdx: number, slotIdx: number): Panel | undefined => {
    return pages[pageIdx].panels.find(p => p.order === slotIdx + 1);
  };

  /* --- Drag and Drop Logic --- */
  const onLibraryDragStart = (e: React.DragEvent, panel: Panel) => {
    e.dataTransfer.setData('source', 'library');
    e.dataTransfer.setData('panelId', panel.id);
  };

  const onSlotDragStart = (e: React.DragEvent, pageIdx: number, slotIdx: number) => {
    const panel = getPanelAtSlot(pageIdx, slotIdx);
    if (panel) {
      e.dataTransfer.setData('source', 'slot');
      e.dataTransfer.setData('panelId', panel.id);
      e.dataTransfer.setData('fromPage', String(pageIdx));
      e.dataTransfer.setData('fromSlot', String(slotIdx));
    }
  };

  const onSlotDrop = (e: React.DragEvent, toPageIdx: number, toSlotIdx: number) => {
    e.preventDefault();
    setDragOverInfo(null);
    const source = e.dataTransfer.getData('source');
    const panelId = e.dataTransfer.getData('panelId');

    if (source === 'slot') {
      const fromPage = parseInt(e.dataTransfer.getData('fromPage'));
      const fromSlot = parseInt(e.dataTransfer.getData('fromSlot'));
      const panelToMove = getPanelAtSlot(fromPage, fromSlot);
      const panelAtDest = getPanelAtSlot(toPageIdx, toSlotIdx);

      if (!panelToMove) return;

      setPages(prev => {
        const newPages = [...prev];
        newPages[fromPage].panels = newPages[fromPage].panels.filter(p => p.id !== panelToMove.id);
        
        if (panelAtDest) {
          newPages[toPageIdx].panels = newPages[toPageIdx].panels.filter(p => p.id !== panelAtDest.id);
          newPages[fromPage].panels.push({ ...panelAtDest, order: fromSlot + 1 });
        }
        newPages[toPageIdx].panels.push({ ...panelToMove, order: toSlotIdx + 1 });
        return newPages;
      });
    } else if (source === 'library') {
      const panel = availablePanels.find(p => p.id === panelId);
      if (panel) {
        setPages(prev => {
          const newPages = [...prev];
          // Remove from destination page if it exists
          newPages[toPageIdx].panels = newPages[toPageIdx].panels.filter(p => p.order !== toSlotIdx + 1);
          newPages[toPageIdx].panels.push({ ...panel, order: toSlotIdx + 1 });
          return newPages;
        });
      }
    }
  };

  const addPage = () => setPages(prev => [...prev, makeBlankPage(prev.length + 1)]);
  const removePage = (idx: number) => setPages(prev => prev.filter((_, i) => i !== idx));

  // Determine what to show in the right sidebar
  const activePanel = selectedPageIdx !== null && selectedSlotIdx !== null ? getPanelAtSlot(selectedPageIdx, selectedSlotIdx) : null;
  const activePage = selectedPageIdx !== null ? pages[selectedPageIdx] : null;

  return (
    <div className="flex h-screen bg-[#030305] text-white overflow-hidden select-none">

      {/* ── Left: Panel Library ── */}
      <aside className="w-64 bg-void border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 bg-black/20">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <Layout className="w-4 h-4 text-plasma" /> Generated Panels
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {availablePanels.map(panel => (
            <div
              key={panel.id}
              draggable
              onDragStart={e => onLibraryDragStart(e, panel)}
              className="rounded-xl overflow-hidden border border-white/10 hover:border-plasma hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] cursor-grab active:cursor-grabbing transition-all group bg-surface"
            >
              <img src={panel.imageUrl} alt={panel.sceneName} className="w-full h-24 object-cover" />
              <div className="px-3 py-2 bg-black/40 border-t border-white/5">
                <p className="text-xs font-bold text-gray-300 truncate">{panel.sceneName}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Center: Vertical Scroll Canvas ── */}
      <div className="flex-1 overflow-y-auto bg-[#030305] flex flex-col items-center py-12 px-4 gap-20 speed-lines scroll-smooth relative">
        
        {pages.map((page, pageIdx) => {
          const layout = LAYOUTS[page.layout];
          const slots = layout.slots;

          return (
            <div key={page.id} className="w-full max-w-[560px] flex flex-col gap-3 relative animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              {/* Floating Page Toolbar */}
              <div className="flex items-center justify-between bg-void/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl sticky top-4 z-20 transition-all hover:bg-void">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-sm text-white px-2">Page {pageIdx + 1}</span>
                  <div className="h-4 w-px bg-white/10" />
                  <select
                    className="bg-surface text-xs text-white rounded-lg border border-white/10 p-2 outline-none cursor-pointer focus:border-plasma transition-colors"
                    value={page.layout}
                    onChange={e => updatePage(pageIdx, { layout: e.target.value as LayoutPreset })}
                  >
                    {Object.entries(LAYOUTS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
                <button onClick={() => removePage(pageIdx)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Page Canvas Container */}
              <div 
                className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.6)] rounded-sm ring-1 ring-white/10 relative"
                style={{ aspectRatio: '2/3', padding: 8, direction: page.readingDir }}
              >
                <div 
                  className="w-full h-full grid gap-[6px]"
                  style={{ gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: `repeat(${Math.ceil(slots.length / 2) + 1}, 1fr)` }}
                >
                  {slots.map((slot, slotIdx) => {
                    const panel = getPanelAtSlot(pageIdx, slotIdx);
                    const isSelected = selectedPageIdx === pageIdx && selectedSlotIdx === slotIdx;
                    const isDragOver = dragOverInfo?.pageIdx === pageIdx && dragOverInfo?.slotIdx === slotIdx;

                    return (
                      <div
                        key={slotIdx}
                        draggable={!!panel}
                        onDragStart={e => onSlotDragStart(e, pageIdx, slotIdx)}
                        onDrop={e => onSlotDrop(e, pageIdx, slotIdx)}
                        onDragOver={e => { e.preventDefault(); setDragOverInfo({ pageIdx, slotIdx }); }}
                        onDragLeave={() => setDragOverInfo(null)}
                        onClick={() => { setSelectedPageIdx(pageIdx); setSelectedSlotIdx(slotIdx); }}
                        className={`${slot.col} ${slot.row} relative border-2 transition-all cursor-pointer overflow-hidden ${isSelected ? 'border-plasma z-10 shadow-[0_0_20px_rgba(124,58,237,0.5)]' : isDragOver ? 'border-blue-400 bg-blue-500/10 border-dashed' : 'border-gray-800 bg-gray-100 hover:border-gray-400'}`}
                        style={{
                          gridColumn: slot.col === 'col-span-2' ? 'span 2' : undefined,
                          gridRow: slot.row === 'row-span-2' ? 'span 2' : slot.row === 'row-span-3' ? 'span 3' : undefined,
                        }}
                      >
                        {panel ? (
                          <>
                            <img src={panel.imageUrl} alt="" className="w-full h-full object-cover" />
                            {panel.caption && (
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-2 px-3">
                                <p className="text-[10px] text-white leading-tight font-medium">{panel.caption}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                            <Plus className="w-6 h-6 text-gray-800 mb-1" />
                            <span className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">{slot.label}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        <button 
          onClick={addPage}
          className="w-full max-w-[560px] py-6 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 hover:text-plasma hover:border-plasma/50 hover:bg-plasma/5 transition-all flex flex-col items-center justify-center gap-2 font-bold group"
        >
          <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          Add New Page
        </button>
      </div>

      {/* ── Right: Inspector ── */}
      <aside className="w-72 bg-void border-l border-white/5 flex flex-col shrink-0 z-10 shadow-2xl overflow-y-auto">
        <div className="px-6 py-5 border-b border-white/5 bg-black/20">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-plasma" /> Inspector
          </h2>
        </div>

        {activePanel ? (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="aspect-video bg-surface rounded-lg overflow-hidden border border-white/10">
              <img src={activePanel.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Panel Caption</label>
              <textarea
                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-plasma focus:ring-1 focus:ring-plasma transition-all text-white"
                rows={4}
                placeholder="Enter dialog or narration..."
                value={activePanel.caption}
                onChange={e => {
                  const newPanels = pages[selectedPageIdx!].panels.map(p =>
                    p.id === activePanel.id ? { ...p, caption: e.target.value } : p
                  );
                  updatePage(selectedPageIdx!, { panels: newPanels });
                }}
              />
            </div>

            <button
              onClick={() => {
                const newPanels = pages[selectedPageIdx!].panels.filter(p => p.id !== activePanel.id);
                updatePage(selectedPageIdx!, { panels: newPanels });
                setSelectedSlotIdx(null);
              }}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl border border-red-500/20 transition-all"
            >
              Remove from Page
            </button>
          </div>
        ) : activePage ? (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4">
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Page Reading Direction</label>
              <div className="flex bg-surface rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => updatePage(selectedPageIdx!, { readingDir: 'ltr' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activePage.readingDir === 'ltr' ? 'bg-plasma text-white' : 'text-gray-500 hover:text-white'}`}
                >L → R</button>
                <button 
                  onClick={() => updatePage(selectedPageIdx!, { readingDir: 'rtl' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activePage.readingDir === 'rtl' ? 'bg-plasma text-white' : 'text-gray-500 hover:text-white'}`}
                >R ← L</button>
              </div>
            </div>
            <div className="bg-plasma/10 border border-plasma/20 rounded-xl p-4">
              <p className="text-xs text-plasma/90 leading-relaxed font-medium">
                Click a layout slot on Page {selectedPageIdx! + 1} to edit its text captions and properties.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm mt-10">
            Select a panel or page to inspect its properties.
          </div>
        )}

        {/* Global Export Footer */}
        <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
          <button className="w-full py-3 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Export Comic to PDF
          </button>
        </div>
      </aside>
    </div>
  );
}