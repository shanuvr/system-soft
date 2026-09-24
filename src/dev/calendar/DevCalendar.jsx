import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bug,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  Link2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../../data/context.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_META = {
  workorder: { label: 'Work order due', dot: 'bg-violet-500', chip: 'bg-violet-500/15 text-violet-400 border-violet-500/25', badge: 'text-violet-500 bg-violet-500/10 border-violet-500/25' },
  ptd: { label: 'PTD deadline', dot: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-400 border-amber-500/25', badge: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
  project: { label: 'Project deadline', dot: 'bg-sky-500', chip: 'bg-sky-500/15 text-sky-400 border-sky-500/25', badge: 'text-sky-500 bg-sky-500/10 border-sky-500/25' },
  issue: { label: 'Issue reported', dot: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-400 border-rose-500/25', badge: 'text-rose-500 bg-rose-500/10 border-rose-500/25' },
};

const DONE_STATUSES = ['completed', 'done', 'resolved', 'closed'];

function toIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtLabel(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EventDetailModal({ dark, ev, projectsById, usersById, onClose }) {
  const navigate = useNavigate();
  const meta = TYPE_META[ev.type];
  const project = ev.projectId ? projectsById[ev.projectId] : null;

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const bgPanel = dark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-800';
  const borderCls = dark ? 'border-zinc-800' : 'border-zinc-200';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';
  const heading = dark ? 'text-zinc-100' : 'text-zinc-800';

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${bgPanel} ${borderCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase ${meta.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 ${dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'} cursor-pointer`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className={`mt-3 text-sm font-bold ${heading}`}>{ev.title}</h3>

        <div className={`mt-3 space-y-1.5 text-xs ${muted}`}>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{fmtLabel(ev.date)}</span>
            {ev.done ? <span className="text-zinc-500">· done</span> : ev.overdue ? <span className="font-semibold text-rose-400">· overdue</span> : null}
          </div>
          {project && (
            <div className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span>
                {project.name} <span className="text-zinc-500">· {project.client}</span>
              </span>
            </div>
          )}
          {ev.workOrderId && (
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono">{ev.workOrderId}</span>
            </div>
          )}
          {ev.ptdRef && (
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono">{ev.ptdRef}</span>
            </div>
          )}
          {ev.status && (
            <div className="flex items-center gap-2 capitalize">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{ev.status.replaceAll('-', ' ')}</span>
            </div>
          )}
          {ev.priority && (
            <div className="flex items-center gap-2 capitalize">
              <span className="text-[10px]">Priority</span>
              <span className={ev.priority === 'critical' || ev.priority === 'high' ? 'font-semibold text-amber-400' : ''}>{ev.priority}</span>
            </div>
          )}
          {ev.assignee && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{usersById[ev.assignee]?.name || 'Unassigned'}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-4 mt-4 border-t border-zinc-800/60">
          {ev.type === 'workorder' && (
            <button
              onClick={() => goTo('/app/workorders')}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-500 cursor-pointer"
            >
              Open in Work Orders <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
          {ev.type === 'project' && (
            <button
              onClick={() => goTo('/app/projects')}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 cursor-pointer"
            >
              Open in Projects <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
          {ev.type === 'ptd' && (
            <button
              onClick={() => goTo('/app/ptds')}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-500 cursor-pointer"
            >
              Open in PTDs <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
          {ev.type === 'issue' && (
            <button
              onClick={() => goTo('/app/issues')}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
            >
              Open in Issues <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DevCalendar({ dark }) {
  const { db, currentUser } = useApp();
  const role = currentUser?.role || 'pm';
  const isPmOrAdmin = role === 'pm' || role === 'admin';

  const projectsById = useMemo(
    () => Object.fromEntries((db.projects || []).map((p) => [p.id, p])),
    [db.projects],
  );
  const usersById = useMemo(
    () => Object.fromEntries((db.users || []).map((u) => [u.id, u])),
    [db.users],
  );

  const todayIso = toIsoLocal(new Date());

  const [view, setView] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [detail, setDetail] = useState(null);

  const events = useMemo(() => {
    const map = {};
    const push = (iso, ev) => {
      const k = iso?.slice(0, 10);
      if (!k) return;
      const done = DONE_STATUSES.includes(ev.status);
      const overdue = k < todayIso && !done;
      (map[k] = map[k] || []).push({ ...ev, date: k, done, overdue });
    };

    (db.projects || [])
      .filter((p) => isPmOrAdmin || (p.team || []).includes(currentUser?.id))
      .forEach((p) => {
        if (p.dueDate) {
          push(p.dueDate, { id: `proj-${p.id}`, type: 'project', title: `${p.name} deadline`, projectId: p.id, status: p.status });
        }
      });

    (db.ptds || [])
      .filter((pt) => isPmOrAdmin || (projectsById[pt.projectId]?.team || []).includes(currentUser?.id))
      .forEach((pt) => {
        if (pt.deadline) {
          push(pt.deadline, { id: `ptd-${pt.id}`, type: 'ptd', title: `PTD ${pt.ref} — ${pt.name}`, projectId: pt.projectId, ptdRef: pt.ref, status: pt.status });
        }
      });

    (db.workOrders || [])
      .filter((w) => isPmOrAdmin || w.assignee === currentUser?.id)
      .forEach((w) => {
        if (w.dueDate) {
          push(w.dueDate, { id: `wo-${w.id}`, type: 'workorder', title: w.title, projectId: w.projectId, workOrderId: w.id, status: w.status, priority: w.priority, assignee: w.assignee });
        }
      });

    (db.issues || [])
      .filter((i) => isPmOrAdmin || i.assignedTo === currentUser?.id)
      .forEach((i) => {
        push(i.dateReported, { id: `iss-${i.id}`, type: 'issue', title: `Issue: ${i.title}`, projectId: i.projectId, status: i.status, priority: i.priority, assignee: i.assignedTo });
      });

    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.title.localeCompare(b.title)));
    return map;
  }, [db, isPmOrAdmin, currentUser, projectsById, todayIso]);

  // Month grid cells
  const monthCells = useMemo(() => {
    const offset = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const selectedEvents = (events[selectedDate] || []).slice();

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const border = dark ? 'border-zinc-800' : 'border-zinc-200';

  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDayClick = (day) => {
    const iso = toIsoLocal(day);
    setSelectedDate(iso);
  };

  const renderAgendaItem = (ev) => {
    const meta = TYPE_META[ev.type];
    const project = ev.projectId ? projectsById[ev.projectId] : null;
    return (
      <button
        key={`${ev.id}-${ev.date}`}
        onClick={() => setDetail(ev)}
        className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors cursor-pointer ${border} ${
          dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50'
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.chip}`}>
          {ev.type === 'issue' ? <Bug className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-xs font-semibold ${heading}`}>{ev.title}</span>
          <span className={`block truncate text-[10px] ${muted}`}>
            {fmtLabel(ev.date)}
            {project ? ` · ${project.name}` : ''}
            {ev.overdue ? ' · overdue' : ''}
          </span>
        </span>
        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className={`text-2xl font-bold ${heading}`}>Calendar</h1>
        <p className={`mt-1 text-xs ${muted}`}>
          A timeline of every deadline across projects, PTDs, work orders and issues{role === 'dev' ? ' assigned to you' : ''}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-[1fr_300px]">
        {/* Month view */}
        <div className={`rounded-2xl border ${panel}`}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5 border-b border-zinc-800/50">
            <h2 className={`text-sm font-bold ${heading}`}>{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                className={`rounded-lg p-1.5 ${dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'} cursor-pointer`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${dark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'} cursor-pointer`}
              >
                Today
              </button>
              <button
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                className={`rounded-lg p-1.5 ${dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'} cursor-pointer`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-5 border-b ${border} text-[10px] ${muted}`}>
            {Object.entries(TYPE_META).map(([key, m]) => (
              <span key={key} className="flex items-center gap-1.5 capitalize">
                <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.label}
              </span>
            ))}
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-zinc-800/50">
            {WEEKDAYS.map((d) => (
              <div key={d} className={`px-2 py-1.5 text-center text-[10px] font-semibold uppercase ${muted}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {monthCells.map((day) => {
              const iso = toIsoLocal(day);
              const inMonth = day.getMonth() === view.getMonth();
              const isToday = iso === todayIso;
              const isSelected = iso === selectedDate;
              const dayEvents = events[iso] || [];
              const hasOverdue = dayEvents.some((e) => e.overdue);

              return (
                <button
                  key={iso}
                  onClick={() => handleDayClick(day)}
                  className={`flex min-h-[52px] flex-col items-stretch gap-0.5 border-b border-r border-zinc-800/40 p-1 text-left transition-colors cursor-pointer sm:min-h-[60px] sm:p-1.5 ${
                    inMonth ? (dark ? 'bg-zinc-900/30 hover:bg-zinc-800/40' : 'bg-white/40 hover:bg-zinc-50') : 'opacity-40'
                  } ${
                    isSelected
                      ? dark
                        ? 'bg-zinc-800 ring-1 ring-inset ring-zinc-600'
                        : 'bg-zinc-100 ring-1 ring-inset ring-zinc-300'
                      : ''
                  }`}
                  style={{ borderLeft: inMonth && day.getDay() === 0 ? 'none' : undefined }}
                >
<span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                        isToday
                          ? dark
                            ? 'bg-zinc-200 text-zinc-900'
                            : 'bg-zinc-900 text-white'
                          : hasOverdue
                            ? 'text-rose-400'
                            : inMonth
                              ? heading
                              : muted
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className={`truncate rounded px-1 py-px text-[9px] font-medium leading-tight ${TYPE_META[ev.type].chip} ${
                            ev.done ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {ev.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className={`px-1 text-[9px] font-semibold ${muted}`}>+{dayEvents.length - 2} more</span>
                      )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected-day sidebar */}
        <div className={`rounded-2xl border p-4 ${panel} lg:sticky lg:top-0`}>
          <div className="flex items-center justify-between pb-2">
            <h3 className={`text-xs font-bold uppercase ${muted}`}>
              {selectedDate === todayIso ? 'Today' : fmtLabel(selectedDate)}
            </h3>
            {selectedDate === todayIso ? (
              <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                {selectedEvents.length} item{selectedEvents.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <button
                onClick={() => setSelectedDate(todayIso)}
                className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 cursor-pointer"
              >
                Back to today
              </button>
            )}
          </div>
          <div className="flex max-h-[calc(100vh-16rem)] flex-col gap-1.5 overflow-y-auto pr-0.5">
            {selectedEvents.length > 0 ? selectedEvents.map(renderAgendaItem) : (
              <div className={`flex flex-col items-center gap-2 py-14 text-center ${muted}`}>
                <CalendarDays className="h-6 w-6" />
                <span className="text-[11px]">Nothing scheduled this day.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <EventDetailModal
          dark={dark}
          ev={detail}
          projectsById={projectsById}
          usersById={usersById}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}