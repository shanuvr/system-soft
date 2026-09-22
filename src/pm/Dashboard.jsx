import { useMemo } from 'react';
import { Briefcase, ListTodo, Clock, AlertTriangle, Users, Activity } from 'lucide-react';
import { useApp } from '../data/context.js';

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);
}

function StatCard({ label, value, sub, icon: Icon, dark }) {
  const on = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  return (
    <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-colors ${on}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-medium tracking-wide ${muted}`}>{label}</span>
        <Icon className="h-4 w-4 text-violet-500" />
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      <div className={`mt-1 text-xs ${muted}`}>{sub}</div>
    </div>
  );
}

function ProgressBar({ value, dark }) {
  const track = dark ? 'bg-zinc-800' : 'bg-zinc-200';
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${track}`}>
      <div
        className="h-full rounded-full bg-violet-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function PriorityTag({ priority }) {
  const styles = {
    high: 'bg-red-500/15 text-red-400',
    medium: 'bg-amber-500/15 text-amber-400',
    low: 'bg-zinc-500/15 text-zinc-400',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styles[priority] || styles.low}`}>
      {priority}
    </span>
  );
}

export default function PMDashboard({ dark }) {
  const { db } = useApp();
  const { projects, ptds, workOrders, users, activity } = db;

  const stats = useMemo(() => {
    const projActive = projects.filter((p) => p.status === 'active');
    const projCompleted = projects.filter((p) => p.status === 'completed');
    const projOnHold = projects.filter((p) => p.status === 'on-hold');
    const nearingDeadline = projects.filter((p) => {
      const d = daysUntil(p.dueDate);
      return d !== null && d >= 0 && d <= 7;
    });
    const delayedProjects = projects.filter(
      (p) => p.status !== 'completed' && daysUntil(p.dueDate) !== null && daysUntil(p.dueDate) < 0,
    );

    const pending = workOrders.filter((w) => w.status === 'not-started' || w.status === 'in-progress');
    const overdue = workOrders.filter(
      (w) => w.status !== 'completed' && daysUntil(w.dueDate) !== null && daysUntil(w.dueDate) < 0,
    );
    const awaitingReview = workOrders.filter((w) => w.status === 'submitted-review');

    const planned = workOrders.reduce((s, w) => s + (w.estimatedHours || 0), 0);
    const actual = workOrders.reduce((s, w) => s + (w.actualHours || 0), 0);

    const projectProgress = projects.map((p) => {
      const pts = ptds.filter((t) => t.projectId === p.id);
      const progress = pts.length ? Math.round(pts.reduce((s, t) => s + t.progress, 0) / pts.length) : 0;
      return { ...p, progress };
    });

    const workload = users
      .filter((u) => u.role === 'dev')
      .map((u) => {
        const items = workOrders.filter((w) => w.assignee === u.id);
        return {
          ...u,
          count: items.length,
          assignedHours: items.reduce((s, w) => s + (w.estimatedHours || 0), 0),
          completedHours: items
            .filter((w) => w.status === 'completed')
            .reduce((s, w) => s + (w.actualHours || 0), 0),
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalProjects: projects.length,
      projActive,
      projCompleted,
      projOnHold,
      nearingDeadline,
      delayedProjects,
      pending,
      overdue,
      awaitingReview,
      planned,
      actual,
      remaining: Math.max(0, planned - actual),
      projectProgress,
      workload,
    };
  }, [projects, ptds, workOrders, users]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todaysActivity = activity.filter((a) => a.date === todayISO).slice(0, 6);
  const feed = todaysActivity.length ? todaysActivity : activity.slice(0, 6);

  const border = dark ? 'border-zinc-800' : 'border-zinc-200';
  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${heading}`}>Dashboard</h1>
        <p className={`mt-1 text-xs ${muted}`}>Overview of all ongoing project activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          dark={dark}
          label="Projects"
          icon={Briefcase}
          value={stats.totalProjects}
          sub={`${stats.projActive.length} active · ${stats.projCompleted.length} completed · ${stats.projOnHold.length} on hold`}
        />
        <StatCard
          dark={dark}
          label="Work Orders"
          icon={ListTodo}
          value={stats.pending.length}
          sub={`${stats.overdue.length} overdue · ${stats.awaitingReview.length} awaiting review`}
        />
        <StatCard
          dark={dark}
          label="Planned vs Actual"
          icon={Clock}
          value={`${stats.planned}h`}
          sub={`${stats.actual}h used · ${stats.remaining}h remaining`}
        />
        <StatCard
          dark={dark}
          label="Deadlines & Alerts"
          icon={AlertTriangle}
          value={stats.overdue.length + stats.delayedProjects.length}
          sub={`${stats.nearingDeadline.length} nearing deadline · ${stats.delayedProjects.length} delayed projects`}
        />
      </div>

      {/* Team workload / today's activity */}
      <div className={`mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2`}>
        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-500" />
            <h2 className={`text-sm font-semibold ${heading}`}>Team Workload</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wide ${border} ${muted}`}>
                  <th className="pb-2 pr-3 font-medium">Developer</th>
                  <th className="pb-2 pr-3 font-medium">Work Orders</th>
                  <th className="pb-2 pr-3 font-medium">Assigned</th>
                  <th className="pb-2 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {stats.workload.map((u) => (
                  <tr key={u.id} className={`border-b last:border-0 ${border}`}>
                    <td className={`py-2.5 pr-3 ${heading}`}>{u.name}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{u.count}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{u.assignedHours}h</td>
                    <td className="py-2.5 font-medium text-violet-500 tabular-nums">
                      {u.completedHours}h
                    </td>
                  </tr>
                ))}
                {stats.workload.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`py-4 text-center text-xs ${muted}`}>
                      No developers assigned yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-500" />
            <h2 className={`text-sm font-semibold ${heading}`}>Today's Activity</h2>
          </div>
          <ul className="space-y-3">
            {feed.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className={`mt-0.5 min-w-[42px] text-xs tabular-nums ${muted}`}>{a.time}</span>
                <div className="min-w-0 text-sm">
                  <span className={`font-medium ${heading}`}>{a.actor}</span>{' '}
                  <span className={muted}>{a.text}</span>
                </div>
              </li>
            ))}
            {feed.length === 0 && <li className={`text-xs ${muted}`}>No activity recorded.</li>}
          </ul>
        </section>
      </div>

      {/* Project progress / urgent work orders */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-sm font-semibold ${heading}`}>Project Progress</h2>
            <span className={`text-xs ${muted}`}>avg. PTD progress</span>
          </div>
          <ul className="space-y-4">
            {stats.projectProgress.map((p) => (
              <li key={p.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className={`font-medium ${heading}`}>{p.name}</span>
                  <span className={`text-xs tabular-nums ${muted}`}>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} dark={dark} />
              </li>
            ))}
          </ul>
        </section>

        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-violet-500" />
            <h2 className={`text-sm font-semibold ${heading}`}>Urgent & Overdue Work Orders</h2>
          </div>
          <ul className="space-y-3">
            {stats.overdue.map((w) => {
              const project = projects.find((p) => p.id === w.projectId);
              return (
                <li key={w.id} className={`rounded-xl border p-3 text-sm ${border}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium ${heading}`}>{w.title}</span>
                    <PriorityTag priority={w.priority} />
                  </div>
                  <div className={`mt-1 flex items-center justify-between text-xs ${muted}`}>
                    <span>{project?.name || 'Project'}</span>
                    <span className="text-red-400 font-semibold tabular-nums">Due: {w.dueDate}</span>
                  </div>
                </li>
              );
            })}
            {stats.overdue.length === 0 && (
              <li className={`text-xs ${muted}`}>No overdue work orders.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}