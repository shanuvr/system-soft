import Dock from './Dock.jsx';
import { DEV_APPS } from '../data/dockConfig.js';

export default function DevDock({ activeApp, showApps, dark, onSelectApp, onToggleApps }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-zinc-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 ring-1 ring-zinc-800 sm:block">
        Developer
      </span>
      <Dock
        apps={DEV_APPS}
        activeApp={activeApp}
        showApps={showApps}
        dark={dark}
        onSelectApp={onSelectApp}
        onToggleApps={onToggleApps}
        accentText="text-amber-500"
        dotColor="bg-amber-500"
      />
    </div>
  );
}