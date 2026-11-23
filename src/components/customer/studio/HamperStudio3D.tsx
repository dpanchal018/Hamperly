'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Gift, RotateCcw, Rotate3d } from 'lucide-react';
import { useHamperBuilder } from '@/contexts/HamperBuilderContext';
import type { CustomizationCategory } from '@/types/customization.types';
import { HamperScene, supportsWebGL, type Mood } from './hamperScene';
import { containerForOption, ribbonForOption, studioItemsFromSelection } from './productShapes';

const MOODS: { id: Mood; label: string; bg: string }[] = [
  { id: 'day', label: 'Day', bg: '#F6D9E1' },
  { id: 'golden', label: 'Golden hour', bg: '#F5D3B5' },
  { id: 'diwali', label: 'Diwali night', bg: '#24102F' },
];

function selectedOptionName(categories: CustomizationCategory[], selected: Record<string, string[]>, match: (c: CustomizationCategory) => boolean) {
  const cat = categories.find(match);
  const optId = cat ? selected[cat.id]?.[0] : undefined;
  return cat?.options?.find(o => o.id === optId)?.name ?? null;
}

/**
 * Live 3D preview of the hamper being built: the chosen box or basket on a turntable,
 * every selected product dropping in, drag-to-spin 360°, lighting moods and a wrap animation.
 */
