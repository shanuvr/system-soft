import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useApp } from '../data/context.js';
import { PTD_STATUS_LABELS } from './ptdMeta.js';
import { PtdStatusBadge } from './badges.jsx';

const inputCls = (dark) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 ${
    dark
      ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500'
      : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400'
  }`;

export default function PTDList({ dark, onOpen }) {
  const { db } = useApp();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const projectsById = Object.fromEntries(db.projects.map((p) => [p.id, p]));
  const statusOptions = ['all', ...Array.from(new Set(db.ptds.map((p) => p.status)))];

  const filtered = db.ptds.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesQuery && matchesFilter;
  });

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const rowHover = dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50';

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className={`text-2xl font-bold ${heading}`}>PTDs</h1>
        <p className={`mt-1 text-xs ${muted}`}>
          Incoming technical data from the accounts system — split each PTD into work orders.
        </p>
      </div>

      {/* Search + status filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PTDs by name or reference..."
            className={`pl-9 ${inputCls(dark)}`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                filter === s
                  ? 'bg-violet-500 text-white'
                  : dark
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
              }`}
            >
              {s === 'all' ? 'All' : PTD_STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* PTD table */}
      <div className={`overflow-x-auto rounded-2xl border ${panel}`}>
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className={`border-b text-xs uppercase tracking-wide ${muted}`}>
              <th className="px-4 py-3 font-medium">PTD</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => onOpen(p.id)}
                className={`cursor-pointer border-b last:border-0 transition-colors ${rowHover}`}
              >
                <td className="px-4 py-3">
                  <div className={`font-semibold ${heading}`}>
                    <span className="text-violet-500">{p.ref}</span> · {p.name}
                  </div>
                  <div className={`mt-0.5 max-w-[320px] truncate text-xs ${muted}`}>
                    {p.description || '—'}
                  </div>
                </td>
                <td className={`px-4 py-3 ${muted}`}>
                  {p.projectId ? projectsById[p.projectId]?.name || '—' : 'Unassigned'}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <div className={muted}>
                    alloc <span className={heading}>{p.allocatedHours}h</span>
                  </div>
                  <div className={muted}>
                    est {p.estimatedHours}h · used {p.usedHours}h
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-16 overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                      />
                    </div>
                    <span className={`text-xs tabular-nums ${muted}`}>{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PtdStatusBadge status={p.status} />
                </td>
                <td className={`px-4 py-3 text-xs tabular-nums ${muted}`}>{p.deadline || '—'}</td>
                <td className="px-2 py-3 text-zinc-500">
                  <ChevronRight className="h-4 w-4" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={`px-4 py-10 text-center text-sm ${muted}`}>
                  No PTDs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}