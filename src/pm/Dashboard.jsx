import { memo, useMemo } from 'react';
import {
  Briefcase,
  ListTodo,
  AlertTriangle,
  Activity,
  Bug,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend as RLegend,
} from 'recharts';
import { useApp } from '../data/context.js';
import {
  statusCounts,
  issueFixedOpenCounts,
  avgTimeToFix,
  perProjectHours,
  workloadByDev,
  hoursTrend,
  daysUntil,
} from './dashboard/dashboardData.js';
import { axisProps, gridProps } from './dashboard/chartTheme.js';
import { ChartCard, Legend, ChartTooltip } from './dashboard/ChartBits.jsx';

function StatCard({ label, value, sub, icon: Icon, dark, accent = 'text-violet-500' }) {
  const on = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  return (
    <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-colors ${on}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-medium tracking-wide ${muted}`}>{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${heading}`}>{value}</div>
      <div className={`mt-1 text-xs ${muted}`}>{sub}</div>
    </div>
  );
}

function InsightChip({ label, value, icon: Icon, color, sub, dark }) {
  const on = dark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white/80 border-zinc-200';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 ${on}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${color}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className={`text-xl font-bold leading-tight tabular-nums ${heading}`}>{value}</div>
        <div className={`truncate text-[10px] font-medium uppercase tracking-wide ${dark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          {label}
        </div>
        {sub && <div className={`truncate text-[10px] ${dark ? 'text-zinc-500' : 'text-zinc-500'}`}>{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value, dark }) {
  const track = dark ? 'bg-zinc-800' : 'bg-zinc-200';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  return (
    <div className="flex items-center gap-3">
      <div className={`h-1.5 w-full overflow-hidden rounded-full ${track}`}>
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className={`w-9 text-right text-xs tabular-nums ${heading}`}>{Math.round(value)}%</span>
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

export default memo(function PMDashboard({ dark }) {
  const { db } = useApp();
  const { projects, ptds, workOrders, users, activity, issues } = db;

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
    const overdue = workOrders.filter(
      (w) => w.status !== 'completed' && w.status !== 'done' && daysUntil(w.dueDate) !== null && daysUntil(w.dueDate) < 0,
    );
    const openIssues = (issues || []).filter((i) => i.status === 'open' || i.status === 'in-progress');

    const projectProgress = projects.map((p) => {
      const pts = ptds.filter((t) => t.projectId === p.id);
      const progress = pts.length ? Math.round(pts.reduce((s, t) => s + t.progress, 0) / pts.length) : 0;
      const daysLeft = daysUntil(p.dueDate);
      return { ...p, progress, daysLeft };
    });

    return {
      totalProjects: projects.length,
      projActive,
      projCompleted,
      projOnHold,
      nearingDeadline,
      delayedProjects,
      overdue,
      openIssues,
      projectProgress,
    };
  }, [projects, ptds, workOrders, issues]);

  const woStatus = useMemo(() => statusCounts(workOrders), [workOrders]);
  const inProgress = woStatus.find((s) => s.key === 'in-progress')?.value || 0;
  const issueFixed = useMemo(() => issueFixedOpenCounts(issues), [issues]);
  const avgFix = useMemo(() => avgTimeToFix(issues), [issues]);
  const hoursByProject = useMemo(() => perProjectHours(projects, workOrders), [projects, workOrders]);
  const workload = useMemo(() => workloadByDev(users, workOrders), [users, workOrders]);
  const trend = useMemo(() => hoursTrend(activity, 14), [activity]);

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

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          value={workOrders.length}
          sub={`${stats.overdue.length} overdue · ${inProgress} in progress`}
        />
        <StatCard
          dark={dark}
          label="Open Issues"
          icon={Bug}
          value={stats.openIssues.length}
          sub={`${stats.delayedProjects.length} delayed · ${stats.nearingDeadline.length} nearing deadline`}
          accent="text-rose-500"
        />
      </div>

      {/* Insights strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <InsightChip
          dark={dark}
          label="Overdue work orders"
          value={stats.overdue.length}
          icon={AlertTriangle}
          color="bg-rose-500/10 text-rose-400 border-rose-500/20"
          sub={stats.overdue.length ? stats.overdue[0].title.slice(0, 24) : 'None'}
        />
        <InsightChip
          dark={dark}
          label="Delayed projects"
          value={stats.delayedProjects.length}
          icon={CalendarClock}
          color="bg-amber-500/10 text-amber-400 border-amber-500/20"
        />
        <InsightChip
          dark={dark}
          label="Open issues"
          value={stats.openIssues.length}
          icon={Bug}
          color="bg-sky-500/10 text-sky-400 border-sky-500/20"
        />
      </div>

      {/* Donut charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          dark={dark}
          title="Work Order Status"
          sub={`${workOrders.length} work orders across all projects`}
          action={
            <span className={`rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${dark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-700'}`}>
              {workOrders.length} total
            </span>
          }
        >
          {woStatus.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 208, height: 208 }}>
                  <PieChart>
                    <Pie
                      data={woStatus}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="none"
                      animationDuration={700}
                      animationEasing="ease-out"
                    >
                      {woStatus.map((s) => (
                        <Cell key={s.key} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip dark={dark} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold tabular-nums ${heading}`}>{workOrders.length}</span>
                  <span className={`text-[10px] uppercase tracking-wide ${muted}`}>Work Orders</span>
                </div>
              </div>
<div className="flex-1 space-y-2">
                  <Legend items={woStatus.map((s) => ({ label: s.label, color: s.color, value: s.value }))} />
                  <div className={`mt-2 rounded-xl border p-3 ${border}`}>
                    <div className={`text-[10px] font-semibold uppercase ${muted}`}>Avg. progress</div>
                    <div className={`mt-0.5 text-lg font-bold ${heading}`}>
                      {Math.round(workOrders.reduce((s, w) => s + (w.progress || 0), 0) / Math.max(1, workOrders.length))}%
                    </div>
                  </div>
                </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">No work orders yet.</div>
          )}
        </ChartCard>

        <ChartCard
          dark={dark}
          title="Issues Reported vs Fixed"
          sub="Fixed vs still-open issues across projects"
          action={
            <span className={`rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${dark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-700'}`}>
              {(issues || []).length} reported
            </span>
          }
        >
          {issueFixed.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 208, height: 208 }}>
                  <PieChart>
                    <Pie
                      data={issueFixed}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="none"
                      animationDuration={700}
                      animationEasing="ease-out"
                    >
                      {issueFixed.map((s) => (
                        <Cell key={s.key} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip dark={dark} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold tabular-nums ${heading}`}>{(issues || []).length}</span>
                  <span className={`text-[10px] uppercase tracking-wide ${muted}`}>Issues</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Legend items={issueFixed.map((s) => ({ label: s.label, color: s.color, value: s.value }))} />
                <div className={`mt-2 grid grid-cols-2 gap-2`}>
                  <div className={`rounded-xl border p-3 ${border}`}>
                    <div className={`text-[10px] font-semibold uppercase ${muted}`}>Fixed</div>
                    <div className={`mt-0.5 text-lg font-bold text-emerald-500`}>
                      {issueFixed.find((s) => s.key === 'fixed')?.value || 0}
                    </div>
                  </div>
                  <div className={`rounded-xl border p-3 ${border}`}>
                    <div className={`text-[10px] font-semibold uppercase ${muted}`}>Avg time to fix</div>
                    <div className={`mt-0.5 text-lg font-bold ${heading}`}>
                      {avgFix !== null ? `${avgFix}d` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">No issues reported yet.</div>
          )}
        </ChartCard>
      </div>

      {/* Bars: planned vs actual + hours trend */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard dark={dark} title="Planned vs Actual Hours" sub="Estimated vs logged hours per project">
          {hoursByProject.some((p) => p.estimated > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByProject} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid {...gridProps(dark)} horizontal={false} />
                  <XAxis type="number" {...axisProps(dark)} />
                  <YAxis type="category" dataKey="name" width={96} {...axisProps(dark)} />
                  <Tooltip content={<ChartTooltip dark={dark} />} cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  <RLegend
                    iconType="circle"
                    formatter={(v) => <span className="text-xs text-zinc-500">{v}</span>}
                  />
                  <Bar dataKey="estimated" name="Estimated" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} animationDuration={600} animationEasing="ease-out" />
                  <Bar dataKey="logged" name="Logged" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={14} animationDuration={600} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">No estimated hours yet.</div>
          )}
        </ChartCard>

        <ChartCard dark={dark} title="Hours Charged — Last 14 Days" sub="Team hours logged per day (from activity log)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps(dark)} vertical={false} />
                <XAxis dataKey="day" tickMargin={6} {...axisProps(dark)} />
                <YAxis width={32} {...axisProps(dark)} allowDecimals={false} />
                <Tooltip content={<ChartTooltip dark={dark} />} />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="#8b5cf6" strokeWidth={2} fill="url(#hoursFill)" animationDuration={600} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Workload + activity */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard dark={dark} title="Team Workload" sub="Assigned hours per developer">
          {workload.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid {...gridProps(dark)} horizontal={false} />
                  <XAxis type="number" {...axisProps(dark)} />
                  <YAxis type="category" dataKey="name" width={96} {...axisProps(dark)} />
                  <Tooltip content={<ChartTooltip dark={dark} />} cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  <RLegend iconType="circle" formatter={(v) => <span className="text-xs text-zinc-500">{v}</span>} />
                  <Bar dataKey="logged" name="Logged" stackId="h" fill="#10b981" barSize={16} animationDuration={600} animationEasing="ease-out" />
                  <Bar dataKey="remaining" name="Remaining" stackId="h" fill="#8b5cf6" barSize={16} radius={[0, 4, 4, 0]} animationDuration={600} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">No assignments yet.</div>
          )}
        </ChartCard>

        <ChartCard
          dark={dark}
          title="Today's Activity"
          action={
            <span className={`flex h-4 w-4 ${dark ? 'text-zinc-500' : 'text-violet-500'}`}>
              <Activity className="h-4 w-4" />
            </span>
          }
        >
          <ul className="max-h-60 space-y-3 overflow-y-auto">
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
        </ChartCard>
      </div>

      {/* Progress + overdue */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-sm font-bold ${heading}`}>Project Progress</h2>
            <span className={`flex items-center gap-1.5 text-xs ${muted}`}>
              <CalendarClock className="h-3.5 w-3.5 text-violet-500" /> avg. PTD progress
            </span>
          </div>
          <ul className="space-y-4">
            {stats.projectProgress.map((p) => (
              <li key={p.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className={`font-medium ${heading}`}>{p.name}</span>
                  <span className={`flex items-center gap-2 text-[10px] ${muted}`}>
                    {p.daysLeft !== null && p.daysLeft < 0 ? (
                      <span className="font-semibold text-rose-400">overdue {Math.abs(p.daysLeft)}d</span>
                    ) : p.daysLeft !== null && p.daysLeft <= 7 ? (
                      <span className={`font-semibold ${dark ? 'text-amber-400' : 'text-amber-500'}`}>{p.daysLeft}d left</span>
                    ) : p.daysLeft !== null ? (
                      `${p.daysLeft}d left`
                    ) : null}
                  </span>
                </div>
                <ProgressBar value={p.progress} dark={dark} />
              </li>
            ))}
          </ul>
        </section>

        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-violet-500" />
            <h2 className={`text-sm font-bold ${heading}`}>Urgent & Overdue Work Orders</h2>
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
                    <span className="font-semibold text-red-400 tabular-nums">Due: {w.dueDate}</span>
                  </div>
                </li>
              );
            })}
            {stats.overdue.length === 0 && (
              <li className={`text-xs ${muted}`}>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> No overdue work orders.
                </span>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
});