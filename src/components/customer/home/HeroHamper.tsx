import { RecentOrdersTicker, type RecentOrder } from './RecentOrdersTicker';

// Illustrated hamper whose gifts drop in one after another (pure SVG + CSS, no JS),
// with floating "card" chips and the live recent-orders ticker.
export function HeroHamper({ recentOrders }: { recentOrders: RecentOrder[] }) {
  return (
    <div className="relative h-[440px] sm:h-[520px] rounded-[40px] bg-petal overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,#fff_0,rgba(255,255,255,0)_55%)]" />
      <div className="absolute left-1/2 top-16 sm:top-24 w-[460px] h-[400px] -ml-[230px] scale-[.66] sm:scale-100 origin-top">
        <svg viewBox="0 0 420 300" width="460" height="329" className="absolute left-0 top-[70px]" aria-hidden="true">
          <path d="M48 64 L372 64 L392 140 L28 140 Z" fill="#E28AA8" stroke="#3A1230" strokeWidth="3" strokeLinejoin="round" />
          <path d="M300 64 L410 20 L418 40 L320 92 Z" fill="#F2B8C8" stroke="#3A1230" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        <svg className="hp-drop absolute left-[52px] top-[150px]" style={{ animationDelay: '0s' }} viewBox="0 0 64 64" width="104" height="104" aria-hidden="true">
          <path d="M32 58V30M24 58l6-22M40 58l-6-22" stroke="#4E7A4A" strokeWidth="2.5" fill="none" />
          <circle cx="32" cy="20" r="9" fill="#F2A7BD" stroke="#3A1230" strokeWidth="2" /><circle cx="20" cy="29" r="7" fill="#FFFFFF" stroke="#3A1230" strokeWidth="2" /><circle cx="44" cy="29" r="7" fill="#E77FA0" stroke="#3A1230" strokeWidth="2" />
        </svg>
        <svg className="hp-drop absolute left-[150px] top-[168px]" style={{ animationDelay: '.7s' }} viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">
          <rect x="18" y="24" width="28" height="32" rx="4" fill="#FFF7EC" stroke="#3A1230" strokeWidth="2.5" /><rect x="18" y="36" width="28" height="9" fill="#B83D72" opacity=".3" /><path d="M32 24v-6" stroke="#3A1230" strokeWidth="2.5" /><path d="M32 4c5 5 5 9 0 12-5-3-5-7 0-12z" fill="#E8A13A" />
        </svg>
        <svg className="hp-drop absolute left-[236px] top-[166px]" style={{ animationDelay: '1.4s' }} viewBox="0 0 64 64" width="100" height="100" aria-hidden="true">
          <path d="M14 22h30v22a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10z" fill="#FFFFFF" stroke="#3A1230" strokeWidth="2.5" /><path d="M44 28h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#3A1230" strokeWidth="2.5" /><path d="M29 33c-2-3-7-1-5 3l5 5 5-5c2-4-3-6-5-3z" fill="#B83D72" />
        </svg>
        <svg className="hp-drop absolute left-[318px] top-[172px]" style={{ animationDelay: '2.1s' }} viewBox="0 0 64 64" width="92" height="92" aria-hidden="true">
          <circle cx="32" cy="32" r="20" fill="#2B5DB8" stroke="#3A1230" strokeWidth="2.5" /><circle cx="32" cy="32" r="13" fill="#FFFFFF" /><circle cx="32" cy="32" r="8" fill="#7FB3F0" /><circle cx="32" cy="32" r="4" fill="#1B1B3A" />
        </svg>
        <svg viewBox="0 0 420 300" width="460" height="329" className="absolute left-0 top-[70px]" aria-hidden="true">
          <path d="M28 140 L392 140 L368 292 L52 292 Z" fill="#F2B8C8" stroke="#3A1230" strokeWidth="3" strokeLinejoin="round" />
          <rect x="196" y="140" width="28" height="152" fill="#B83D72" />
          <path d="M210 140c-30-34-62-10-40 6 10 7 30 0 40-6zM210 140c30-34 62-10 40 6-10 7-30 0-40-6z" fill="#B83D72" stroke="#3A1230" strokeWidth="2.5" />
          <circle cx="210" cy="141" r="8" fill="#8E2A57" stroke="#3A1230" strokeWidth="2.5" />
          <ellipse cx="300" cy="222" rx="52" ry="22" fill="#FFF7EC" stroke="#3A1230" strokeWidth="2.5" />
          <text x="300" y="230" textAnchor="middle" fontFamily="var(--font-dancing), cursive" fontSize="24" fill="#B83D72">Hamperly</text>
        </svg>
      </div>

      <div className="hp-float absolute left-5 sm:left-7 top-6 sm:top-9 bg-white rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 text-sm font-semibold text-plum shadow-[0_12px_30px_-16px_rgba(58,18,48,.45)]">
        <span className="w-7 h-7 rounded-full bg-[#E7F6EC] grid place-items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F8A4C" strokeWidth="2.6" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
        </span>
        Scented candle added
      </div>
      <div className="hp-float-slow hidden sm:block absolute right-7 top-20 bg-[#FFFDF8] rounded-md px-4 py-3.5 w-44 rotate-[4deg] shadow-[0_14px_30px_-16px_rgba(58,18,48,.45)] font-script text-xl leading-tight text-plum">
        Dear Riya, happy birthday! Love, Aarav
      </div>

      <RecentOrdersTicker orders={recentOrders} />
    </div>
  );
}
