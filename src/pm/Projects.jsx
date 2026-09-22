import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Play,
  Search,
  Users,
} from 'lucide-react';
import { useApp } from '../data/context.js';
import { PtdStatusBadge, PriorityBadge } from './badges.jsx';

const inputCls = (dark) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 ${
    dark
      ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500'
      : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400'
  }`;

const PROJECT_STATUS_LABELS = {
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
  'not-started': 'Not Started',
};

const PROJECT_STATUS_STYLES = {
  active: 'bg-violet-500/15 text-violet-400',
  'on-hold': 'bg-orange-500/15 text-orange-400',
  completed: 'bg-violet-500/15 text-violet-300',
  'not-started': 'bg-zinc-500/15 text-zinc-400',
};

const HEALTH_STYLES = {
  'on-track': 'bg-violet-500/15 text-violet-400',
  'at-risk': 'bg-amber-500/15 text-amber-400',
  overdue: 'bg-red-500/15 text-red-400',
};

const HEALTH_LABELS = { 'on-track': 'On Track', 'at-risk': 'At Risk', overdue: 'Overdue' };

const HEALTH_COLORS = { 'on-track': '#8b5cf6', 'at-risk': '#f59e0b', overdue: '#ef4444' };
const HEALTH_ACCENT = { 'on-track': 'bg-violet-500', 'at-risk': 'bg-amber-500', overdue: 'bg-red-500' };

function StatusChip({ status }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        PROJECT_STATUS_STYLES[status] || 'bg-zinc-500/15 text-zinc-400'
      }`}
    >
      {PROJECT_STATUS_LABELS[status] || status}
    </span>
  );
}

