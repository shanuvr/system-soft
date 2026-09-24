import Dock from './Dock.jsx';
import { DEV_APPS } from '../data/dockConfig.js';

export default function DevDock({ activeApp, showApps, dark, badges = {}, onSelectApp, onToggleApps }) {
  return (
    <div className="relative flex max-w-full min-w-0 items-center justify-center">
      <Dock
        apps={DEV_APPS}
        activeApp={activeApp}
        showApps={showApps}
        dark={dark}
        badges={badges}
        onSelectApp={onSelectApp}
        onToggleApps={onToggleApps}
        accentText="text-amber-500"
        dotColor="bg-amber-500"
      />
    </div>
  );
}