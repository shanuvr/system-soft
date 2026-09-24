import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ListTodo,
  Timer,
} from 'lucide-react';
import { useApp } from '../../data/context.js';
import { PriorityBadge, WoStatusBadge } from './badges.jsx';
import DevWorkOrderDetail from './DevWorkOrderDetail.jsx';

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);
}

function isDone(wo) {
  return wo.status === 'completed' || wo.status === 'done';
}

export default function DevWorkOrders({ dark }) {
  const { db, currentUser } = useApp();
  const meId = currentUser?.id;

  const [openId, setOpenId] = useState(null);

  const projectsById = useMemo(
    () => Object.fromEntries((db.projects || []).map((p) => [p.id, p])),
    [db.projects],
  );

  const myWorkOrders = useMemo(
    () =>
      (db.workOrders || [])
        .filter((w) => w.assignee === meId)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
    [db.workOrders, meId],
  );

  const stats = useMemo(
    () => ({
      total: myWorkOrders.length,
      inProgress: myWorkOrders.filter((w) => w.status === 'in-progress').length,
      inReview: myWorkOrders.filter((w) => w.status === 'submitted-review').length,
      hours: myWorkOrders.reduce((s, w) => s + (w.actualHours || 0), 0),
    }),
    [myWorkOrders],
  );

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const cardBorder = dark ? 'border-zinc-800' : 'border-zinc-200';
  const heading = dark ? 'text-zinc-100' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';

  const kpis = [
    { label: 'Assigned', value: stats.total, icon: ListTodo, accent: 'text-violet-500' },
    { label: 'In Progress', value: stats.inProgress, icon: Timer, accent: 'text-amber-500' },
    { label: 'In Review', value: stats.inReview, icon: ClipboardCheck, accent: 'text-sky-500' },
    { label: 'Hours Logged', value: `${stats.hours}h`, icon: Clock, accent: 'text-emerald-500' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className={`text-2xl font-bold ${heading}`}>My Work Orders</h1>
        <p className={`mt-1 text-xs ${muted}`}>
          Tasks assigned to you by the project manager. At the end of each day, log your hours and
          update how much of the work is completed.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-2xl border p-4 ${panel}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-medium uppercase tracking-wide ${muted}`}>{k.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${cardBorder}`}>
                <k.icon className={`h-3.5 w-3.5 ${k.accent}`} />
              </span>
            </div>
            <div className={`mt-2 text-2xl font-bold tabular-nums ${heading}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Work order list */}
      <div className="mt-5 space-y-3">
        {myWorkOrders.length === 0 && (
          <div className={`rounded-2xl border py-14 text-center ${panel}`}>
            <ListTodo className={`mx-auto h-10 w-10 ${muted}`} />
            <p className={`mt-3 text-sm font-semibold ${heading}`}>No work orders assigned to you yet</p>
            <p className={`mt-1 text-xs ${muted}`}>Tasks from your project manager will show up here.</p>
          </div>
        )}

        {myWorkOrders.map((wo) => {
          const project = projectsById[wo.projectId];
          const left = daysUntil(wo.dueDate);
          const overdue = !isDone(wo) && left !== null && left < 0;
          const progress = Math.min(100, Math.max(0, wo.progress ?? 0));

          if (openId === wo.id) {
            return (
              <DevWorkOrderDetail
                key={wo.id}
                wo={wo}
                project={project}
                currentUser={currentUser}
                dark={dark}
                onBack={() => setOpenId(null)}
              />
            );
          }

          // Collapsed card
          return (
            <button
              key={wo.id}
              onClick={() => setOpenId(wo.id)}
              className={`group w-full rounded-2xl border p-4 text-left transition-all cursor-pointer hover:border-violet-500/40 ${panel}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-500 uppercase">{wo.id}</span>
                    <WoStatusBadge status={wo.status} />
                    <PriorityBadge priority={wo.priority} />
                  </div>
                  <div className={`mt-1 truncate text-sm font-bold ${heading}`}>{wo.title}</div>
                  <div className={`mt-0.5 truncate text-xs ${muted}`}>
                    {project?.name || 'Unassigned project'}
                    {wo.description ? ` — ${wo.description}` : ''}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                    <div
                      className={`h-full rounded-full ${
                        progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-violet-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-violet-500">{progress}%</span>
                </div>
                <span className={`shrink-0 text-[11px] tabular-nums ${muted}`}>
                  <span className="font-semibold text-emerald-500">{wo.actualHours || 0}h</span> logged /{' '}
                  {wo.estimatedHours || 0}h est
                </span>
              </div>

              <div className={`mt-2.5 flex items-center justify-between text-[11px] ${muted}`}>
                <span>Due {wo.dueDate || '—'}</span>
                {overdue ? (
                  <span className="font-bold text-red-400">overdue</span>
                ) : left !== null ? (
                  <span className={left <= 2 ? 'font-semibold text-amber-400' : ''}>{left}d left</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">{isDone(wo) ? 'Completed' : 'No deadline'}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}