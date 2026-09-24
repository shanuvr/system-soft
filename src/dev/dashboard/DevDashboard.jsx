import { memo, useMemo } from 'react';
import {
  ListTodo,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bug,
  CalendarClock,
  Hourglass,
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
} from 'recharts';
import { useApp } from '../../data/context.js';
import {
  statusCounts,
  hoursTrend,
  summarizeWorkOrders,
  daysUntil,
} from './dashboardData.js';
import { axisProps, gridProps } from './chartTheme.js';
import { ChartCard, Legend, ChartTooltip } from './ChartBits.jsx';

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

function InsightChip({ label, value, icon: Icon, color, dark }) {
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
      </div>
    </div>
  );
}

export default memo(function DevDashboard({ dark }) {
  const { db, currentUser } = useApp();
  const { projects, workOrders, issues, activity } = db;

  const meId = currentUser?.id;
  const myName = currentUser?.name;

  const myWos = useMemo(
    () => workOrders.filter((w) => w.assignee === meId),
    [workOrders, meId],
  );

  const summary = useMemo(() => summarizeWorkOrders(myWos), [myWos]);
  const woStatus = useMemo(() => statusCounts(myWos), [myWos]);
  const myTrend = useMemo(() => hoursTrend(activity, 14, myName), [activity, myName]);
  const myIssues = useMemo(
    () => (issues || []).filter((i) => i.assignedTo === meId && i.status !== 'resolved' && i.status !== 'closed'),
    [issues, meId],
  );

  const overdue = useMemo(
    () =>
      myWos
        .filter((w) => w.status !== 'completed' && w.status !== 'done' && daysUntil(w.dueDate) !== null && daysUntil(w.dueDate) < 0)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
    [myWos],
  );

  const upcoming = useMemo(
    () =>
      myWos
        .filter((w) => w.status !== 'completed' && w.status !== 'done' && daysUntil(w.dueDate) !== null && daysUntil(w.dueDate) >= 0 && daysUntil(w.dueDate) <= 14)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
    [myWos],
  );

  const projectsById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  );

  const myActivity = useMemo(
    () => activity.filter((a) => a.actor === myName).slice(0, 6),
    [activity, myName],
  );

  const border = dark ? 'border-zinc-800' : 'border-zinc-200';
  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';

  const hourData = [
    { name: 'Estimated', value: summary.est },
    { name: 'Logged', value: summary.logged },
    { name: 'Remaining', value: Math.max(0, summary.est - summary.logged) },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${heading}`}>My Dashboard</h1>
        <p className={`mt-1 text-xs ${muted}`}>Welcome back, {currentUser?.name} — here's your workload today.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard dark={dark} label="My Work Orders" icon={ListTodo} value={summary.total} sub={`${summary.active} in progress`} />
        <StatCard dark={dark} label="Completed" icon={CheckCircle2} value={summary.done} sub={`${summary.inReview} awaiting review`} accent="text-emerald-500" />
        <StatCard dark={dark} label="Hours Spent" icon={Clock} value={`${summary.logged}h`} sub={`of ${summary.est}h estimated`} accent="text-sky-500" />
        <StatCard dark={dark} label="Overdue" icon={AlertTriangle} value={overdue.length} sub={overdue.length ? 'needs attention' : 'all on track'} accent="text-rose-500" />
      </div>

      {/* Insights strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightChip dark={dark} label="Overdue work orders" value={overdue.length} icon={AlertTriangle} color="bg-rose-500/10 text-rose-400 border-rose-500/20" />
        <InsightChip dark={dark} label="Open issues assigned" value={myIssues.length} icon={Bug} color="bg-sky-500/10 text-sky-400 border-sky-500/20" />
        <InsightChip dark={dark} label="Awaiting review" value={summary.inReview} icon={Timer} color="bg-violet-500/10 text-violet-400 border-violet-500/20" />
        <InsightChip dark={dark} label="Deadlines next 14 days" value={upcoming.length} icon={CalendarClock} color="bg-amber-500/10 text-amber-400 border-amber-500/20" />
      </div>

      {/* Status donut + hours trend */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard dark={dark} title="My Work Order Status" sub={`${summary.total} work orders assigned to me`}>
          {woStatus.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 208, height: 208 }}>
                  <PieChart>
                    <Pie data={woStatus} dataKey="value" nameKey="label" innerRadius={62} outerRadius={88} paddingAngle={2} stroke="none" animationDuration={700} animationEasing="ease-out">
                      {woStatus.map((s) => (
                        <Cell key={s.key} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip dark={dark} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold tabular-nums ${heading}`}>{summary.total}</span>
                  <span className={`text-[10px] uppercase tracking-wide ${muted}`}>Work Orders</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Legend items={woStatus.map((s) => ({ label: s.label, color: s.color, value: s.value }))} />
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">Nothing assigned to you yet.</div>
          )}
        </ChartCard>

        <ChartCard dark={dark} title="My Hours — Last 14 Days" sub="Hours I logged per day">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={myTrend} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="devHoursFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps(dark)} vertical={false} />
                <XAxis dataKey="day" tickMargin={6} {...axisProps(dark)} />
                <YAxis width={32} {...axisProps(dark)} allowDecimals={false} />
                <Tooltip content={<ChartTooltip dark={dark} />} />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="#0ea5e9" strokeWidth={2} fill="url(#devHoursFill)" animationDuration={600} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Hours bar + deadlines */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard dark={dark} title="Assigned Hour Budget" sub="Estimated vs logged vs remaining">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid {...gridProps(dark)} horizontal={false} />
                <XAxis type="number" {...axisProps(dark)} />
                <YAxis type="category" dataKey="name" width={84} {...axisProps(dark)} />
                <Tooltip content={<ChartTooltip dark={dark} />} cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" name="Hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} animationDuration={600} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <section className={`rounded-2xl border p-5 ${panel}`}>
          <div className="mb-4 flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-violet-500" />
            <h2 className={`text-sm font-bold ${heading}`}>Deadlines</h2>
          </div>
          {upcoming.length > 0 || overdue.length > 0 ? (
            <ul className="space-y-2.5">
              {overdue.map((w) => (
                <li key={w.id} className={`rounded-xl border p-3 ${border}`}>
                  <div className={`text-xs font-semibold ${heading}`}>{w.title}</div>
                  <div className={`mt-0.5 flex items-center justify-between text-[10px] ${muted}`}>
                    <span>{projectsById[w.projectId]?.name}</span>
                    <span className="font-semibold text-rose-400">Overdue · {w.dueDate}</span>
                  </div>
                </li>
              ))}
              {upcoming.map((w) => {
                const d = daysUntil(w.dueDate);
                return (
                  <li key={w.id} className={`rounded-xl border p-3 ${border}`}>
                    <div className={`text-xs font-semibold ${heading}`}>{w.title}</div>
                    <div className={`mt-0.5 flex items-center justify-between text-[10px] ${muted}`}>
                      <span>{projectsById[w.projectId]?.name}</span>
                      <span className={d <= 3 ? 'font-semibold text-amber-400' : ''}>in {d}d · {w.dueDate}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={`py-8 text-center text-xs ${muted}`}>No deadlines in the next 14 days.</div>
          )}
        </section>
      </div>

      {/* My recent activity */}
      <div className="mt-6">
        <section className={`rounded-2xl border p-5 ${panel}`}>
          <h2 className={`mb-4 text-sm font-bold ${heading}`}>My Recent Activity</h2>
          <ul className="space-y-3">
            {myActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className={`mt-0.5 min-w-[42px] text-xs tabular-nums ${muted}`}>{a.time}</span>
                <div className="min-w-0 text-sm">
                  <span className={muted}>{a.text}</span>
                  <span className={`ml-1 text-[10px] ${muted}`}>{a.date}</span>
                </div>
              </li>
            ))}
            {myActivity.length === 0 && <li className={`text-xs ${muted}`}>No activity recorded yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
});