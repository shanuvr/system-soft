import Dock from './Dock.jsx';
import { PM_APPS } from '../data/dockConfig.js';

export default function PMDock({ activeApp, showApps, dark, onSelectApp, onToggleApps }) {
  return (
    <div className="relative flex max-w-full min-w-0 items-center justify-center">
      <Dock
        apps={PM_APPS}
        activeApp={activeApp}
        showApps={showApps}
        dark={dark}
        onSelectApp={onSelectApp}
        onToggleApps={onToggleApps}
        accentText="text-violet-500"
        dotColor="bg-violet-500"
      />
    </div>
  );
}