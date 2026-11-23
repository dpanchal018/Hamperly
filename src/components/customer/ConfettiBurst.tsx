// One-time CSS confetti shower over its (relative) parent. Positions come from the index,
// not Math.random, so server and client render the same markup.
const COLORS = ['#B83D72', '#C99A3E', '#F2A7BD', '#7FB3F0', '#1E9E55', '#E8C27A'];

export function ConfettiBurst({ pieces = 48 }: { pieces?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {Array.from({ length: pieces }).map((_, i) => {
        const left = (i * 37) % 100;
        const delay = ((i * 53) % 900) / 1000;
        const duration = 1.8 + ((i * 29) % 12) / 10;
        const drift = ((i * 71) % 120) - 60;
        const size = 6 + (i % 4) * 2;
        return (
          <span
            key={i}
            className="hp-confetti absolute -top-4 block rounded-[2px]"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.6,
              background: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              ['--hp-drift' as string]: `${drift}px`,
            }}
          />
        );
      })}
    </div>
  );
}
