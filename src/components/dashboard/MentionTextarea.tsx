'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import type { ReferenceItem } from '@/app/actions/fetchReferences';

interface MentionTextareaProps {
  value: string;
  onChange: (val: string) => void;
  references: ReferenceItem[];
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function MentionTextarea({
  value,
  onChange,
  references,
  placeholder,
  rows = 4,
  className = '',
}: MentionTextareaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const filtered = references.filter(
    (r) => r.tag.includes(query.toLowerCase()) && (r.type === 'image' || r.type === 'video')
  );

  // --- track caret to position dropdown ---
  function getCaretXY(el: HTMLTextAreaElement, position: number) {
    const div = document.createElement('div');
    const style = getComputedStyle(el);
    [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
      'letterSpacing', 'paddingTop', 'paddingLeft', 'paddingRight',
      'borderLeftWidth', 'borderTopWidth', 'whiteSpace', 'wordBreak',
    ].forEach((p) => ((div.style as unknown as Record<string, string>)[p] = style[p as keyof CSSStyleDeclaration] as string));
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = `${el.offsetWidth}px`;
    document.body.appendChild(div);
    const span = document.createElement('span');
    span.textContent = el.value.slice(0, position);
    div.appendChild(span);
    const marker = document.createElement('span');
    marker.textContent = '|';
    div.appendChild(marker);
    const rect = marker.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    document.body.removeChild(div);
    return { top: rect.top - elRect.top + 24, left: rect.left - elRect.left };
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    onChange(val);

    const caret = e.target.selectionStart ?? 0;
    // Find the last '@' before caret on the same line
    const textBefore = val.slice(0, caret);
    const atIdx = textBefore.lastIndexOf('@');
    if (atIdx !== -1) {
      const between = textBefore.slice(atIdx + 1);
      // Only trigger if there's no space after '@' and it's a "recent" @
      if (/^[a-zA-Z0-9]*$/.test(between)) {
        setQuery(between.toLowerCase());
        setMentionStart(atIdx);
        setShowDropdown(true);
        setSelectedIdx(0);
        if (taRef.current) {
          const pos = getCaretXY(taRef.current, atIdx);
          setDropdownPos(pos);
        }
        return;
      }
    }
    setShowDropdown(false);
  }

  function insertMention(ref: ReferenceItem) {
    const before = value.slice(0, mentionStart);
    const after = value.slice(taRef.current?.selectionStart ?? mentionStart);
    const inserted = `@${ref.tag} `;
    onChange(before + inserted + after);
    setShowDropdown(false);
    // Refocus + move caret
    setTimeout(() => {
      if (taRef.current) {
        const pos = before.length + inserted.length;
        taRef.current.focus();
        taRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filtered[selectedIdx]) insertMention(filtered[selectedIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  // Parse value to highlight @mentions
  function renderHighlighted() {
    const parts: React.ReactNode[] = [];
    const tagSet = new Set(references.map((r) => r.tag));
    const regex = /@([a-zA-Z0-9]+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(value)) !== null) {
      if (m.index > last) parts.push(<span key={last}>{value.slice(last, m.index)}</span>);
      const tag = m[1].toLowerCase();
      const isValid = tagSet.has(tag);
      parts.push(
        <mark
          key={m.index}
          className={`rounded px-0.5 ${isValid ? 'bg-purple-500/40 text-purple-200' : 'bg-red-500/20 text-red-300'}`}
        >
          {m[0]}
        </mark>
      );
      last = m.index + m[0].length;
    }
    if (last < value.length) parts.push(<span key="end">{value.slice(last)}</span>);
    return parts;
  }

  return (
    <div className="relative">
      {/* Overlay for highlight rendering (pointer-events none) */}
      <div
        ref={mirrorRef}
        aria-hidden
        className="absolute inset-0 pointer-events-none px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words overflow-hidden leading-relaxed"
        style={{ color: 'transparent', zIndex: 1 }}
      >
        {renderHighlighted()}
      </div>

      <textarea
        ref={taRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`relative bg-transparent w-full resize-none text-sm font-mono leading-relaxed ${className}`}
        style={{ zIndex: 2, caretColor: 'white', color: 'white' }}
        spellCheck={false}
      />

      {/* Dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div
          className="absolute z-50 bg-gray-800 border border-purple-500/40 rounded-lg shadow-2xl overflow-hidden min-w-52 max-w-xs"
          style={{ top: dropdownPos.top, left: Math.max(0, dropdownPos.left) }}
        >
          <div className="px-3 py-1.5 text-xs text-purple-300 bg-purple-900/40 border-b border-purple-500/20 font-semibold">
            References
          </div>
          {filtered.slice(0, 8).map((r, i) => (
            <button
              key={r.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(r); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-purple-600/30 transition-colors ${i === selectedIdx ? 'bg-purple-600/30' : ''}`}
            >
              {/* Thumbnail */}
              {r.type === 'image' ? (
                <img src={r.file_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                  🎬
                </div>
              )}
              <div className="text-left min-w-0">
                <div className="text-white font-medium truncate">@{r.tag}</div>
                <div className="text-gray-400 text-xs truncate">{r.name}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 italic">No matches</div>
          )}
          <div className="px-3 py-1 text-xs text-gray-600 bg-gray-800/80 border-t border-gray-700">
            ↑↓ navigate · Enter to insert · Esc close
          </div>
        </div>
      )}
    </div>
  );
}

/** Parse @mentions from a prompt and return matching reference URLs */
export function resolveMentions(prompt: string, references: ReferenceItem[]): {
  cleanPrompt: string;
  resolvedUrls: string[];
} {
  const tagMap = new Map(references.map((r) => [r.tag, r.file_url]));
  const resolvedUrls: string[] = [];
  const regex = /@([a-zA-Z0-9]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(prompt)) !== null) {
    const tag = m[1].toLowerCase();
    const url = tagMap.get(tag);
    if (url && !resolvedUrls.includes(url)) resolvedUrls.push(url);
  }
  return { cleanPrompt: prompt, resolvedUrls };
}
