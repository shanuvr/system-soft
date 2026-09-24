import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  History,
  Minus,
  Plus,
  Send,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../data/context.js';
import { PriorityBadge, WoStatusBadge } from './badges.jsx';

function isDone(wo) {
  return wo.status === 'completed' || wo.status === 'done';
}

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function relativeDay(iso) {
  if (!iso) return '';
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return fmtDate(iso);
}

/** Group activity log entries relevant to this work order */
function getWorkOrderHistory(activity, workOrderId, woTitle) {
  if (!activity || !woTitle) return [];
  return activity
    .filter(
      (a) =>
        a.text &&
        (a.text.includes(`"${woTitle}"`) || a.text.includes(workOrderId))
    )
    .slice(0, 20);
}

/** Extract hours from activity text like 'logged 4h on "Title"' */
function extractHours(text) {
  const m = text.match(/logged\s+([\d.]+)\s*h/i);
  return m ? parseFloat(m[1]) : null;
}

/** Build a per-day summary from activity entries */
function buildDailySummary(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!e.date) continue;
    if (!byDate[e.date]) byDate[e.date] = { hours: 0, entries: [] };
    const hrs = extractHours(e.text);
    if (hrs) byDate[e.date].hours += hrs;
    byDate[e.date].entries.push(e);
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ date, ...data }));
}

