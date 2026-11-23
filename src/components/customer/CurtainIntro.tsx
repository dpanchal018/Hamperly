'use client';

import { useEffect, useState } from 'react';

// Backstops only: the intro normally ends when its own fade-out animation finishes,
// so slow devices still see the whole sequence
const TOTAL_MS = 6000;
const SKIP_MS = 1600;

/**
 * Welcome curtain on every page load: velvet curtains cover the page while the Hamperly logo
 * writes itself in, then they draw apart to reveal the site. Server-rendered, so the site
 * never flashes before it.
 */
export function CurtainIntro({ logoText = 'Hamperly' }: { logoText?: string }) {
  const [phase, setPhase] = useState<'playing' | 'skipping' | 'done'>('playing');

  useEffect(() => {
    document.documentElement.classList.add('hp-intro-lock');
    // Open on the hero (unless a link asked for a specific section)
    if (!new URLSearchParams(window.location.search).has('section')) window.scrollTo(0, 0);
    const timer = setTimeout(() => setPhase('done'), TOTAL_MS);
    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('hp-intro-lock');
    };
  }, []);

  useEffect(() => {
    if (phase === 'done') document.documentElement.classList.remove('hp-intro-lock');
    if (phase !== 'skipping') return;
    const timer = setTimeout(() => setPhase('done'), SKIP_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className={`hp-curtain ${phase === 'skipping' ? 'hp-curtain-skip' : ''}`}
      onAnimationEnd={e => {
        if (e.target === e.currentTarget && e.animationName === 'hp-curtain-fade') setPhase('done');
      }}
    >
      <div className="hp-curtain-panel hp-curtain-left" aria-hidden="true" />
      <div className="hp-curtain-panel hp-curtain-right" aria-hidden="true" />
      <div className="hp-curtain-valance" aria-hidden="true" />

      <div className="hp-curtain-logo" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="hp-curtain-bow" aria-hidden="true">
          <path d="M32 30c-10-14-26-6-16 2 6 4 12 1 16-2zM32 30c10-14 26-6 16 2-6 4-12 1-16-2z" fill="#F2A7BD" stroke="#C99A3E" strokeWidth="2" />
          <circle cx="32" cy="31" r="4" fill="#C99A3E" />
          <path d="M30 34l-6 14M34 34l6 14" stroke="#C99A3E" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="hp-curtain-word font-script">{logoText}</span>
        <svg viewBox="0 0 300 24" className="hp-curtain-flourish" aria-hidden="true">
          <path d="M6 14 C 70 2, 120 22, 150 12 S 240 4, 294 14" fill="none" stroke="#C99A3E" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="hp-curtain-tagline">CURATED WITH LOVE</span>
      </div>

      {phase === 'playing' && (
        <button type="button" onClick={() => setPhase('skipping')} className="hp-curtain-skipbtn">
          Skip intro
        </button>
      )}
    </div>
  );
}