function HealthBadge({ health }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        HEALTH_STYLES[health] || HEALTH_STYLES['on-track']
      }`}
    >
      {HEALTH_LABELS[health] || health}
    </span>
  );
}

function ProgressRing({ value, color, dark, size = 56 }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        className={dark ? 'stroke-zinc-800' : 'stroke-zinc-200'}
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        style={{ transition: 'stroke-dashoffset 400ms ease' }}
      />
    </svg>
  );
}

function projectHealth(proj, progress) {
  if (proj.status === 'completed') return 'on-track';
  if (!proj.dueDate) return 'on-track';
  const today = new Date().toISOString().slice(0, 10);
  if (proj.dueDate < today && progress < 100) return 'overdue';
  const daysUntil = Math.max(0, Math.ceil((new Date(proj.dueDate) - new Date(today)) / 86400000));
  if (daysUntil <= 10 && progress < 80) return 'at-risk';
  return 'on-track';
}

function projectProgress(proj, ptds) {
  const pts = ptds.filter((t) => t.projectId === proj.id);
  if (!pts.length) return 0;
  const totalHours = pts.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  if (totalHours > 0) {
    return Math.round(
      pts.reduce((s, t) => s + (t.progress || 0) * (t.estimatedHours || 0), 0) / totalHours,
    );
  }
  return Math.round(pts.reduce((s, t) => s + (t.progress || 0), 0) / pts.length);
}

function daysLeft(proj) {
  if (!proj.dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.ceil((new Date(proj.dueDate) - new Date(today)) / 86400000);
  return days;
}

export default function Projects({ dark }) {
  const { db } = useApp();
  const [selectedProject, setSelectedProject] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const panel = dark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-200 bg-white/90';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';

  const usersById = Object.fromEntries(db.users.map((u) => [u.id, u]));
  const initials = (name) =>
    name
      .split(' ')
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const projects = db.projects.map((p) => {
    const progress = projectProgress(p, db.ptds);
    const pts = db.ptds.filter((t) => t.projectId === p.id);
    return {
      ...p,
      progress,
      health: projectHealth(p, progress),
      ptds: pts,
      workOrders: db.workOrders.filter((w) => w.projectId === p.id),
      teamMembers: (p.team || []).map((id) => usersById[id]).filter(Boolean),
      estHours: pts.reduce((s, t) => s + (t.estimatedHours || 0), 0),
      allocatedHours: pts.reduce((s, t) => s + (t.allocatedHours || 0), 0),
      usedHours: pts.reduce((s, t) => s + (t.usedHours || 0), 0),
    };
  });

  const filtered = projects.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
    const matchesStatus = filter === 'all' || p.status === filter;
    return matchesQuery && matchesStatus;
  });

  const statusOptions = ['all', ...Array.from(new Set(db.projects.map((p) => p.status)))];

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    atRisk: projects.filter((p) => p.health === 'at-risk' || p.health === 'overdue').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  const avgProgress = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;
  const totalEst = projects.reduce((s, p) => s + p.estHours, 0);

  const attention = projects
    .filter((p) => p.health === 'overdue' || p.health === 'at-risk')
    .sort((a) => (a.health === 'overdue' ? -1 : 1));

  const selected = selectedProject ? projects.find((p) => p.id === selectedProject) : null;

  const memberStack = (members, dark, extraClass = '') => (
    <div className={`relative ${extraClass}`}>
      <div className="group flex items-center">
        {members.length > 0 ? (
          <div className="flex -space-x-1.5">
            {members.slice(0, 4).map((m) => (
              <span
                key={m.id}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ring-2 ${
                  dark
                    ? 'bg-zinc-800 text-zinc-300 ring-zinc-900'
                    : 'bg-zinc-200 text-zinc-700 ring-white'
                }`}
              >
                {initials(m.name)}
              </span>
            ))}
          </div>
        ) : (
          <Users className="h-3.5 w-3.5 text-zinc-500" />
        )}
        <span className={`ml-1.5 text-[11px] ${muted}`}>
          {members.length === 1
            ? members[0].name
            : members.length > 1
              ? `${members.length} members`
              : 'Unassigned'}
        </span>
      </div>

      {members.length > 0 && (
        <div
          className={`pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-56 origin-bottom-left rounded-xl border p-1.5 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 ${
            dark
              ? 'border-zinc-700 bg-zinc-900 shadow-black/50'
              : 'border-zinc-200 bg-white shadow-zinc-400/30'
          }`}
        >
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-100'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  dark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {initials(m.name)}
              </span>
              <div className="min-w-0">
                <div className={`truncate text-xs font-medium ${heading}`}>{m.name}</div>
                <div className={`truncate text-[10px] ${muted}`}>{m.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (selected) {
    const left = daysLeft(selected);
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <button
          onClick={() => setSelectedProject(null)}
          className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>

        <div className={`rounded-2xl border p-6 ${panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-lg font-bold text-white shadow-md shadow-violet-500/30">
                {selected.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className={`text-xl font-bold ${heading}`}>{selected.name}</h1>
                <div className={`mt-0.5 text-xs ${muted}`}>
                  {selected.client} · {usersById[selected.pm]?.name || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={selected.priority} />
              <StatusChip status={selected.status} />
              <HealthBadge health={selected.health} />
            </div>
          </div>

          {selected.description && (
            <p className={`mt-4 max-w-3xl text-sm leading-relaxed ${muted}`}>
              {selected.description}
            </p>
          )}

          <div className="mt-5">
            <div className={`mb-2 text-xs font-semibold ${heading}`}>Assignees</div>
            {selected.teamMembers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.teamMembers.map((m) => (
                  <span
                    key={m.id}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                      dark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${
                        dark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {initials(m.name)}
                    </span>
                    <span className={`font-medium ${heading}`}>{m.name}</span>
                    <span className={muted}>· {m.title}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className={`text-xs ${muted}`}>No team assigned yet.</span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className={`text-xs ${muted}`}>Delivery progress</span>
                <span className="text-2xl font-bold tabular-nums text-violet-500">
                  {selected.progress}%
                </span>
              </div>
              <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                <div
                  className={`h-full rounded-full transition-all ${
                    HEALTH_ACCENT[selected.health] || HEALTH_ACCENT['on-track']
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, selected.progress))}%` }}
                />
              </div>
              <div className={`mt-2 text-xs tabular-nums ${muted}`}>
                {left === null
                  ? '—'
                  : left < 0
                    ? `Delivered ${-left} days late`
                    : `${left} days left`}{' '}
                · {selected.startDate || '—'} → {selected.dueDate || '—'}
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-2 lg:gap-4">
              <div>
                <dt className={`text-[11px] uppercase tracking-wide ${muted}`}>Estimated</dt>
                <dd className={`mt-1 text-lg font-semibold tabular-nums ${heading}`}>
                  {selected.estHours}h
                </dd>
              </div>
              <div>
                <dt className={`text-[11px] uppercase tracking-wide ${muted}`}>Allocated</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-violet-500">
                  {selected.allocatedHours}h
                </dd>
              </div>
              <div>
                <dt className={`text-[11px] uppercase tracking-wide ${muted}`}>Used</dt>
                <dd className={`mt-1 text-lg font-semibold tabular-nums ${heading}`}>
                  {selected.usedHours}h
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className={`mt-5 overflow-hidden rounded-2xl border ${panel}`}>
          <div className="px-4 py-3 text-sm font-semibold">PTDs</div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`border-t border-b text-xs uppercase tracking-wide ${muted}`}>
                <th className="px-4 py-2.5 font-medium">PTD</th>
                <th className="px-4 py-2.5 font-medium">Hours</th>
                <th className="px-4 py-2.5 font-medium">Progress</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {selected.ptds.map((p) => (
                <tr key={p.id} className={`border-b last:border-0 ${dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50'}`}>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${heading}`}>
                      <span className="text-violet-500">{p.ref}</span> · {p.name}
                    </div>
                    <div className={`mt-0.5 max-w-[320px] truncate text-xs ${muted}`}>
                      {p.description || '—'}
                    </div>
                  </td>
                  <td className={`px-4 py-3 tabular-nums ${muted}`}>
                    est {p.estimatedHours}h · alloc {p.allocatedHours}h
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
                </tr>
              ))}
              {selected.ptds.length === 0 && (
                <tr>
                  <td colSpan={5} className={`px-4 py-10 text-center text-sm ${muted}`}>
                    No PTDs for this project yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const kpiData = [
    { label: 'Total projects', value: stats.total, icon: Briefcase, num: 'text-violet-500', iconCls: 'text-zinc-500' },
    { label: 'Active', value: stats.active, icon: Play, num: 'text-violet-500', iconCls: 'text-violet-400' },
    { label: 'At risk', value: stats.atRisk, icon: AlertTriangle, num: 'text-amber-500', iconCls: 'text-amber-400' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, num: heading, iconCls: 'text-zinc-500' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 flex justify-center overflow-hidden">
        <div className="h-72 w-[64rem] max-w-full rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      {/* Search + filter */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name or client..."
            className={`pl-10 ${inputCls(dark)}`}
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
              {s === 'all' ? 'All' : PROJECT_STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Hero band */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 ${
          dark
            ? 'border-zinc-800 bg-gradient-to-br from-violet-500/15 via-zinc-900 to-zinc-900'
            : 'border-zinc-200 bg-gradient-to-br from-violet-500/10 via-white to-white'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${heading}`}>Projects</h1>
            <p className={`mt-1 text-xs ${muted}`}>
              Delivery progress across every client engagement.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className={`text-xs ${muted}`}>Avg delivery</div>
              <div className="text-2xl font-bold tabular-nums text-violet-500">{avgProgress}%</div>
            </div>
            <div className="text-right">
              <div className={`text-xs ${muted}`}>Committed hours</div>
              <div className={`text-2xl font-bold tabular-nums ${heading}`}>{totalEst}h</div>
            </div>
          </div>
        </div>

        <div
          className={`mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:mt-8 sm:flex sm:flex-row sm:divide-x sm:gap-0 ${
            dark ? 'sm:divide-zinc-800' : 'sm:divide-zinc-200'
          }`}
        >
          {kpiData.map((k) => (
            <div
              key={k.label}
              className="flex items-center justify-between gap-3 sm:flex-1 sm:px-6"
            >
              <div>
                <div className={`text-[11px] uppercase tracking-wider ${muted}`}>{k.label}</div>
                <div className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${k.num}`}>
                  {k.value}
                </div>
              </div>
              <k.icon className={`h-5 w-5 ${k.iconCls}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h2 className={`text-sm font-semibold ${heading}`}>Needs Attention</h2>
        </div>
        {attention.length > 0 ? (
          <div className="space-y-2">
            {attention.map((p) => {
              const left = daysLeft(p);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={`group flex w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer hover:border-violet-500/40 ${
                    dark ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white/80'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.health === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className={`min-w-0 flex-1 truncate text-sm font-medium ${heading}`}>
                    {p.name}
                  </span>
                  <span className={`hidden text-xs sm:inline ${muted}`}>{p.client}</span>
                  <span className={`text-xs tabular-nums ${
                    p.health === 'overdue' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {p.health === 'overdue'
                      ? `Overdue by ${-left} days`
                      : `${left} days left · ${p.progress}% done`}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-violet-500" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-xl border px-4 py-3 text-xs ${dark ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400' : 'border-zinc-200 bg-white/80 text-zinc-500'}`}>
            All projects are on track.
          </div>
        )}
      </section>

      {/* Project cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const left = daysLeft(p);
          const healthColor = HEALTH_COLORS[p.health] || HEALTH_COLORS['on-track'];
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`group relative flex flex-col rounded-2xl border p-5 text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 ${panel}`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl ${HEALTH_ACCENT[p.health] || HEALTH_ACCENT['on-track']}`}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-bold text-white shadow-md shadow-violet-500/30">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className={`truncate text-sm font-semibold ${heading}`}>{p.name}</div>
                    <div className={`mt-0.5 truncate text-xs ${muted}`}>{p.client}</div>
                  </div>
                </div>
                <div className="relative h-14 w-14 shrink-0">
                  <ProgressRing value={p.progress} color={healthColor} dark={dark} />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums"
                    style={{ color: healthColor }}
                  >
                    {p.progress}%
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <StatusChip status={p.status} />
                <PriorityBadge priority={p.priority} />
                <HealthBadge health={p.health} />
              </div>

              <div className={`mt-3 mb-4 text-xs ${muted}`}>
                PM {usersById[p.pm]?.name || '—'}
                <span className="mx-1">·</span> due {p.dueDate || '—'}
                <span className="ml-1 tabular-nums">
                  {left === null ? '' : left < 0 ? `(${-left}d late)` : `(${left}d left)`}
                </span>
              </div>

              <div
                className={`mt-auto flex items-center justify-between border-t pt-3 ${
                  dark ? 'border-zinc-800' : 'border-zinc-200'
                }`}
              >
                {memberStack(p.teamMembers, dark)}
                <div className="flex items-center gap-3 text-right text-xs tabular-nums">
                  <span className={muted}>
                    est <span className={`font-semibold ${heading}`}>{p.estHours}h</span>
                  </span>
                  <span className={muted}>
                    used <span className="font-semibold text-violet-500">{p.usedHours}h</span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className={`col-span-full rounded-2xl border py-10 text-center text-sm ${panel} ${muted}`}>
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
}