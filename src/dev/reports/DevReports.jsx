import { useMemo, useState } from 'react';
import {
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hourglass,
  ListChecks,
  ListTodo,
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

export default function DevReports({ dark }) {
  const { db, currentUser, submitDailyReport, deleteReportEntry } = useApp();
  const meId = currentUser?.id;
  const today = toIsoLocal(new Date());

  const [reportDate, setReportDate] = useState(today);
  const [itemWo, setItemWo] = useState('');
  const [itemHours, setItemHours] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [draft, setDraft] = useState([]);
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
    () => (db.workOrders || []).filter((w) => w.assignee === meId),
    [db.workOrders, meId],
  );

  const myIssues = useMemo(
    () =>
      (db.issues || [])
        .filter((i) => i.assignedTo === meId)
        .sort((a, b) => (b.dateReported || '').localeCompare(a.dateReported || '')),
    [db.issues, meId],
  );

  const myEntries = useMemo(
    () =>
      (db.reportEntries || [])
        .filter((e) => e.userId === meId)
        .sort((a, b) => `${b.date || ''}${b.time || ''}`.localeCompare(`${a.date || ''}${a.time || ''}`)),
    [db.reportEntries, meId],
  );

  const groupedEntries = useMemo(() => {
    const map = new Map();
    for (const e of myEntries) {
      const key = e.date || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return Array.from(map.entries())
      .map(([date, entries]) => ({
        date,
        entries,
        hours: entries.reduce((s, e) => s + (Number(e.hours) || 0), 0),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [myEntries]);

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

  const canAdd = (Number(itemHours) || 0) > 0 || itemNotes.trim().length > 0;
  const draftHours = draft.reduce((s, d) => s + (Number(d.hours) || 0), 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!canAdd) return;
    setDraft((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        workOrderId: itemWo || null,
        hours: Number(itemHours) || 0,
        notes: itemNotes.trim(),
      },
    ]);
    setItemHours('');
    setItemNotes('');
  };

  const handleRemoveDraft = (key) => {
    setDraft((prev) => prev.filter((d) => d.key !== key));
  };

  const handleSubmitDaily = () => {
    if (!draft.length) return;
    submitDailyReport({
      date: reportDate,
      entries: draft.map((d) => ({ workOrderId: d.workOrderId, hours: d.hours, notes: d.notes })),
    });
    setDraft([]);
    setItemHours('');
    setItemNotes('');
    setItemWo('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const renderDraftRow = (d) => {
    const wo = workOrdersById[d.workOrderId];
    return (
      <div key={d.key} className={`flex items-start gap-2.5 px-3 py-2.5 ${cardBorder} border-b last:border-b-0 ${rowHover}`}>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
          d.hours > 0 ? 'bg-violet-500/15 text-violet-400' : 'bg-zinc-500/15 text-zinc-400'
        }`}>
          {d.hours > 0 ? `${fmtHours(d.hours)}h` : 'Note'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-[11px]">
            <span className={`truncate font-semibold ${heading}`}>
              {wo ? wo.title : d.workOrderId || 'General'}
            </span>
            {wo && <span className="shrink-0 font-mono text-[10px] font-bold text-violet-500">{wo.id}</span>}
          </div>
          {d.notes && <p className={`mt-0.5 text-[11px] leading-relaxed ${muted}`}>{d.notes}</p>}
        </div>
        <button
          type="button"
          onClick={() => handleRemoveDraft(d.key)}
          title="Remove entry"
          className="rounded-lg p-1 text-zinc-400 transition-colors cursor-pointer hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
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

  const renderItem = (e) => {
    const wo = workOrdersById[e.workOrderId];
    const project = wo ? projectsById[wo.projectId] : null;
    return (
      <div key={e.id} className={`flex items-start gap-2.5 px-3 py-2.5 ${rowHover} border-b last:border-b-0`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          dark ? 'border-violet-500/25 bg-violet-500/15 text-violet-400' : 'border-violet-200 bg-violet-100 text-violet-600'
        }`}>
          <Clock className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
            {e.hours > 0 && (
              <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-violet-400">
                {fmtHours(e.hours)}h
              </span>
            )}
            {wo && <span className="font-mono text-[10px] font-bold text-violet-500">{wo.id}</span>}
            {e.time && <span className={muted}>{e.time}</span>}
          </div>
          {(wo || project) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px]">
              {wo && <span className={`truncate font-semibold ${heading}`}>{wo.title}</span>}
              {project && <span className={`truncate ${muted}`}>{project.name}</span>}
            </div>
          )}
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

  const renderGroup = (g) => (
    <div key={g.date} className={`rounded-xl border ${cardBorder}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 ${cardBorder} border-b`}>
        <span className={`flex items-center gap-2 text-[11px] font-bold ${heading}`}>
          <CalendarDays className="h-3.5 w-3.5 text-violet-400" /> {g.date}
        </span>
        <span className={`text-[11px] tabular-nums ${muted}`}>
          {g.entries.length} item{g.entries.length !== 1 ? 's' : ''} · <span className="font-bold text-violet-400">{fmtHours(g.hours)}h</span>
        </span>
      </div>
      {g.entries.map(renderItem)}
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-6 sm:px-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className={`text-2xl font-bold ${heading}`}>My Reports</h1>
        <p className={`mt-1 text-xs ${muted}`}>
          Your work summaries are generated automatically. Log each work item during the day, then submit once at the end of the day.
        </p>
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

      {/* Daily report builder: form left, draft + submit right */}
      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[400px_1fr]">
        {/* LEFT: form */}
        <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`flex items-center gap-1.5 text-sm font-bold ${heading}`}>
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" /> Daily Report
            </h3>
            <span className={`text-[10px] ${muted}`}>Log each work item you did today.</span>
          </div>

          <form onSubmit={handleAdd} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
                Report date
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all ${inputBg}`}
                />
              </label>
              <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
                Hours
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={itemHours}
                  onChange={(e) => setItemHours(e.target.value)}
                  placeholder="0.0"
                  className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all ${inputBg}`}
                />
              </label>
            </div>
            <label className={`block text-[10px] font-semibold uppercase ${muted}`}>
              Work Order
              <select
                value={itemWo}
                onChange={(e) => setItemWo(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all cursor-pointer ${inputBg}`}
              >
                <option value="">General work</option>
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
              Details
              <input
                type="text"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="What did you do? e.g. Finished retry backoff, integration tests"
                className={`mt-1 w-full rounded-xl border px-2.5 py-2 text-xs outline-none transition-all ${inputBg}`}
              />
            </label>
            <button
              type="submit"
              disabled={!canAdd}
              className={`flex w-full lg:w-auto items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer ${
                canAdd
                  ? 'bg-violet-600 shadow-md shadow-violet-600/30 hover:bg-violet-500'
                  : 'cursor-not-allowed bg-zinc-600 opacity-50'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" /> Add to Day's Report
            </button>
          </form>
        </section>

        {/* RIGHT: draft + submit */}
        <section className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`flex items-center gap-1.5 text-sm font-bold ${heading}`}>
              <Send className="h-3.5 w-3.5 text-emerald-400" /> Today's Report
            </h3>
            <span className={`text-[10px] ${muted}`}>{reportDate}</span>
          </div>

          {draft.length > 0 ? (
            <>
              <div className={`mt-3 rounded-xl border ${cardBorder}`}>
                <div className={`flex items-center justify-between px-3 py-2 ${cardBorder} border-b`}>
                  <span className={`text-[11px] font-bold ${heading}`}>
                    {draft.length} item{draft.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums text-violet-400">{fmtHours(draftHours)}h total</span>
                </div>
                {draft.map(renderDraftRow)}
              </div>
              <button
                type="button"
                onClick={handleSubmitDaily}
                className="mt-3 flex w-full lg:w-auto items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Submit Daily Report
              </button>
              {submitted && (
                <p className="mt-2 text-center text-[11px] font-semibold text-emerald-400">
                  Daily report submitted — sent to your manager.
                </p>
              )}
            </>
          ) : (
            <div className={`mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed ${cardBorder} py-10 text-center`}>
              <ListChecks className="h-6 w-6 text-violet-400" />
              <p className={`mt-2 text-xs font-semibold ${heading}`}>No items yet</p>
              <p className={`mt-1 px-4 text-[11px] ${muted}`}>Add your work items on the left, then submit once at the end of the day.</p>
            </div>
          )}

          {submitted && draft.length === 0 && (
            <p className="mt-3 text-center text-[11px] font-semibold text-emerald-400">
              Daily report submitted — sent to your manager.
            </p>
          )}
        </section>
      </div>

      {/* My Daily Reports */}
      <section className={`mt-4 rounded-2xl border p-4 sm:p-5 ${panel}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-sm font-bold ${heading}`}>My Daily Reports ({groupedEntries.length})</h3>
        </div>
        {groupedEntries.length > 0 ? (
          <div className="flex flex-col gap-2">{groupedEntries.map(renderGroup)}</div>
        ) : (
          <div className={`py-8 text-center text-xs ${muted}`}>
            <CalendarDays className="mx-auto h-7 w-7 text-violet-400" />
            <p className="mt-2 font-semibold">No daily reports in this period yet</p>
            <p className="mt-1">Log your work on the left and hit Submit when you're done.</p>
          </div>
        )}
      </section>

      {/* Work report */}
      <section className={`mt-4 rounded-2xl border p-4 sm:p-5 ${panel}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-sm font-bold ${heading}`}>Work Report ({stats.total})</h3>
          <span className={`text-[10px] ${muted}`}>Your work orders</span>
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

      {/* Issues report */}
      <section className={`mt-4 rounded-2xl border p-4 sm:p-5 ${panel}`}>
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
  );
}