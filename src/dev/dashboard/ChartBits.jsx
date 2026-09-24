export function ChartCard({ title, sub, action, children, dark }) {
  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`text-sm font-bold ${heading}`}>{title}</h2>
          {sub && <p className={`mt-0.5 text-[11px] ${muted}`}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
          {it.label}
          {it.value !== undefined && <span className="font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">{it.value}</span>}
        </span>
      ))}
    </div>
  );
}

export function ChartTooltip({ active, payload, label, dark }) {
  if (!active || !payload || !payload.length) return null;
  const bg = dark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800';
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${bg}`}>
      {label !== undefined && label !== null && label !== '' && (
        <div className="mb-1 font-semibold">{label}</div>
      )}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-zinc-500">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">
            {typeof p.value === 'number' ? `${Math.round(p.value * 10) / 10}h` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}