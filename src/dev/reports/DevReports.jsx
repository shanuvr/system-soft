import { useMemo, useState } from 'react';
import {
  Bug,
  CheckCircle2,
  Clock,
  Hourglass,
  ListTodo,
  Plus,
  Send,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../data/context.js';
import { WoStatusBadge } from '../workorders/badges.jsx';

const DONE_STATUSES = new Set(['completed', 'done']);
const ACTIVE_STATUSES = new Set(['in-progress', 'submitted-review', 'changes-requested']);

function toIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtHours(h) {
  const n = Number(h) || 0;
  return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1);
}

function isEmptyDateRange(from, to) {
  return Boolean(from && to && from <= to);
}

export default function DevReports({ dark }) {
  const { db, currentUser, addReportEntry, deleteReportEntry } = useApp();
  const meId = currentUser?.id;
  const today = toIsoLocal(new Date());

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState(today);
  const periodActive = isEmptyDateRange(fromDate, toDate);

  const [entryDate, setEntryDate] = useState(today);
  const [entryHours, setEntryHours] = useState('');
  const [entryWo, setEntryWo] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const projectsById = useMemo(
    () => Object.fromEntries((db.projects || []).map((p) => [p.id, p])),
    [db.projects],
  );
  const workOrdersById = useMemo(
    () => Object.fromEntries((db.workOrders || []).map((w) => [w.id, w])),
    [db.workOrders],
  );

  const myWOs = useMemo(
    () =>
      (db.workOrders || []).filter((w) => {
        if (w.assignee !== meId) return false;
        if (periodActive) return Boolean(w.dueDate && w.dueDate >= fromDate && w.dueDate <= toDate);
        return true;
      }),
    [db.workOrders, meId, periodActive, fromDate, toDate],
  );

  const myIssues = useMemo(
    () =>
      (db.issues || [])
        .filter((i) => {
          if (i.assignedTo !== meId) return false;
          if (periodActive) return Boolean(i.dateReported && i.dateReported >= fromDate && i.dateReported <= toDate);
          return true;
        })
        .sort((a, b) => (b.dateReported || '').localeCompare(a.dateReported || '')),
    [db.issues, meId, periodActive, fromDate, toDate],
  );

  const myEntries = useMemo(
    () =>
      (db.reportEntries || [])
        .filter((e) => {
          if (e.userId !== meId) return false;
          if (periodActive) return Boolean(e.date && e.date >= fromDate && e.date <= toDate);
          return true;
        })
        .sort((a, b) => `${b.date || ''}${b.time || ''}`.localeCompare(`${a.date || ''}${a.time || ''}`)),
    [db.reportEntries, meId, periodActive, fromDate, toDate],
  );

  const stats = useMemo(() => {
    const sum = (fn) => myWOs.reduce((s, w) => s + (Number(fn(w)) || 0), 0);
    const est = sum((w) => w.estimatedHours);
    const logged = sum((w) => w.actualHours);
    return {
      total: myWOs.length,
      est,
      logged,
      remaining: sum((w) => Math.max(0, (Number(w.estimatedHours) || 0) - (Number(w.actualHours) || 0))),
      done: myWOs.filter((w) => DONE_STATUSES.has(w.status)).length,
      active: myWOs.filter((w) => ACTIVE_STATUSES.has(w.status)).length,
      overdue: myWOs.filter((w) => w.dueDate && w.dueDate < today && !DONE_STATUSES.has(w.status)).length,
      issuesResolved: myIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
      issuesOpen: myIssues.filter((i) => i.status === 'open' || i.status === 'in-progress').length,
    };
  }, [myWOs, myIssues, today]);

  const resetPeriod = () => {
    const d = new Date();
    setFromDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    setToDate(toIsoLocal(new Date()));
  };

  const canSubmit = (Number(entryHours) || 0) > 0 || entryNotes.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    addReportEntry({ date: entryDate, hours: Number(entryHours) || 0, workOrderId: entryWo || null, notes: entryNotes });
    setEntryHours('');
    setEntryNotes('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  };

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const cardBorder = dark ? 'border-zinc-800' : 'border-zinc-200';
  const heading = dark ? 'text-zinc-100' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';
  const rowHover = dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50';
  const inputBg = dark
    ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-violet-500'
    : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:border-violet-500';

  const kpis = [
    { label: 'Work Orders', value: stats.total, icon: ListTodo, accent: 'text-violet-500', sub: `${stats.active} in progress` },
    { label: 'Hours Logged', value: `${fmtHours(stats.logged)}h`, icon: Clock, accent: 'text-sky-500', sub: `of ${fmtHours(stats.est)}h est` },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, accent: 'text-emerald-500', sub: `${stats.remaining}h left` },
    { label: 'Issues Solved', value: stats.issuesResolved, icon: Bug, accent: 'text-rose-500', sub: `${stats.issuesOpen} still open` },
  ];

  const renderWoRow = (w) => {
    const project = projectsById[w.projectId];
    const remainingH = Math.max(0, (Number(w.estimatedHours) || 0) - (Number(w.actualHours) || 0));
    const pct = w.estimatedHours ? Math.min(100, Math.round(((w.actualHours || 0) / w.estimatedHours) * 100)) : 0;
    const loggedPct = Math.min(100, Math.max(0, Number(w.progress ?? 0)));
    return (
      <div
        key={w.id}
        className={`grid grid-cols-1 gap-2 rounded-xl border px-3 py-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-center ${cardBorder} ${rowHover}`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 font-mono text-[10px] font-bold text-violet-500">{w.id}</span>
            <span className={`truncate text-xs font-semibold ${heading}`}>{w.title}</span>
          </div>
          <div className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] ${muted}`}>
            {project && <span>{project.name}</span>}
            {w.dueDate && <span>· due {w.dueDate}</span>}
            <span className="flex items-center gap-1">
              · <Clock className="h-3 w-3" /> {fmtHours(w.actualHours)}h / {fmtHours(w.estimatedHours)}h
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-500/20">
              <div
                className={`h-full rounded-full ${loggedPct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                style={{ width: `${loggedPct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-violet-500">{loggedPct}%</span>
          </div>
        </div>
        <WoStatusBadge status={w.status} />
        <div className="flex items-center gap-3 text-[11px] tabular-nums">
          <span className={muted}>Left <span className="font-semibold text-amber-400">{fmtHours(remainingH)}h</span></span>
          <span className="hidden h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-[10px] font-bold text-violet-400 sm:flex">
            {pct}%
          </span>
        </div>
      </div>
    );
  };

  const renderEntry = (e) => {
    const wo = workOrdersById[e.workOrderId];
    return (
      <div key={e.id} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${cardBorder}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${dark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
          <Clock className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
            <span className={`font-bold tabular-nums ${heading}`}>{e.hours > 0 ? `${fmtHours(e.hours)}h` : 'Note'}</span>
            <span className={muted}>{e.date}</span>
            {e.time && <span className={muted}>· {e.time}</span>}
            {wo && <span className="font-mono text-[10px] font-bold text-violet-500">{wo.id}</span>}
          </div>
          <div className={`mt-1 text-xs leading-relaxed ${e.notes ? heading : muted}`}>
            {e.notes || 'No notes added.'}
          </div>
        </div>
        <button
          onClick={() => deleteReportEntry(e.id)}
          title="Delete entry"
          className="rounded-lg p-1 text-zinc-400 transition-colors cursor-pointer hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-6 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>My Reports</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Your work summaries are generated automatically. Add your own daily report entries to record progress.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className={`flex flex-col gap-1 text-[10px] font-semibold uppercase ${muted}`}>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`rounded-xl border px-2 py-1.5 text-xs outline-none ${inputBg}`}
            />
          </label>
          <label className={`flex flex-col gap-1 text-[10px] font-semibold uppercase ${muted}`}>
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`rounded-xl border px-2 py-1.5 text-xs outline-none ${inputBg}`}
            />
          </label>
          <button
            onClick={resetPeriod}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Auto KPI strip */}
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

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
        {/* LEFT: auto report */}
        <div className="flex min-w-0 flex-col gap-4">
          <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className={`text-sm font-bold ${heading}`}>Work Report ({stats.total})</h3>
              <span className={`text-[10px] ${muted}`}>
                {periodActive ? `${fromDate} → ${toDate}` : 'All time'}
              </span>
            </div>
            {stats.total > 0 ? (
              <div className="flex flex-col gap-2">{myWOs.map(renderWoRow)}</div>
            ) : (
              <div className={`py-10 text-center ${muted}`}>
                <Hourglass className="mx-auto h-8 w-8" />
                <p className="mt-2 text-xs font-semibold">No work orders in this period</p>
              </div>
            )}
          </section>

          <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className={`flex items-center gap-1.5 text-sm font-bold ${heading}`}>
                <Bug className="h-3.5 w-3.5 text-rose-400" /> Issues Report ({stats.issuesResolved} resolved / {stats.issuesOpen} open)
              </h3>
            </div>
            {myIssues.length > 0 ? (
              <div className="flex flex-col gap-2">
                {myIssues.map((i) => {
                  const project = projectsById[i.projectId];
                  return (
                    <div key={i.id} className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${cardBorder} ${rowHover}`}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${i.status === 'open' ? 'bg-rose-500' : i.status === 'in-progress' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                      <span className={`min-w-0 flex-1 truncate text-xs ${heading}`}>{i.title}</span>
                      {project && <span className={`hidden text-[10px] sm:inline ${muted}`}>{project.name}</span>}
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                        i.status === 'resolved' || i.status === 'closed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : i.status === 'in-progress'
                          ? 'bg-sky-500/15 text-sky-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {i.status.replace('-', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`py-8 text-center text-xs ${muted}`}>
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400" />
                <p className="mt-2 font-semibold">No issues assigned in this period</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT: manual entries */}
        <div className="flex min-w-0 flex-col gap-4">
          <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
            <h3 className={`flex items-center gap-1.5 text-sm font-bold ${heading}`}>
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" /> Add Report Entry
            </h3>
            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
                  Date
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all ${inputBg}`}
                  />
                </label>
                <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
                  Hours
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={entryHours}
                    onChange={(e) => setEntryHours(e.target.value)}
                    placeholder="0.0"
                    className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all ${inputBg}`}
                  />
                </label>
              </div>
              <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
                Work Order
                <select
                  value={entryWo}
                  onChange={(e) => setEntryWo(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all cursor-pointer ${inputBg}`}
                >
                  <option value="">No work order</option>
                  {(db.workOrders || [])
                    .filter((w) => w.assignee === meId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.id} — {w.title}
                      </option>
                    ))}
                </select>
              </label>
              <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
                Notes
                <textarea
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Finished the retry backoff, moved on to integration tests..."
                  className={`mt-1 w-full resize-none rounded-xl border px-2.5 py-2 text-xs outline-none transition-all ${inputBg}`}
                />
              </label>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer ${
                  canSubmit
                    ? 'bg-violet-600 shadow-md shadow-violet-600/30 hover:bg-violet-500'
                    : 'cursor-not-allowed bg-zinc-600 opacity-50'
                }`}
              >
                <Plus className="h-3.5 w-3.5" /> Add Entry
              </button>
              {submitted && <p className="text-center text-[11px] font-semibold text-emerald-400">Entry saved to your report.</p>}
            </form>
          </section>

          <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-sm font-bold ${heading}`}>My Entries ({myEntries.length})</h3>
              <Send className={`h-3.5 w-3.5 ${muted}`} />
            </div>
            {myEntries.length > 0 ? (
              <div className="flex flex-col gap-2">{myEntries.map(renderEntry)}</div>
            ) : (
              <div className={`py-8 text-center text-xs ${muted}`}>
                No entries in this period — add one above.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}