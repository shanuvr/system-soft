import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ListTodo,
  Search,
  Timer,
  X,
} from 'lucide-react';
import { useApp } from '../../data/context.js';
import { PriorityBadge, WoStatusBadge } from './badges.jsx';
import DevWorkOrderDetail from './DevWorkOrderDetail.jsx';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'submitted-review', label: 'In Review' },
  { id: 'changes-requested', label: 'Changes Requested' },
  { id: 'not-started', label: 'Not Started' },
  { id: 'completed', label: 'Done' },
];

const SORT_OPTIONS = [
  { id: 'due', label: 'Due date' },
  { id: 'priority', label: 'Priority' },
  { id: 'progress', label: 'Progress' },
  { id: 'hours', label: 'Est. hours' },
];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const DONE_STATUSES = new Set(['completed', 'done']);

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);
}

function isDone(wo) {
  return DONE_STATUSES.has(wo.status);
}

function isOverdue(wo) {
  return !isDone(wo) && daysUntil(wo.dueDate) !== null && daysUntil(wo.dueDate) < 0;
}

function accentShadow(wo) {
  if (isOverdue(wo)) return 'inset 4px 0 0 0 #ef4444';
  if (isDone(wo)) return 'inset 4px 0 0 0 #10b981';
  switch (wo.status) {
    case 'in-progress':
      return 'inset 4px 0 0 0 #f59e0b';
    case 'submitted-review':
      return 'inset 4px 0 0 0 #a78bfa';
    case 'changes-requested':
      return 'inset 4px 0 0 0 #fb923c';
    default:
      return 'inset 4px 0 0 0 #71717a';
  }
}

function barColor(p) {
  return p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-violet-500' : 'bg-amber-500';
}

