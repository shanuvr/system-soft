import { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Check,
  RotateCcw,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  FileText,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { PriorityBadge, WoStatusBadge } from '../pm/badges.jsx';
import { useApp } from '../data/context.js';

const BLOCKER_TYPES = [
  'Waiting for file',
  'Waiting for clarification',
  'Technical issue',
  'Dependency',
  'Client requirement',
  'Access problem',
  'Other',
];

export default function WorkOrderDetailDrawer({
  workOrderId,
  dark,
  onClose,
}) {
  const {
    db,
    currentUser,
    updateWorkOrderStatus,
    toggleWorkOrderChecklist,
    addWorkOrderChecklistItem,
    deleteWorkOrderChecklistItem,
    addWorkOrderComment,
    submitWorkOrderForReview,
    reviewWorkOrder,
    raiseBlocker,
    resolveBlocker,
    logHours,
    addWorkOrderFile,
    requestWorkOrderFile,
    deleteWorkOrder,
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'time' | 'review' | 'blockers' | 'comments' | 'files'

  // Input states
  const [newChecklistText, setNewChecklistText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [logHoursInput, setLogHoursInput] = useState('');
  const [logHoursNote, setLogHoursNote] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('approved'); // 'approved' | 'changes-requested'
  const [reviewFeedbackNote, setReviewFeedbackNote] = useState('');

  // Submit Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNote, setSubmitNote] = useState('');

  // Blocker Form State
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [blockerDesc, setBlockerDesc] = useState('');
  const [blockerType, setBlockerType] = useState('Waiting for file');
  const [blockerPriority, setBlockerPriority] = useState('high');

  // File Request Form State
  const [showFileReqForm, setShowFileReqForm] = useState(false);
  const [reqFileName, setReqFileName] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqFrom, setReqFrom] = useState('u1');
  const [reqDate, setReqDate] = useState('');

  const wo = db.workOrders.find((w) => w.id === workOrderId);
  if (!wo) return null;

  const project = db.projects.find((p) => p.id === wo.projectId);
  const ptd = db.ptds.find((p) => p.id === wo.ptdId);
  const assignee = db.users.find((u) => u.id === wo.assignee);
  const woBlockers = (db.blockers || []).filter((b) => b.workOrderId === wo.id);
  const activeBlockers = woBlockers.filter((b) => b.status === 'open');

  const isPm = currentUser?.role === 'pm' || currentUser?.role === 'admin';

  const checklist = wo.checklist || [];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistTotal = checklist.length;
  const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const remainingHours = Math.max(0, (wo.estimatedHours || 0) - (wo.actualHours || 0));

  const borderCls = dark ? 'border-zinc-800' : 'border-zinc-200';
  const bgPanel = dark ? 'bg-zinc-900/95 text-zinc-100' : 'bg-white text-zinc-800';
  const mutedText = dark ? 'text-zinc-400' : 'text-zinc-500';
  const headingText = dark ? 'text-zinc-100' : 'text-zinc-800';
  const inputBg = dark
    ? 'bg-zinc-850 border-zinc-700 text-white placeholder-zinc-500 focus:border-violet-500'
    : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-violet-500';

  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addWorkOrderChecklistItem(wo.id, newChecklistText);
    setNewChecklistText('');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addWorkOrderComment(wo.id, commentText);
    setCommentText('');
  };

  const handleLogHours = (e) => {
    e.preventDefault();
    const hrs = Number(logHoursInput);
    if (!hrs || hrs <= 0) return;
    logHours(wo.id, hrs, logHoursNote);
    setLogHoursInput('');
    setLogHoursNote('');
  };

  const handleRaiseBlocker = (e) => {
    e.preventDefault();
    if (!blockerDesc.trim()) return;
    raiseBlocker({
      description: blockerDesc,
      projectId: wo.projectId,
      workOrderId: wo.id,
      developerId: currentUser?.id || wo.assignee,
      priority: blockerPriority,
      type: blockerType,
    });
    setBlockerDesc('');
    setShowBlockerForm(false);
  };

  const handleRequestFile = (e) => {
    e.preventDefault();
    if (!reqFileName.trim()) return;
    requestWorkOrderFile(wo.id, {
      fileName: reqFileName,
      reason: reqReason,
      requestedFrom: reqFrom,
      requiredDate: reqDate,
    });
    setReqFileName('');
    setReqReason('');
    setShowFileReqForm(false);
  };

  const handleExecuteReview = () => {
    reviewWorkOrder(wo.id, reviewDecision, reviewFeedbackNote);
    setShowReviewModal(false);
    setReviewFeedbackNote('');
  };

  const handleExecuteSubmit = () => {
    submitWorkOrderForReview(wo.id, submitNote);
    setShowSubmitModal(false);
    setSubmitNote('');
  };

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
                  {wo.id.toUpperCase()}
                </span>
                <WoStatusBadge status={wo.status} />
                <PriorityBadge priority={wo.priority} />
                {ptd && (
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      dark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {ptd.ref || ptd.name}
                  </span>
                )}
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

        {/* Workflow Action Bar */}
        <div
          className={`flex items-center justify-between gap-3 border-b px-6 py-2.5 backdrop-blur-md ${
            dark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-medium ${mutedText}`}>Status Action:</span>
            {wo.status === 'not-started' && (
              <button
                onClick={() => updateWorkOrderStatus(wo.id, 'in-progress')}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-all cursor-pointer hover:bg-amber-400 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start Work
              </button>
            )}

            {wo.status === 'in-progress' && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-violet-500 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for Review
              </button>
            )}

            {wo.status === 'submitted-review' && (
              <>
                {isPm ? (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer hover:opacity-90 shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Review Work Order
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-400">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    Awaiting PM Review
                  </span>
                )}
              </>
            )}

            {wo.status === 'changes-requested' && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-all cursor-pointer hover:bg-orange-400 shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Re-submit for Review
              </button>
            )}

            {wo.status === 'completed' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Check className="h-4 w-4" />
                Completed & Verified
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('time');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                dark
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              Log Hours
            </button>

            <button
              onClick={() => {
                setActiveTab('blockers');
                setShowBlockerForm(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors cursor-pointer hover:bg-red-500/25 border border-red-500/20"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Raise Blocker
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1 border-b px-6 overflow-x-auto ${borderCls}`}>
          {[
            { id: 'overview', label: 'Overview & Checklist', icon: CheckCircle2 },
            { id: 'time', label: `Time Logs (${wo.actualHours || 0}h)`, icon: Clock },
            { id: 'review', label: `Reviews (${wo.reviewHistory?.length || 0})`, icon: ShieldAlert },
            { id: 'blockers', label: `Blockers (${activeBlockers.length})`, icon: AlertTriangle, alert: activeBlockers.length > 0 },
            { id: 'comments', label: `Comments (${wo.comments?.length || 0})`, icon: MessageSquare },
            { id: 'files', label: `Files (${wo.files?.length || 0})`, icon: Paperclip },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-500'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${tab.alert ? 'text-red-400 animate-pulse' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & CHECKLIST */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
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

              {/* Description */}
              <div className={`rounded-2xl border p-4.5 ${borderCls}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                  Description & Requirements
                </h4>
                <p className={`mt-2 text-sm leading-relaxed ${headingText}`}>
                  {wo.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Interactive Checklist Section */}
              <div className={`rounded-2xl border p-5 ${borderCls}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-500" />
                    <h4 className={`text-sm font-bold ${headingText}`}>Execution Checklist</h4>
                  </div>
                  <span className={`text-xs font-medium tabular-nums ${mutedText}`}>
                    {checklistDone} of {checklistTotal} done ({checklistPct}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  className={`mb-4 h-1.5 w-full overflow-hidden rounded-full ${
                    dark ? 'bg-zinc-800' : 'bg-zinc-200'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${checklistPct}%` }}
                  />
                </div>

                {/* Checklist items list */}
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        item.done
                          ? dark
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-emerald-200 bg-emerald-50/50'
                          : borderCls
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 select-none">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleWorkOrderChecklist(wo.id, item.id)}
                          className="h-4 w-4 rounded accent-violet-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs font-medium truncate ${
                            item.done
                              ? 'line-through text-zinc-400'
                              : headingText
                          }`}
                        >
                          {item.title}
                        </span>
                      </label>

                      <button
                        onClick={() => deleteWorkOrderChecklistItem(wo.id, item.id)}
                        className={`rounded p-1 transition-colors text-zinc-400 hover:text-red-400 cursor-pointer`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {checklist.length === 0 && (
                    <p className={`py-4 text-center text-xs ${mutedText}`}>
                      No checklist items added yet.
                    </p>
                  )}
                </div>

                {/* Add Checklist Item Form */}
                <form onSubmit={handleAddChecklist} className="mt-3 flex gap-2">
                  <input
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Add a new checklist task..."
                    className={`flex-1 rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${inputBg}`}
                  />
                  <button
                    type="submit"
                    disabled={!newChecklistText.trim()}
                    className="flex items-center gap-1 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </form>
              </div>

              {/* Dependencies Section (Section 15) */}
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
                            <span className="font-bold text-violet-500">{depId.toUpperCase()}</span>
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
          )}

          {/* TAB 2: TIME TRACKING & LOGS (Section 12) */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              {/* Hours Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl border p-3.5 text-center ${borderCls}`}>
                  <span className={`text-xs ${mutedText}`}>Estimated</span>
                  <div className={`mt-1 text-2xl font-bold tabular-nums ${headingText}`}>
                    {wo.estimatedHours}h
                  </div>
                </div>
                <div className={`rounded-xl border p-3.5 text-center ${borderCls}`}>
                  <span className={`text-xs ${mutedText}`}>Logged / Used</span>
                  <div className="mt-1 text-2xl font-bold tabular-nums text-violet-500">
                    {wo.actualHours || 0}h
                  </div>
                </div>
                <div className={`rounded-xl border p-3.5 text-center ${borderCls}`}>
                  <span className={`text-xs ${mutedText}`}>Remaining</span>
                  <div className={`mt-1 text-2xl font-bold tabular-nums ${headingText}`}>
                    {remainingHours}h
                  </div>
                </div>
              </div>

              {/* Quick Log Hours Form */}
              <div className={`rounded-2xl border p-5 ${borderCls}`}>
                <h4 className={`text-sm font-bold ${headingText} flex items-center gap-2 mb-3`}>
                  <Clock className="h-4 w-4 text-violet-500" />
                  Record Work Time
                </h4>
                <form onSubmit={handleLogHours} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                        Hours to Log
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        value={logHoursInput}
                        onChange={(e) => setLogHoursInput(e.target.value)}
                        placeholder="e.g. 3.5"
                        required
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                        Work Note / Summary
                      </label>
                      <input
                        type="text"
                        value={logHoursNote}
                        onChange={(e) => setLogHoursNote(e.target.value)}
                        placeholder="e.g. Implemented OAuth token refresh..."
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-violet-500 shadow-md"
                  >
                    Log Time to Work Order
                  </button>
                </form>
              </div>

              {/* Recent Activity for this Work Order */}
              <div className={`rounded-2xl border p-4.5 ${borderCls}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedText} mb-3`}>
                  Related Activity Feed
                </h4>
                <div className="space-y-3">
                  {(db.activity || [])
                    .filter((a) => a.text?.includes(wo.title) || a.projectId === wo.projectId)
                    .slice(0, 6)
                    .map((a) => (
                      <div key={a.id} className="flex items-start gap-2.5 text-xs">
                        <span className={`tabular-nums shrink-0 mt-0.5 ${mutedText}`}>{a.time}</span>
                        <div className="min-w-0">
                          <strong className={headingText}>{a.actor}</strong>{' '}
                          <span className={mutedText}>{a.text}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEW HISTORY (Section 13) */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-bold ${headingText}`}>Review Audit History</h4>
                {wo.status === 'submitted-review' && isPm && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-violet-500"
                  >
                    Review Now
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(wo.reviewHistory || []).map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      entry.decision === 'approved'
                        ? dark
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-emerald-200 bg-emerald-50'
                        : entry.decision === 'changes-requested'
                        ? dark
                          ? 'border-orange-500/30 bg-orange-500/5'
                          : 'border-orange-200 bg-orange-50'
                        : borderCls
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{entry.reviewer}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            entry.decision === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : entry.decision === 'changes-requested'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-violet-500/20 text-violet-400'
                          }`}
                        >
                          {entry.decision.replace('-', ' ')}
                        </span>
                      </div>
                      <span className={`text-[11px] tabular-nums ${mutedText}`}>{entry.date}</span>
                    </div>
                    <p className={`text-xs ${headingText} mt-1`}>{entry.note}</p>
                  </div>
                ))}

                {(!wo.reviewHistory || wo.reviewHistory.length === 0) && (
                  <div className={`py-12 text-center text-xs ${mutedText}`}>
                    No review records yet. When submitted for review, feedback and approvals will be logged here.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BLOCKERS (Section 14) */}
          {activeTab === 'blockers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-bold ${headingText}`}>Blocker Management</h4>
                <button
                  onClick={() => setShowBlockerForm((s) => !s)}
                  className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-red-500 flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {showBlockerForm ? 'Cancel' : 'Report New Blocker'}
                </button>
              </div>

              {/* Blocker Form */}
              {showBlockerForm && (
                <form
                  onSubmit={handleRaiseBlocker}
                  className={`rounded-2xl border p-4.5 space-y-3 ${
                    dark ? 'border-red-500/30 bg-red-500/5' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    Raise Issue / Blocker
                  </h5>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                      Blocker Type
                    </label>
                    <select
                      value={blockerType}
                      onChange={(e) => setBlockerType(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                    >
                      {BLOCKER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                      Description & Impact
                    </label>
                    <textarea
                      rows={2}
                      value={blockerDesc}
                      onChange={(e) => setBlockerDesc(e.target.value)}
                      placeholder="What is preventing you from completing this work order?"
                      required
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Priority</label>
                    <select
                      value={blockerPriority}
                      onChange={(e) => setBlockerPriority(e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                    >
                      <option value="high">High (Immediate blocker)</option>
                      <option value="medium">Medium (Partial impediment)</option>
                      <option value="low">Low (Minor inconvenience)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-red-500"
                  >
                    Submit Blocker Alert
                  </button>
                </form>
              )}

              {/* Blockers list */}
              <div className="space-y-3">
                {woBlockers.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-2xl border p-4 ${
                      b.status === 'open'
                        ? 'border-red-500/30 bg-red-500/10'
                        : dark
                        ? 'border-zinc-800 bg-zinc-900/40 opacity-70'
                        : 'border-zinc-200 bg-zinc-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            b.status === 'open'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className={`text-[11px] font-semibold ${mutedText}`}>
                          {b.type || 'Blocker'}
                        </span>
                      </div>
                      <span className={`text-[11px] tabular-nums ${mutedText}`}>
                        Raised: {b.dateRaised}
                      </span>
                    </div>

                    <p className={`mt-2 text-xs font-medium ${headingText}`}>{b.description}</p>

                    {b.status === 'open' && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => resolveBlocker(b.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer hover:bg-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark as Resolved
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {woBlockers.length === 0 && (
                  <div className={`py-12 text-center text-xs ${mutedText}`}>
                    No blockers reported on this work order.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: COMMENTS / DISCUSSION (Section 9) */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <h4 className={`text-sm font-bold ${headingText}`}>Work Order Discussion</h4>

              <div className="space-y-3">
                {(wo.comments || []).map((cm) => (
                  <div key={cm.id} className={`rounded-2xl border p-3.5 ${borderCls}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-violet-400">{cm.author}</span>
                      <span className={`text-[10px] tabular-nums ${mutedText}`}>{cm.time}</span>
                    </div>
                    <p className={`text-xs ${headingText}`}>{cm.text}</p>
                  </div>
                ))}

                {(!wo.comments || wo.comments.length === 0) && (
                  <p className={`py-8 text-center text-xs ${mutedText}`}>
                    No comments yet. Start a discussion below!
                  </p>
                )}
              </div>

              {/* Comment input form */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type a comment or question..."
                  className={`flex-1 rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-violet-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Post
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: FILES & FILE REQUESTS (Section 10 & 11) */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-bold ${headingText}`}>Attached Files</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const name = prompt('Enter mockup file name (e.g. api-spec.pdf):');
                      if (name) addWorkOrderFile(wo.id, { name, size: '420 KB' });
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                      dark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    + Attach File
                  </button>
                  <button
                    onClick={() => setShowFileReqForm((s) => !s)}
                    className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-violet-500"
                  >
                    Request Missing File
                  </button>
                </div>
              </div>

              {/* File Request Form */}
              {showFileReqForm && (
                <form
                  onSubmit={handleRequestFile}
                  className={`rounded-2xl border p-4 space-y-3 ${
                    dark ? 'border-violet-500/30 bg-violet-500/5' : 'border-violet-200 bg-violet-50'
                  }`}
                >
                  <h5 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    Create Formal File Request
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                        File Name / Description
                      </label>
                      <input
                        value={reqFileName}
                        onChange={(e) => setReqFileName(e.target.value)}
                        placeholder="e.g. Payment Gateway API Specs.pdf"
                        required
                        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                        Request From
                      </label>
                      <select
                        value={reqFrom}
                        onChange={(e) => setReqFrom(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                      >
                        {db.users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.title})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                        Reason / Context
                      </label>
                      <input
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                        placeholder="Why is this document needed for completion?"
                        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>
                        Required By Date
                      </label>
                      <input
                        type="date"
                        value={reqDate}
                        onChange={(e) => setReqDate(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${inputBg}`}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-violet-500"
                  >
                    Send File Request
                  </button>
                </form>
              )}

              {/* Files list */}
              <div className="space-y-2">
                {(wo.files || []).map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between rounded-xl border p-3 ${borderCls}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${headingText}`}>{f.name}</div>
                        <div className={`text-[10px] ${mutedText}`}>
                          {f.size} · Uploaded by {f.uploadedBy} on {f.date}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Simulated download for "${f.name}"`)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        dark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-200 hover:bg-zinc-300'
                      }`}
                    >
                      View
                    </button>
                  </div>
                ))}

                {(!wo.files || wo.files.length === 0) && (
                  <div className={`py-8 text-center text-xs ${mutedText}`}>
                    No files attached to this work order.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT FOR REVIEW MODAL */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${bgPanel} ${borderCls}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-base font-bold ${headingText}`}>Submit Work for Review</h3>
            <p className={`mt-1 text-xs ${mutedText}`}>
              Provide completion notes or pull request links for the Project Manager.
            </p>
            <textarea
              rows={3}
              value={submitNote}
              onChange={(e) => setSubmitNote(e.target.value)}
              placeholder="e.g. All unit tests passing, ready for review."
              className={`mt-4 w-full rounded-xl border p-3 text-xs outline-none ${inputBg}`}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className={`rounded-xl px-4 py-2 text-xs font-medium cursor-pointer ${
                  dark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSubmit}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-violet-500"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW DECISION MODAL (PM Quality Gate) */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${bgPanel} ${borderCls}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-base font-bold ${headingText}`}>Project Manager Review</h3>
            <p className={`mt-1 text-xs ${mutedText}`}>
              Evaluate the submitted work order and select a decision.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setReviewDecision('approved')}
                className={`flex-1 rounded-xl border p-3 text-center text-xs font-bold transition-all cursor-pointer ${
                  reviewDecision === 'approved'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30'
                    : dark
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                }`}
              >
                ✓ Approve & Complete
              </button>
              <button
                onClick={() => setReviewDecision('changes-requested')}
                className={`flex-1 rounded-xl border p-3 text-center text-xs font-bold transition-all cursor-pointer ${
                  reviewDecision === 'changes-requested'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400 ring-2 ring-orange-500/30'
                    : dark
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                }`}
              >
                ⚠ Request Changes
              </button>
            </div>

            <textarea
              rows={3}
              value={reviewFeedbackNote}
              onChange={(e) => setReviewFeedbackNote(e.target.value)}
              placeholder={
                reviewDecision === 'approved'
                  ? 'Optional approval comments...'
                  : 'Describe the required changes/fixes...'
              }
              className={`mt-4 w-full rounded-xl border p-3 text-xs outline-none ${inputBg}`}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className={`rounded-xl px-4 py-2 text-xs font-medium cursor-pointer ${
                  dark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReview}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white cursor-pointer ${
                  reviewDecision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-orange-600 hover:bg-orange-500'
                }`}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
