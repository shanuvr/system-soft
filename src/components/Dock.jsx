import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

function DockItem({ label, active, activeColor, idleColor, dotColor, onClick, dark, badge = 0, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      data-active={active ? 'true' : undefined}
      className="group relative flex w-10 shrink-0 flex-col items-center rounded-xl py-1 cursor-pointer outline-none sm:w-11 transition-transform active:scale-95"
      aria-label={label}
    >
      {/* Floating Hover Tooltip Label */}
      <span
        className={`pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xl transition-all duration-150 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 ${
          dark
            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-black/60'
            : 'bg-zinc-900 text-white shadow-zinc-600/30'
        }`}
      >
        {label}
        <span
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 ${
            dark ? 'bg-zinc-800 border-b border-r border-zinc-700' : 'bg-zinc-900'
          }`}
        />
      </span>

      {badge > 0 && (
        <span className="absolute -right-1 -top-1 z-50 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-md">
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      <span
        className={`flex items-center justify-center transition-all duration-150 group-hover:scale-110 ${
          active ? activeColor : idleColor
        }`}
      >
        {children}
      </span>
      <span
        className={`mt-1 h-1 w-1 rounded-full transition-all duration-200 ${
          active ? `${dotColor} scale-100` : 'bg-transparent scale-0'
        }`}
      />
    </button>
  );
}

export default function Dock({
  apps,
  activeApp,
  showApps,
  dark,
  badges = {},
  onSelectApp,
  onToggleApps,
  accentText = 'text-violet-500',
  dotColor = 'bg-violet-500',
}) {
  const idleColor = dark ? 'text-zinc-200 hover:text-violet-300' : 'text-zinc-600 hover:text-violet-600';
  const ref = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const [glowOn, setGlowOn] = useState(false);

  // Occasionally fire a glow burst that sweeps around the dock.
  useEffect(() => {
    let mounted = true;
    let timeout;
    const schedule = (delay) => {
      timeout = setTimeout(() => {
        if (!mounted) return;
        setGlowOn(true);
        timeout = setTimeout(() => {
          if (!mounted) return;
          setGlowOn(false);
          schedule(14000 + Math.random() * 12000);
        }, 2000);
      }, delay);
    };
    schedule(6000 + Math.random() * 7000);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const updateEdge = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      left: el.scrollLeft > 6,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 6,
    });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateEdge();
    el.addEventListener('scroll', updateEdge, { passive: true });
    window.addEventListener('resize', updateEdge);
    return () => {
      el.removeEventListener('scroll', updateEdge);
      window.removeEventListener('resize', updateEdge);
    };
  }, [apps]);

  // Center active tab into view when activeApp changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeApp]);

  const scrollBy = (dir) => {
    ref.current?.scrollBy({ left: dir * 140, behavior: 'smooth' });
  };

  const handleWheel = (e) => {
    if (ref.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      ref.current.scrollLeft += e.deltaY;
    }
  };

  const fade = dark
    ? ['from-zinc-950 via-zinc-950/80 to-transparent', 'to-zinc-950 via-zinc-950/80 from-transparent']
    : ['from-white via-white/80 to-transparent', 'to-white via-white/80 from-transparent'];

  return (
    <div className="relative flex max-w-[calc(100vw-1rem)] sm:max-w-full min-w-0 items-center justify-center pt-1 pb-1 overflow-visible">
      {/* Random energy glow around the dock */}
      {glowOn && <span aria-hidden className="dock-glow" />}
      {/* Scroll Left Button & Gradient (Mobile only) */}
      {edge.left && (
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll dock left"
          className={`pointer-events-auto absolute left-0.5 z-20 flex sm:hidden h-9 w-7 items-center justify-center rounded-l-xl cursor-pointer transition-colors ${
            dark ? 'text-zinc-200 hover:bg-zinc-800/80' : 'text-zinc-700 hover:bg-zinc-200/80'
          }`}
        >
          <span className={`pointer-events-none absolute inset-y-0 -left-1 w-9 rounded-l-2xl bg-gradient-to-r ${fade[0]}`} />
          <ChevronLeft className="relative z-10 h-4 w-4" />
        </button>
      )}

      {/* Scroll Right Button & Gradient (Mobile only) */}
      {edge.right && (
        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll dock right"
          className={`pointer-events-auto absolute right-0.5 z-20 flex sm:hidden h-9 w-7 items-center justify-center rounded-r-xl cursor-pointer transition-colors ${
            dark ? 'text-zinc-200 hover:bg-zinc-800/80' : 'text-zinc-700 hover:bg-zinc-200/80'
          }`}
        >
          <span className={`pointer-events-none absolute inset-y-0 -right-1 w-9 rounded-r-2xl bg-gradient-to-l ${fade[1]}`} />
          <ChevronRight className="relative z-10 h-4 w-4" />
        </button>
      )}

      <nav
        ref={ref}
        onWheel={handleWheel}
        className={`relative flex max-w-full min-w-0 sm:w-max sm:max-w-max items-end gap-1 overflow-x-auto sm:overflow-visible scrollbar-hide rounded-2xl border px-2.5 pb-1 pt-2 backdrop-blur-md transition-all touch-pan-x select-none ${
          dark
            ? 'border-zinc-800 bg-zinc-950/85 shadow-lg shadow-black/40'
            : 'border-zinc-200 bg-white/85 shadow-lg shadow-zinc-400/20'
        }`}
      >
        <DockItem
          label="Show Applications"
          active={showApps}
          activeColor={accentText}
          idleColor={idleColor}
          dotColor={dotColor}
          onClick={onToggleApps}
          dark={dark}
        >
          <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
        </DockItem>
        <div className={`mx-1 my-1 w-px shrink-0 self-stretch ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {apps.map((app) => (
          <DockItem
            key={app.id}
            label={app.name}
            active={activeApp === app.id}
            activeColor={accentText}
            idleColor={idleColor}
            dotColor={dotColor}
            badge={badges?.[app.id] || 0}
            onClick={() => onSelectApp(app.id)}
            dark={dark}
          >
            <app.icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </DockItem>
        ))}
      </nav>
    </div>
  );
}