export default function DevWorkOrders({ dark }) {
  const { db, currentUser } = useApp();
  const meId = currentUser?.id;

  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due');

  const projectsById = useMemo(
    () => Object.fromEntries((db.projects || []).map((p) => [p.id, p])),
    [db.projects],
  );

  const myWorkOrders = useMemo(
    () => (db.workOrders || []).filter((w) => w.assignee === meId),
    [db.workOrders, meId],
  );

  const stats = useMemo(
    () => ({
      total: myWorkOrders.length,
      inProgress: myWorkOrders.filter((w) => w.status === 'in-progress').length,
      inReview: myWorkOrders.filter((w) => w.status === 'submitted-review').length,
      done: myWorkOrders.filter(isDone).length,
      overdue: myWorkOrders.filter(isOverdue).length,
      hours: myWorkOrders.reduce((s, w) => s + (w.actualHours || 0), 0),
      est: myWorkOrders.reduce((s, w) => s + (w.estimatedHours || 0), 0),
    }),
    [myWorkOrders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = myWorkOrders.filter((w) => {
      const project = projectsById[w.projectId];
      const matchesQuery =
        !q ||
        w.title?.toLowerCase().includes(q) ||
        w.id?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        project?.name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    list.sort((a, b) => {
      if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'hours') return (b.estimatedHours || 0) - (a.estimatedHours || 0);
      return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
    });
    return list;
  }, [myWorkOrders, query, statusFilter, sortBy, projectsById]);

  const openWo = openId ? myWorkOrders.find((w) => w.id === openId) : null;

  useEffect(() => {
    if (openWo) {
      const main = document.querySelector('main');
      main?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  }, [openWo]);

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const cardBorder = dark ? 'border-zinc-800' : 'border-zinc-200';
  const heading = dark ? 'text-zinc-100' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';
  const barTrack = dark ? 'bg-zinc-800' : 'bg-zinc-200';
  const inputBg = dark
    ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-violet-500'
    : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:border-violet-500';

  if (openWo) {
    return (
      <DevWorkOrderDetail
        wo={openWo}
        project={projectsById[openWo.projectId]}
        currentUser={currentUser}
        dark={dark}
        onBack={() => setOpenId(null)}
      />
    );
  }

  const kpis = [
    { label: 'Assigned', value: stats.total, icon: ListTodo, accent: 'text-violet-500', sub: `${stats.done} done` },
    { label: 'Active', value: stats.inProgress, icon: Timer, accent: 'text-amber-500', sub: 'in progress' },
    { label: 'In Review', value: stats.inReview, icon: ClipboardCheck, accent: 'text-sky-500', sub: 'awaiting PM' },
    { label: 'Hours', value: `${stats.hours}h`, icon: Clock, accent: 'text-emerald-500', sub: `of ${stats.est}h est` },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-6 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>My Work Orders</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Tasks assigned to you by the project manager. Log your hours and update progress at the end of each day.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {stats.overdue > 0 && (
            <span className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-[11px] font-bold text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {stats.overdue} overdue
            </span>
          )}
          <span
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tabular-nums ${
              dark ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-700'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {stats.done}/{stats.total} completed
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className={`min-w-0 rounded-2xl border p-2 sm:p-3 ${panel}`}>
            <div className="flex items-center justify-between gap-1">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${cardBorder}`}>
                <k.icon className={`h-3 w-3 ${k.accent}`} />
              </span>
              <span className={`text-sm font-bold tabular-nums leading-none sm:text-xl ${heading}`}>{k.value}</span>
            </div>
            <div className={`mt-1 truncate text-[10px] font-bold uppercase ${muted}`}>{k.label}</div>
            <div className={`mt-0.5 hidden truncate text-[10px] sm:block ${muted}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, ID, project..."
            className={`w-full rounded-xl border py-2 pl-9 pr-8 text-xs outline-none transition-all ${inputBg}`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => {
              const count = s.id === 'all' ? stats.total : myWorkOrders.filter((w) => w.status === s.id).length;
              const active = statusFilter === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white'
                      : dark
                      ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      : 'bg-zinc-200/80 text-zinc-600 hover:bg-zinc-300'
                  }`}
                >
                  {s.label}
                  <span className={`tabular-nums text-[10px] ${active ? 'text-white/70' : 'opacity-60'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`rounded-xl border px-3 py-2 text-xs outline-none cursor-pointer ${inputBg}`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                Sort: {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Work order list */}
      <div className="mt-4 space-y-2.5">
        {filtered.length === 0 && (
          <div className={`rounded-2xl border py-16 text-center ${panel}`}>
            {myWorkOrders.length === 0 ? (
              <>
                <ListTodo className={`mx-auto h-10 w-10 ${muted}`} />
                <p className={`mt-3 text-sm font-semibold ${heading}`}>No work orders assigned to you yet</p>
                <p className={`mt-1 text-xs ${muted}`}>Tasks from your project manager will show up here.</p>
              </>
            ) : (
              <>
                <Search className={`mx-auto h-10 w-10 ${muted}`} />
                <p className={`mt-3 text-sm font-semibold ${heading}`}>No work orders match your filters</p>
                <p className={`mt-1 text-xs ${muted}`}>Try a different search term or status.</p>
              </>
            )}
          </div>
        )}

        {filtered.map((w) => {
          const project = projectsById[w.projectId];
          const overdue = isOverdue(w);
          const left = daysUntil(w.dueDate);
          const progress = Math.min(100, Math.max(0, w.progress ?? 0));

          return (
            <button
              key={w.id}
              onClick={() => setOpenId(w.id)}
              style={{ boxShadow: accentShadow(w) }}
              className={`group w-full rounded-2xl border p-3.5 text-left transition-all cursor-pointer sm:p-4 ${panel} hover:border-violet-500/40`}
            >
              <div className="min-w-0">
                {/* Top row */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-mono text-[11px] font-bold text-violet-500 uppercase">{w.id}</span>
                  <WoStatusBadge status={w.status} />
                  <PriorityBadge priority={w.priority} />
                  {overdue && (
                    <span className="flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </span>
                  )}
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
                </div>

                {/* Title + meta */}
                <div className="mt-1.5">
                  <div className={`truncate text-sm font-bold leading-snug ${heading}`}>{w.title}</div>
                  <div className={`mt-0.5 flex items-center gap-1.5 text-xs ${muted}`}>
                    <span className="shrink-0 font-medium">{project?.name || 'Unassigned project'}</span>
                    {w.description && (
                      <>
                        <span className={`shrink-0 ${dark ? 'text-zinc-700' : 'text-zinc-300'}`}>·</span>
                        <span className="min-w-0 truncate">{w.description}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress + hours + due */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex min-w-[160px] flex-1 items-center gap-2">
                    <div className={`h-2 flex-1 overflow-hidden rounded-full ${barTrack}`}>
                      <div
                        className={`h-full rounded-full transition-all ${barColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-violet-500">{progress}%</span>
                  </div>

                  <span className="text-[11px] tabular-nums">
                    <span className="font-semibold text-violet-400">{w.actualHours || 0}h</span>
                    <span className={muted}> / {w.estimatedHours || 0}h est</span>
                  </span>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] tabular-nums ${
                      overdue
                        ? 'bg-red-500/15 font-semibold text-red-400'
                        : left !== null && left <= 2
                        ? 'bg-amber-500/10 font-semibold text-amber-400'
                        : muted
                    }`}
                  >
                    {w.dueDate
                      ? overdue
                        ? `Due ${w.dueDate} · overdue`
                        : left !== null
                        ? `Due ${w.dueDate} · ${left}d`
                        : `Due ${w.dueDate}`
                      : 'No deadline'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}