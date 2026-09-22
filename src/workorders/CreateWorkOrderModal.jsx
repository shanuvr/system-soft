import { useState } from 'react';
import { X, ListTodo } from 'lucide-react';
import { useApp } from '../data/context.js';

export default function CreateWorkOrderModal({ dark, onClose, initialProjectId, initialPtdId }) {
  const { db, createSingleWorkOrder } = useApp();

  const [projectId, setProjectId] = useState(initialProjectId || db.projects[0]?.id || '');
  const availablePtds = db.ptds.filter((p) => p.projectId === projectId);
  const [ptdId, setPtdId] = useState(initialPtdId || availablePtds[0]?.id || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState(db.users.find((u) => u.role === 'dev')?.id || 'u2');
  const [priority, setPriority] = useState('medium');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const borderCls = dark ? 'border-zinc-800' : 'border-zinc-200';
  const bgPanel = dark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-800';
  const mutedText = dark ? 'text-zinc-400' : 'text-zinc-500';
  const headingText = dark ? 'text-zinc-100' : 'text-zinc-800';
  const inputBg = dark
    ? 'bg-zinc-850 border-zinc-700 text-white placeholder-zinc-500 focus:border-violet-500'
    : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-violet-500';

  const handleProjectChange = (e) => {
    const pId = e.target.value;
    setProjectId(pId);
    const relatedPtds = db.ptds.filter((p) => p.projectId === pId);
    setPtdId(relatedPtds[0]?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createSingleWorkOrder({
      title,
      description,
      projectId,
      ptdId,
      assignee,
      priority,
      startDate,
      dueDate,
      estimatedHours: Number(estimatedHours) || 0,
      progress: 0,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${bgPanel} ${borderCls} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${headingText}`}>Create Work Order</h3>
              <p className={`text-xs ${mutedText}`}>Decompose PTD into an actionable developer task</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl p-1.5 transition-colors ${
              dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
          {/* Project & PTD Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Project *</label>
              <select
                value={projectId}
                onChange={handleProjectChange}
                required
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              >
                {db.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.client})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>PTD (Technical Specification)</label>
              <select
                value={ptdId}
                onChange={(e) => setPtdId(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              >
                <option value="">None / General Task</option>
                {availablePtds.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.ref} — {pt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Work Order Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              required
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Description & Scope</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical requirements, acceptance criteria, and notes..."
              className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none ${inputBg}`}
            />
          </div>

          {/* Assignee, Priority & Estimated Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Assignee *</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                required
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              >
                {db.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Estimated Hours</label>
              <input
                type="number"
                step="1"
                min="1"
                max="500"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${headingText}`}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${inputBg}`}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer ${
                dark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer hover:bg-violet-500 shadow-md shadow-violet-600/30"
            >
              Create Work Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