export default function HamperStudio3D({ customizationCategories }: { customizationCategories: CustomizationCategory[] }) {
  const { selectedProducts, selectedCustomizations, recipient, occasion } = useHamperBuilder();
  const sceneRef = useRef<HamperScene | null>(null);
  const [failed, setFailed] = useState(() => !supportsWebGL());
  const [mood, setMood] = useState<Mood>('day');
  // The hamper counts as wrapped only for the gift set it was wrapped with
  const [wrappedKey, setWrappedKey] = useState<string | null>(null);
  const [hintSeen, setHintSeen] = useState(false);

  const boxName = selectedOptionName(customizationCategories, selectedCustomizations, c => c.id === 'cat-packaging' || /packag|box/i.test(c.name));
  const ribbonName = selectedOptionName(customizationCategories, selectedCustomizations, c => c.id === 'cat-ribbon' || /ribbon/i.test(c.name));
  const container = containerForOption(boxName);
  const ribbon = ribbonForOption(ribbonName, container);
  const selectionKey = selectedProducts.map(s => `${s.product.id}x${s.quantity}`).join(',');
  // Recompute only when the set of gifts changes, not on every builder re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { items, hidden } = useMemo(() => studioItemsFromSelection(selectedProducts), [selectionKey]);
  const itemsKey = items.map(i => i.key).join('|');
  const wrapped = wrappedKey !== null && wrappedKey === itemsKey;

  // Latest studio state, so a re-created scene (canvas remount) starts from the current hamper
  const latest = useRef({ container, ribbon, items, mood, wrapped, recipient });
  useEffect(() => { latest.current = { container, ribbon, items, mood, wrapped, recipient }; });

  // Create the scene when the canvas mounts; dispose it when the canvas goes away
  const attachCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    try {
      const scene = new HamperScene(canvas, { onFirstDrag: () => setHintSeen(true) });
      const s = latest.current;
      scene.setContainer(s.container, s.ribbon);
      scene.setItems(s.items);
      scene.setMood(s.mood);
      scene.setTagName(s.recipient || '');
      if (s.wrapped) scene.setWrapped(true);
      sceneRef.current = scene;
    } catch (err) {
      console.error('Hamper studio 3D failed to start', err);
      setFailed(true);
      return;
    }
    return () => { sceneRef.current?.dispose(); sceneRef.current = null; };
  }, []);

  useEffect(() => { sceneRef.current?.setContainer(container, ribbon); }, [container, ribbon]);
  useEffect(() => { sceneRef.current?.setItems(items); }, [items]);
  useEffect(() => { sceneRef.current?.setMood(mood); }, [mood]);
  useEffect(() => { sceneRef.current?.setWrapped(wrapped); }, [wrapped]);
  useEffect(() => {
    const draw = () => sceneRef.current?.setTagName(recipient || '');
    draw();
    // Redraw once web fonts are ready so the tag uses the handwriting font
    document.fonts?.ready.then(draw);
  }, [recipient]);

  const stageBg = MOODS.find(m => m.id === mood)!.bg;

  if (failed) {
    return (
      <div className="h-full rounded-[32px] bg-petal p-8 flex flex-col items-center justify-center text-center gap-3 text-plum">
        <Gift className="w-12 h-12 text-rose" />
        <p className="font-semibold">Your hamper preview</p>
        <p className="text-sm text-ink-muted max-w-xs">This device can&apos;t show the 3D view, but everything you pick is saved to your hamper.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-[32px] overflow-hidden transition-colors duration-700" style={{ background: stageBg }}>
      <canvas
        ref={attachCanvas}
        role="img"
        aria-label={`3D preview of your hamper with ${items.length + hidden} item${items.length + hidden === 1 ? '' : 's'}. Drag to spin it 360 degrees.`}
        className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      <div className="absolute left-4 right-4 top-4 flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-center gap-2 bg-white rounded-full px-3.5 py-2 text-sm font-bold text-plum pointer-events-none min-w-0 max-w-full">
        <span className="w-2 h-2 rounded-full bg-rose shrink-0" />
        <span className="truncate">{occasion?.name ?? 'Your hamper'}{boxName ? ` · ${boxName}` : ''}</span>
      </div>

      <div role="group" aria-label="Lighting mood" className="flex gap-1 bg-white/90 rounded-full p-1">
        {MOODS.map(m => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mood === m.id}
            onClick={() => setMood(m.id)}
            className={`h-9 px-3 rounded-full text-xs font-bold transition-colors ${mood === m.id ? 'bg-plum text-white' : 'text-plum hover:bg-petal'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      </div>

      {items.length === 0 && (
        <p className={`absolute inset-x-6 top-[30%] text-center font-semibold pointer-events-none ${mood === 'diwali' ? 'text-white' : 'text-plum'}`}>
          Your box is empty. Add gifts and watch them drop in.
        </p>
      )}

      {hidden > 0 && (
        <span className="absolute left-4 top-[7.5rem] bg-plum text-white rounded-full px-3 py-1.5 text-xs font-bold pointer-events-none">
          +{hidden} more inside
        </span>
      )}

      {!hintSeen && items.length > 0 && (
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-[72px] items-center gap-2 bg-plum text-white rounded-full px-4 py-2 text-sm font-semibold pointer-events-none whitespace-nowrap">
          <Rotate3d className="w-4 h-4 text-[#F2A7BD]" /> Drag to spin 360°
        </div>
      )}

      <div className="absolute inset-x-4 bottom-4 flex justify-start gap-2">
        <button type="button" onClick={() => sceneRef.current?.topView()} aria-label="Peek inside" className="h-11 px-3.5 rounded-full bg-white/85 hover:bg-white text-plum text-sm font-bold flex items-center gap-1.5">
          <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Peek inside</span>
        </button>
        <button type="button" onClick={() => sceneRef.current?.resetView()} className="h-11 px-3.5 rounded-full bg-white/85 hover:bg-white text-plum text-sm font-bold flex items-center gap-1.5" aria-label="Reset view">
          <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          type="button"
          disabled={items.length === 0}
          aria-pressed={wrapped}
          onClick={() => setWrappedKey(wrapped ? null : itemsKey)}
          className="h-11 px-4 rounded-full bg-rose hover:bg-rose-deep disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1.5"
        >
          <Gift className="w-4 h-4" /> {wrapped ? 'Unwrap' : 'Wrap it'}
        </button>
      </div>
    </div>
  );
}
