import {
  AlertTriangle,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { PriorityBadge, WoStatusBadge } from '../pm/badges.jsx';

function isDone(wo) {
  return wo.status === 'completed' || wo.status === 'done';
}

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);
}

export default function DevWorkOrderDetail({ wo, project, currentUser, dark, onBack }) {
  const left = daysUntil(wo.dueDate);
  const overdue = !isDone(wo) && left !== null && left < 0;
  const progress = Math.min(100, Math.max(0, wo.progress ?? 0));
  const remaining = Math.max(0, (wo.estimatedHours || 0) - (wo.actualHours || 0));

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const cardBorder = dark ? 'border-zinc-800' : 'border-zinc-200';
  const heading = dark ? 'text-zinc-100' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-400' : 'text-zinc-500';
  const inputBg = dark
    ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-violet-500'
    : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:border-violet-500';

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

      <div className="space-y-5 p-4 sm:p-5">
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

        {/* Progress */}
        <div className={`rounded-xl border p-4 ${cardBorder}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-[11px] font-medium uppercase tracking-wide ${muted}`}>Completion</span>
            <span className="text-sm font-bold tabular-nums text-violet-500">{progress}%</span>
          </div>
          <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
            <div
              className={`h-full rounded-full transition-all ${
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

        {/* Hours summary */}
        <div className={`rounded-xl border p-4 ${cardBorder}`}>
          <div className={`mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${muted}`}>
            <Clock className="h-3.5 w-3.5 text-violet-500" /> Time Tracking
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl border p-3 text-center ${cardBorder}`}>
              <span className={`text-[11px] ${muted}`}>Estimated</span>
              <div className={`mt-1 text-lg font-bold tabular-nums ${heading}`}>{wo.estimatedHours || 0}h</div>
            </div>
            <div className={`rounded-xl border p-3 text-center ${cardBorder}`}>
              <span className={`text-[11px] ${muted}`}>Logged</span>
              <div className="mt-1 text-lg font-bold tabular-nums text-violet-500">{wo.actualHours || 0}h</div>
            </div>
            <div className={`rounded-xl border p-3 text-center ${cardBorder}`}>
              <span className={`text-[11px] ${muted}`}>Remaining</span>
              <div className={`mt-1 text-lg font-bold tabular-nums ${heading}`}>{remaining}h</div>
            </div>
          </div>
        </div>

        {/* Daily Work Log — static design only */}
        <div className={`rounded-xl border p-4 ${cardBorder}`}>
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-violet-500">
              <ClipboardCheck className="h-3.5 w-3.5" /> Daily Work Log
            </div>
            <p className={`mt-1 text-[11px] ${muted}`}>
              End-of-day update. The values you log here drive the progress bar the PM sees.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Hours worked today */}
            <div>
              <label className={`block text-xs font-semibold ${heading}`}>Hours worked today</label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  defaultValue="8"
                  className={`w-full rounded-xl border px-3.5 py-2.5 pr-9 text-sm tabular-nums outline-none ${inputBg}`}
                />
                <span className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs ${muted}`}>h</span>
              </div>
            </div>

            {/* Completion */}
            <div>
              <label className={`flex items-center justify-between text-xs font-semibold ${heading}`}>
                <span>Project completion</span>
                <span className="font-bold tabular-nums text-violet-500">{progress}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={progress}
                className="mt-3 w-full accent-violet-500"
              />
              <div className={`mt-1 flex justify-between text-[10px] ${muted}`}>
                <span>0%</span>
                <span>Work is completed so far</span>
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
              placeholder="e.g. Finished the retry logic, moving on to the dead-letter handler..."
              className={`mt-1.5 w-full resize-none rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-[11px] ${muted}`}>
              Updating this will increase the progress bar on the PM side.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" /> Log Hours
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}