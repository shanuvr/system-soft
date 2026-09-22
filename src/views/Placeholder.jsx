export default function Placeholder({ title, icon: Icon, dark }) {
  const muted = dark ? 'text-zinc-500' : 'text-zinc-400';
  return (
    <div className={`flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 ${muted}`}>
      <Icon className="h-14 w-14 text-violet-500/80" />
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-xs">This module is coming soon in a later build.</div>
    </div>
  );
}