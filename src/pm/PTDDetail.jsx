import { useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react';
import { useApp } from '../data/context.js';
import { PtdStatusBadge, PriorityBadge, WoStatusBadge } from './badges.jsx';

const inputCls = (dark) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 ${
    dark
      ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500'
      : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400'
  }`;

function emptyRow(devs) {
  return {
    title: '',
    description: '',
    estimatedHours: '',
    assignee: devs[0]?.id || '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
  };
}

function ProgressBar({ value, dark }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
      <div
        className="h-full rounded-full bg-violet-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function PTDDetail({ dark, ptdId, onBack }) {
  const { db, createWorkOrders, updatePtd } = useApp();
  const ptd = db.ptds.find((p) => p.id === ptdId);

  const [showEditor, setShowEditor] = useState(false);
  const [rows, setRows] = useState(() => [emptyRow(db.users.filter((u) => u.role === 'dev'))]);

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const rowHover = dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50';

  if (!ptd) {
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-sm text-zinc-500">PTD not found.</p>
      </div>
    );
  }

  const devs = db.users.filter((u) => u.role === 'dev');
  const usersById = Object.fromEntries(db.users.map((u) => [u.id, u]));
  const woList = db.workOrders.filter((w) => w.ptdId === ptdId);

  const remaining = (ptd.allocatedHours || 0) - (ptd.usedHours || 0);
  const batchHours = rows.reduce((s, r) => s + (Number(r.estimatedHours) || 0), 0);

  const updateRow = (i, patch) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const saveRows = () => {
    const created = createWorkOrders(ptdId, rows);
    if (created > 0) {
      setRows([emptyRow(devs)]);
      setShowEditor(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to PTDs
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={`text-2xl font-bold ${heading}`}>
            <span className="text-violet-500">{ptd.ref}</span> · {ptd.name}
          </h1>
          <PtdStatusBadge status={ptd.status} />
        </div>
        <div className="mt-3 max-w-md">
          <ProgressBar value={ptd.progress} dark={dark} />
        </div>
      </div>

      {/* Info + hours */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`rounded-2xl border p-5 lg:col-span-2 ${panel}`}>
          <h2 className={`mb-2 text-sm font-semibold ${heading}`}>Description</h2>
          <p className={`text-sm leading-relaxed ${muted}`}>{ptd.description || '—'}</p>
          <div className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${muted}`}>
            <span>
              Received: <span className={heading}>{ptd.receivedDate || '—'}</span>
            </span>
            <span>
              Deadline: <span className={heading}>{ptd.deadline || '—'}</span>
            </span>
            <span className="flex items-center gap-2">
              Project:
              <select
                className={`rounded-md border px-2 py-1 text-xs cursor-pointer ${dark ? 'border-zinc-700 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-800'}`}
                style={{ colorScheme: dark ? 'dark' : 'light' }}
                value={ptd.projectId || ''}
                onChange={(e) => updatePtd(ptdId, { projectId: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {db.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${panel}`}>
          <h2 className={`mb-3 text-sm font-semibold ${heading}`}>Man-Hours</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className={muted}>Estimated</dt>
              <dd className="tabular-nums">{ptd.estimatedHours}h</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className={muted}>Allocated</dt>
              <dd className="font-semibold text-violet-500 tabular-nums">{ptd.allocatedHours}h</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className={muted}>Used</dt>
              <dd className="tabular-nums">{ptd.usedHours}h</dd>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <dt className={muted}>Remaining</dt>
              <dd className="tabular-nums">{Math.max(0, remaining)}h</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Work orders */}
      <div className={`mt-5 rounded-2xl border ${panel}`}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className={`text-sm font-semibold ${heading}`}>
            Work Orders <span className={`text-xs font-normal ${muted}`}>({woList.length})</span>
          </h2>
          <button
            onClick={() => {
              setRows([emptyRow(devs)]);
              setShowEditor((s) => !s);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-600 cursor-pointer"
          >
            {showEditor ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showEditor ? 'Cancel' : 'Add Work Orders'}
          </button>
        </div>

        {showEditor && (
          <div className="border-b px-5 py-4">
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className={`rounded-xl border p-3 ${dark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className={`col-span-2 text-xs ${muted}`}>
                      Work order title *
                      <input
                        className={`mt-1 ${inputCls(dark)}`}
                        value={r.title}
                        onChange={(e) => updateRow(i, { title: e.target.value })}
                        placeholder="e.g. Build login page UI"
                      />
                    </label>
                    <label className={`text-xs ${muted}`}>
                      Est. man-hours
                      <input
                        type="number"
                        min="0"
                        className={`mt-1 ${inputCls(dark)}`}
                        value={r.estimatedHours}
                        onChange={(e) => updateRow(i, { estimatedHours: e.target.value })}
                        placeholder="16"
                      />
                    </label>
                    <label className={`text-xs ${muted}`}>
                      Developer
                      <select
                        className={`mt-1 ${inputCls(dark)}`}
                        value={r.assignee}
                        onChange={(e) => updateRow(i, { assignee: e.target.value })}
                      >
                        {devs.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} · {d.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={`text-xs ${muted}`}>
                      Priority
                      <select
                        className={`mt-1 ${inputCls(dark)}`}
                        value={r.priority}
                        onChange={(e) => updateRow(i, { priority: e.target.value })}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </label>
                    <label className={`text-xs ${muted}`}>
                      Start date
                      <input
                        type="date"
                        className={`mt-1 ${inputCls(dark)}`}
                        style={{ colorScheme: dark ? 'dark' : 'light' }}
                        value={r.startDate}
                        onChange={(e) => updateRow(i, { startDate: e.target.value })}
                      />
                    </label>
                    <label className={`text-xs ${muted}`}>
                      Due date
                      <input
                        type="date"
                        className={`mt-1 ${inputCls(dark)}`}
                        style={{ colorScheme: dark ? 'dark' : 'light' }}
                        value={r.dueDate}
                        onChange={(e) => updateRow(i, { dueDate: e.target.value })}
                      />
                    </label>
                    <label className={`col-span-2 text-xs ${muted}`}>
                      Description
                      <input
                        className={`mt-1 ${inputCls(dark)}`}
                        value={r.description}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                        placeholder="What does this work order involve?"
                      />
                    </label>
                    <div className="flex items-end lg:col-span-2">
                      <button
                        onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRows((prev) => [...prev, emptyRow(devs)])}
                  className="flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium text-violet-500 hover:bg-violet-500/10 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add row
                </button>
                <span className={`text-xs ${muted}`}>
                  Batch total:{' '}
                  <span className="font-semibold text-violet-500 tabular-nums">{batchHours}h</span>
                </span>
              </div>
              <button
                onClick={saveRows}
                disabled={!rows.some((r) => r.title && r.title.trim())}
                className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Save all work orders
              </button>
            </div>
          </div>
        )}

        {woList.length === 0 && !showEditor ? (
          <div className={`px-5 py-10 text-center text-sm ${muted}`}>
            No work orders yet — click "Add Work Orders" to split this PTD and assign man-hours.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`border-b text-xs uppercase tracking-wide ${muted}`}>
                <th className="px-5 py-2.5 font-medium">Work Order</th>
                <th className="px-5 py-2.5 font-medium">Assignee</th>
                <th className="px-5 py-2.5 font-medium">Est</th>
                <th className="px-5 py-2.5 font-medium">Actual</th>
                <th className="px-5 py-2.5 font-medium">Priority</th>
                <th className="px-5 py-2.5 font-medium">Due</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {woList.map((w) => (
                <tr key={w.id} className={`border-b last:border-0 transition-colors ${rowHover}`}>
                  <td className="px-5 py-3">
                    <div className={`font-medium ${heading}`}>{w.title}</div>
                    <div className={`mt-0.5 max-w-[260px] truncate text-xs ${muted}`}>
                      {w.description || '—'}
                    </div>
                  </td>
                  <td className={`px-5 py-3 ${muted}`}>{usersById[w.assignee]?.name || '—'}</td>
                  <td className="px-5 py-3 tabular-nums">{w.estimatedHours}h</td>
                  <td className="px-5 py-3 tabular-nums">{w.actualHours}h</td>
                  <td className="px-5 py-3">
                    <PriorityBadge priority={w.priority} />
                  </td>
                  <td className={`px-5 py-3 text-xs tabular-nums ${muted}`}>{w.dueDate || '—'}</td>
                  <td className="px-5 py-3">
                    <WoStatusBadge status={w.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}