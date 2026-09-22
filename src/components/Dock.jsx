import { LayoutGrid } from 'lucide-react';

function DockItem({ label, active, activeColor, idleColor, dotColor, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-12 flex-col items-center rounded-xl py-1 cursor-pointer outline-none"
      aria-label={label}
    >
      <span
        className={`absolute -top-7 rounded-md px-2 py-0.5 text-[11px] whitespace-nowrap bg-zinc-900 text-zinc-200 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 pointer-events-none`}
      >
        {label}
      </span>
      <span
        className={`flex items-center justify-center transition-all duration-150 group-hover:scale-110 group-active:scale-95 ${
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
  onSelectApp,
  onToggleApps,
  accentText = 'text-violet-500',
  dotColor = 'bg-violet-500',
}) {
  const idleColor = dark ? 'text-zinc-200 hover:text-violet-300' : 'text-zinc-600 hover:text-violet-600';
  return (
    <nav
      className={`flex items-end gap-1 rounded-2xl border px-2 pb-1 pt-2 backdrop-blur-md transition-colors ${
        dark
          ? 'border-zinc-800 bg-zinc-950/80 shadow-lg shadow-black/40'
          : 'border-zinc-200 bg-white/80 shadow-lg shadow-zinc-400/20'
      }`}
    >
      <DockItem
        label="Show Applications"
        active={showApps}
        activeColor={accentText}
        idleColor={idleColor}
        dotColor={dotColor}
        onClick={onToggleApps}
      >
        <LayoutGrid className="h-6 w-6" />
      </DockItem>
      <div className={`mx-1 my-1 w-px self-stretch ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

      {apps.map((app) => (
        <DockItem
          key={app.id}
          label={app.name}
          active={activeApp === app.id}
          activeColor={accentText}
          idleColor={idleColor}
          dotColor={dotColor}
          onClick={() => onSelectApp(app.id)}
        >
          <app.icon className="h-6 w-6" />
        </DockItem>
      ))}
    </nav>
  );
}