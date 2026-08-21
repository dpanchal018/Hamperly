import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

export function Logo({ className = '', withTagline = false }: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
        <span 
          className="font-script text-5xl md:text-6xl tracking-wide select-none"
          style={{
            backgroundImage: 'linear-gradient(to right, var(--brand-rose), var(--brand-peach), var(--brand-lavender))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: '1.2'
          }}
        >
          Hamperly
        </span>
      </Link>
      
      {withTagline && (
        <span 
          className="mt-1 text-[10px] md:text-xs uppercase font-sans font-bold tracking-[0.2em] select-none"
          style={{ color: 'var(--foreground)' }}
        >
          Curated With Love
        </span>
      )}
    </div>
  );
}
