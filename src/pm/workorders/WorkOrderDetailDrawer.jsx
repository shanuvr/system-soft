import {
  X,
  Clock,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { PriorityBadge, WoStatusBadge } from '../badges.jsx';
import { useApp } from '../../data/context.js';

export default function WorkOrderDetailDrawer({
  workOrderId,
  dark,
  onClose,
}) {
  const {
    db,
    currentUser,
    deleteWorkOrder,
  } = useApp();

  const wo = db.workOrders.find((w) => w.id === workOrderId);
  if (!wo) return null;

  const project = db.projects.find((p) => p.id === wo.projectId);
  const assignee = db.users.find((u) => u.id === wo.assignee);

  const isPm = currentUser?.role === 'pm' || currentUser?.role === 'admin';


  const remainingHours = Math.max(0, (wo.estimatedHours || 0) - (wo.actualHours || 0));

  const borderCls = dark ? 'border-zinc-800' : 'border-zinc-200';
  const bgPanel = dark ? 'bg-zinc-900/95 text-zinc-100' : 'bg-white text-zinc-800';
  const mutedText = dark ? 'text-zinc-400' : 'text-zinc-500';
  const headingText = dark ? 'text-zinc-100' : 'text-zinc-800';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className={`flex h-full w-full max-w-2xl flex-col shadow-2xl transition-all ${bgPanel}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${borderCls}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
                  {wo.id}
                </span>
                <WoStatusBadge status={wo.status} />
                <PriorityBadge priority={wo.priority} />
              </div>
              <h2 className={`mt-1 text-lg font-bold truncate leading-tight ${headingText}`}>
                {wo.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPm && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${wo.title}"?`)) {
                    deleteWorkOrder(wo.id);
                    onClose();
                  }
                }}
                className={`rounded-lg p-2 transition-colors cursor-pointer text-zinc-400 hover:text-red-400 ${
                  dark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                }`}
                title="Delete Work Order"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors cursor-pointer ${
                dark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Close [Esc]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body — single scrollable view, no tabs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`rounded-xl border p-3 ${borderCls}`}>
              <span className={`text-[11px] font-medium ${mutedText}`}>Project</span>
              <div className={`mt-1 font-semibold text-xs truncate ${headingText}`}>
                {project?.name || '—'}
              </div>
            </div>
            <div className={`rounded-xl border p-3 ${borderCls}`}>
              <span className={`text-[11px] font-medium ${mutedText}`}>Assignee</span>
              <div className={`mt-1 font-semibold text-xs truncate ${headingText}`}>
                {assignee?.name || 'Unassigned'}
              </div>
            </div>
            <div className={`rounded-xl border p-3 ${borderCls}`}>
              <span className={`text-[11px] font-medium ${mutedText}`}>Start Date</span>
              <div className={`mt-1 font-semibold text-xs tabular-nums ${headingText}`}>
                {wo.startDate || '—'}
              </div>
            </div>
            <div className={`rounded-xl border p-3 ${borderCls}`}>
              <span className={`text-[11px] font-medium ${mutedText}`}>Due Date</span>
              <div className={`mt-1 font-semibold text-xs tabular-nums ${headingText}`}>
                {wo.dueDate || '—'}
              </div>
            </div>
          </div>

          {/* Hours Summary */}
          <div className={`rounded-2xl border p-4.5 ${borderCls}`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-violet-500" />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                Time Tracking
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl border p-3 text-center ${borderCls}`}>
                <span className={`text-[11px] ${mutedText}`}>Estimated</span>
                <div className={`mt-1 text-xl font-bold tabular-nums ${headingText}`}>
                  {wo.estimatedHours || 0}h
                </div>
              </div>
              <div className={`rounded-xl border p-3 text-center ${borderCls}`}>
                <span className={`text-[11px] ${mutedText}`}>Logged</span>
                <div className="mt-1 text-xl font-bold tabular-nums text-violet-500">
                  {wo.actualHours || 0}h
                </div>
              </div>
              <div className={`rounded-xl border p-3 text-center ${borderCls}`}>
                <span className={`text-[11px] ${mutedText}`}>Remaining</span>
                <div className={`mt-1 text-xl font-bold tabular-nums ${headingText}`}>
                  {remainingHours}h
                </div>
              </div>
            </div>
          </div>

          {/* Work Progress — read-only on PM side; set by the assigned developer */}
          <div className={`rounded-2xl border p-4.5 ${borderCls}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                  Work Progress
                </h4>
              </div>
              <span className="text-sm font-bold text-violet-500 tabular-nums">
                {wo.progress ?? 0}%
              </span>
            </div>

            <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
              <div
                className={`h-full rounded-full transition-all ${
                  (wo.progress ?? 0) >= 100
                    ? 'bg-emerald-500'
                    : (wo.progress ?? 0) >= 50
                    ? 'bg-violet-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${wo.progress ?? 0}%` }}
              />
            </div>

            <p className={`mt-2.5 text-[11px] ${mutedText}`}>
              Updated by {assignee?.name || 'the assigned developer'} as work proceeds.
            </p>
          </div>

          {/* Description */}
          <div className={`rounded-2xl border p-4.5 ${borderCls}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
              Description & Requirements
            </h4>
            <p className={`mt-2 text-sm leading-relaxed ${headingText}`}>
              {wo.description || 'No detailed description provided.'}
            </p>
          </div>


          {/* Dependencies Section */}
          {wo.dependencies && wo.dependencies.length > 0 && (
            <div className={`rounded-2xl border p-4.5 ${borderCls}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                Dependencies (Work Orders this task relies on)
              </h4>
              <div className="mt-3 space-y-2">
                {wo.dependencies.map((depId) => {
                  const dep = db.workOrders.find((w) => w.id === depId);
                  return (
                    <div
                      key={depId}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs ${borderCls}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-violet-500">{depId}</span>
                        <span className={`font-medium ${headingText}`}>
                          {dep?.title || 'External task'}
                        </span>
                      </div>
                      {dep && <WoStatusBadge status={dep.status} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