export default function DevWorkOrderDetail({ wo, project, currentUser, dark, onBack }) {
  const { logHours, updateWorkOrder, submitWorkOrderForReview, updateWorkOrderStatus } = useApp();
  const { db } = useApp();

  const left = daysUntil(wo.dueDate);
  const overdue = !isDone(wo) && left !== null && left < 0;
  const progress = Math.min(100, Math.max(0, wo.progress ?? 0));
  const remaining = Math.max(0, (wo.estimatedHours || 0) - (wo.actualHours || 0));
  const budgetUsedPct = wo.estimatedHours
    ? Math.min(100, Math.round(((wo.actualHours || 0) / wo.estimatedHours) * 100))
    : 0;
  const overBudget = (wo.actualHours || 0) > (wo.estimatedHours || 0);

  // Daily Work Log state
  const [hoursToday, setHoursToday] = useState(0);
  const [newProgress, setNewProgress] = useState(progress);
  const [note, setNote] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);

  // History from activity feed
  const history = useMemo(
    () => getWorkOrderHistory(db.activity || [], wo.id, wo.title),
    [db.activity, wo.id, wo.title],
  );
  const dailySummary = useMemo(() => buildDailySummary(history), [history]);

  const handleLogHours = () => {
    if (hoursToday > 0) {
      logHours(wo.id, hoursToday, note.trim());
    }
    if (newProgress !== progress) {
      updateWorkOrder(wo.id, { progress: newProgress });
    }
    if (hoursToday > 0 || newProgress !== progress) {
      setLogSuccess(true);
      setHoursToday(0);
      setNote('');
      setTimeout(() => setLogSuccess(false), 3000);
    }
  };

  const handleSubmitReview = () => {
    submitWorkOrderForReview(wo.id, 'Ready for review');
  };

  const handleStartWork = () => {
    updateWorkOrderStatus(wo.id, 'in-progress');
  };

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const cardBorder = dark ? 'border-zinc-800' : 'border-zinc-200';
  const heading = dark ? 'text-zinc-100' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';
  const inputBg = dark
    ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-violet-500'
    : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:border-violet-500';
  const historyPanel = dark
    ? 'border-zinc-800 bg-zinc-950/60'
    : 'border-zinc-200 bg-zinc-50/80';

  return (
    <div className={`overflow-hidden rounded-2xl border ${panel}`}>
      {/* Detail header */}
      <div className={`flex items-center justify-between border-b px-4 py-3 sm:px-5 ${cardBorder}`}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-400 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> All work orders
        </button>
        <span className="flex items-center gap-2">
          {overdue && (
            <span className="flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}
          <WoStatusBadge status={wo.status} />
          <PriorityBadge priority={wo.priority} />
        </span>
      </div>

      {/* Main content: Two-column layout */}
      <div className="flex flex-col xl:flex-row">
        {/* Left side: Work order details + Daily Work Log */}
        <div className="flex-1 space-y-5 p-4 sm:p-5 min-w-0">
          {/* Title + meta */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-violet-500 uppercase">{wo.id}</span>
            </div>
            <h2 className={`mt-1 text-base font-bold leading-tight ${heading}`}>{wo.title}</h2>
            <p className={`mt-1 text-xs leading-relaxed ${muted}`}>
              {wo.description || 'No description provided.'}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`rounded-xl border p-3 ${cardBorder}`}>
              <span className={`text-[11px] ${muted}`}>Project</span>
              <div className={`mt-0.5 truncate text-xs font-semibold ${heading}`}>{project?.name || '—'}</div>
            </div>
            <div className={`rounded-xl border p-3 ${cardBorder}`}>
              <span className={`flex items-center gap-1 text-[11px] ${muted}`}>
                <UserIcon className="h-3 w-3" /> Assignee
              </span>
              <div className={`mt-0.5 truncate text-xs font-semibold ${heading}`}>{currentUser?.name || 'You'}</div>
            </div>
            <div className={`rounded-xl border p-3 ${cardBorder}`}>
              <span className={`text-[11px] ${muted}`}>Start Date</span>
              <div className={`mt-0.5 text-xs font-semibold tabular-nums ${heading}`}>{wo.startDate || '—'}</div>
            </div>
            <div className={`rounded-xl border p-3 ${cardBorder}`}>
              <span className={`text-[11px] ${muted}`}>Due Date</span>
              <div className={`mt-0.5 text-xs font-semibold tabular-nums ${overdue ? 'text-red-400' : heading}`}>
                {wo.dueDate || '—'}
              </div>
            </div>
          </div>

          {/* Progress — bidirectional */}
          <div className={`rounded-xl border p-4 ${cardBorder}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-[11px] font-medium uppercase tracking-wide ${muted}`}>Completion</span>
              <span className="text-sm font-bold tabular-nums text-violet-500">{progress}%</span>
            </div>
            <div className={`h-2.5 w-full overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-violet-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={`mt-2 flex items-center justify-between text-[11px] ${muted}`}>
              <span>Updated by you as work proceeds.</span>
              <span className={`${progress >= 100 ? 'text-emerald-400' : ''}`}>
                {progress >= 100 ? 'Complete' : `${100 - progress}% left`}
              </span>
            </div>
          </div>

          {/* Hours budget with visual bar */}
          <div className={`rounded-xl border p-4 ${cardBorder}`}>
            <div className={`mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${muted}`}>
              <Clock className="h-3.5 w-3.5 text-violet-500" /> Man-Hour Budget
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl border p-3 text-center ${cardBorder}`}>
                <span className={`text-[11px] ${muted}`}>Allocated</span>
                <div className={`mt-1 text-lg font-bold tabular-nums ${heading}`}>{wo.estimatedHours || 0}h</div>
              </div>
              <div className={`rounded-xl border p-3 text-center ${cardBorder}`}>
                <span className={`text-[11px] ${muted}`}>Consumed</span>
                <div className={`mt-1 text-lg font-bold tabular-nums ${overBudget ? 'text-red-400' : 'text-violet-500'}`}>
                  {wo.actualHours || 0}h
                </div>
              </div>
              <div className={`rounded-xl border p-3 text-center ${cardBorder}`}>
                <span className={`text-[11px] ${muted}`}>Remaining</span>
                <div className={`mt-1 text-lg font-bold tabular-nums ${remaining <= 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                  {remaining}h
                </div>
              </div>
            </div>
            {/* Budget usage bar */}
            <div className="mt-3">
              <div className={`flex items-center justify-between text-[10px] font-medium ${muted}`}>
                <span>Budget usage</span>
                <span className={`tabular-nums ${overBudget ? 'text-red-400 font-bold' : ''}`}>
                  {budgetUsedPct}%{overBudget && ' — Over budget!'}
                </span>
              </div>
              <div className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overBudget ? 'bg-red-500' : budgetUsedPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ===== DAILY WORK LOG ===== */}
          <div className={`rounded-xl border p-4 ${cardBorder} ${isDone(wo) ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-violet-500">
                <ClipboardCheck className="h-3.5 w-3.5" /> Daily Work Log
              </div>
              <p className={`mt-1 text-[11px] ${muted}`}>
                End-of-day update. Hours you log here are deducted from your man-hour budget. You can adjust progress forward or backward.
              </p>
            </div>

            {/* Success toast */}
            {logSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Work log saved successfully! Hours have been deducted from your budget.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Hours worked today — stepper */}
              <div>
                <label className={`block text-xs font-semibold ${heading}`}>Hours worked today</label>
                <div className="relative mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHoursToday((h) => Math.max(0, +(h - 0.5).toFixed(1)))}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                      dark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hoursToday}
                    onChange={(e) => setHoursToday(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-center text-sm font-bold tabular-nums outline-none ${inputBg}`}
                  />
                  <button
                    type="button"
                    onClick={() => setHoursToday((h) => +(h + 0.5).toFixed(1))}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                      dark ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {hoursToday > 0 && (
                  <p className={`mt-1.5 text-[10px] ${muted}`}>
                    After logging: <span className="font-semibold text-violet-400">{(wo.actualHours || 0) + hoursToday}h</span> consumed
                    · <span className={`font-semibold ${remaining - hoursToday <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{Math.max(0, remaining - hoursToday)}h</span> remaining
                  </p>
                )}
              </div>

              {/* Completion slider — bidirectional */}
              <div>
                <label className={`flex items-center justify-between text-xs font-semibold ${heading}`}>
                  <span>Project completion</span>
                  <span className="flex items-center gap-1">
                    {newProgress !== progress && (
                      <span className={`text-[10px] font-normal ${newProgress > progress ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {newProgress > progress ? (
                          <TrendingUp className="inline h-3 w-3" />
                        ) : (
                          <TrendingDown className="inline h-3 w-3" />
                        )}
                        {' '}{newProgress > progress ? '+' : ''}{newProgress - progress}%
                      </span>
                    )}
                    <span className="font-bold tabular-nums text-violet-500">{newProgress}%</span>
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newProgress}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className="mt-3 w-full accent-violet-500"
                />
                <div className={`mt-1 flex justify-between text-[10px] ${muted}`}>
                  <span>0%</span>
                  <span>{newProgress < progress ? '↓ Progress decreased' : 'Slide to set completion'}</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4">
              <label className={`block text-xs font-semibold ${heading}`}>
                Note for your PM <span className={`font-normal ${muted}`}>(optional)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Finished the retry logic, moving on to the dead-letter handler..."
                className={`mt-1.5 w-full resize-none rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              />
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-[11px] ${muted}`}>
                {hoursToday > 0
                  ? `Logging ${hoursToday}h will reduce remaining budget from ${remaining}h → ${Math.max(0, remaining - hoursToday)}h`
                  : newProgress !== progress
                    ? `Progress will update from ${progress}% → ${newProgress}%`
                    : 'Set hours and/or progress, then save.'}
              </p>
              <div className="flex items-center gap-2">
                {wo.status === 'not-started' && (
                  <button
                    type="button"
                    onClick={handleStartWork}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                      dark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                    }`}
                  >
                    Start Working
                  </button>
                )}
                {wo.status === 'in-progress' && (
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                      dark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Submit for Review
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogHours}
                  disabled={hoursToday <= 0 && newProgress === progress}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all cursor-pointer ${
                    hoursToday <= 0 && newProgress === progress
                      ? 'bg-zinc-600 shadow-none opacity-50 cursor-not-allowed'
                      : 'bg-violet-600 shadow-violet-600/30 hover:bg-violet-500'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" /> Save Work Log
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDE: HISTORY PANEL ===== */}
        <div className={`w-full xl:w-80 xl:min-w-[320px] border-t xl:border-t-0 xl:border-l p-4 sm:p-5 ${historyPanel} ${cardBorder}`}>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-violet-500" />
            <h3 className={`text-sm font-bold ${heading}`}>Work Log History</h3>
          </div>

          {dailySummary.length === 0 ? (
            <div className={`py-10 text-center`}>
              <Clock className={`mx-auto h-8 w-8 ${muted}`} />
              <p className={`mt-2 text-xs font-semibold ${heading}`}>No history yet</p>
              <p className={`mt-1 text-[11px] ${muted}`}>
                Your daily logs and progress updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailySummary.map((day) => (
                <div key={day.date} className={`rounded-xl border p-3 ${cardBorder}`}>
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${heading}`}>{relativeDay(day.date)}</span>
                    {day.hours > 0 && (
                      <span className="flex items-center gap-1 rounded-lg bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-400 tabular-nums">
                        <Clock className="h-3 w-3" /> {day.hours}h
                      </span>
                    )}
                  </div>

                  {/* Day entries */}
                  <ul className="space-y-1.5">
                    {day.entries.map((e) => {
                      const hrs = extractHours(e.text);
                      const isProgress = e.text.includes('set') && e.text.includes('to');
                      return (
                        <li key={e.id} className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              hrs ? 'bg-violet-500' : isProgress ? 'bg-amber-500' : 'bg-zinc-500'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] leading-snug ${muted}`}>{e.text}</p>
                            <span className={`text-[9px] tabular-nums ${dark ? 'text-zinc-600' : 'text-zinc-400'}`}>{e.time}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Quick stats at bottom of history */}
          {history.length > 0 && (
            <div className={`mt-4 rounded-xl border p-3 ${cardBorder}`}>
              <span className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Total logged so far</span>
              <div className="mt-1.5 flex items-center justify-between">
                <div>
                  <span className={`text-xl font-bold tabular-nums ${heading}`}>{wo.actualHours || 0}h</span>
                  <span className={`ml-1 text-[11px] ${muted}`}>of {wo.estimatedHours || 0}h</span>
                </div>
                <div className={`text-right`}>
                  <div className={`text-sm font-bold tabular-nums ${remaining <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {remaining}h
                  </div>
                  <span className={`text-[10px] ${muted}`}>remaining</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}