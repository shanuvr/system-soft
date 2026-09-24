import { useState } from 'react';
import { FileText, FolderOpen, Tag, Upload, X } from 'lucide-react';
import { useApp } from '../../data/context.js';

const FILE_TYPES = [
  'Logo',
  'Business Card',
  'Order Document',
  'Verification',
  'Photo',
  'Video',
  'Documentation',
  'Design',
  'Build / Deliverable',
  'Other',
];

export default function DevFileUploadModal({ dark, onClose, onAdded, orders = [], initialOrderId = '' }) {
  const { currentUser } = useApp();

  const [name, setName] = useState('');
  const [orderId, setOrderId] = useState(initialOrderId || orders[0]?.id || '');
  const [type, setType] = useState('Logo');

  const order = orders.find((o) => o.id === orderId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !orderId) return;
    onAdded?.({
      id: `up-${Date.now()}`,
      name: name.trim(),
      type,
      orderId,
      client: order?.client || '',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedBy: currentUser?.name || 'You',
    });
    onClose();
  };

  const bgPanel = dark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-800';
  const borderCls = dark ? 'border-zinc-800' : 'border-zinc-200';
  const mutedText = dark ? 'text-zinc-400' : 'text-zinc-500';
  const headingText = dark ? 'text-zinc-100' : 'text-zinc-800';
  const inputBg = dark
    ? 'bg-zinc-850 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-500'
    : 'bg-white border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:border-zinc-500';
  const inputCls = `w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-all ${inputBg}`;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${bgPanel} ${borderCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${dark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-700'}`}>
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${headingText}`}>Upload Document</h3>
              <p className={`text-xs ${mutedText}`}>Add a new file to an order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl p-1.5 ${dark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'} cursor-pointer`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${headingText}`}>
              <FileText className="h-3.5 w-3.5 text-zinc-500" /> File Name *
            </label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nova Finance Logo.png"
              className={inputCls}
            />
          </div>

          <div>
            <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${headingText}`}>
              <FolderOpen className="h-3.5 w-3.5 text-zinc-500" /> Order *
            </label>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputCls}>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.ref} — {o.client}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${headingText}`}>
              <Tag className="h-3.5 w-3.5 text-zinc-500" /> File Type
            </label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${dark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-600'} cursor-pointer`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Add Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}