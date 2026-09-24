import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Search } from 'lucide-react';
import { useApp } from '../../data/context.js';

const TYPE_LABELS = {
  review: 'Submitted for review',
  approval: 'Approved',
  changes: 'Changes requested',
  issue: 'Issue',
  hours: 'Hours logged',
  assignment: 'Work order',
  status: 'Status update',
};

function fmtGroupLabel(date) {
  if (!date) return 'Unknown';
  const t = new Date(`${date}T00:00:00`);
  const today = new Date();
  const tStr = t.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  if (tStr === todayStr) return 'Today';
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (tStr === yest.toISOString().slice(0, 10)) return 'Yesterday';
  return date;
}

export default function DevNotifications({ dark }) {
  const { db, markNotificationRead, markAllNotificationsRead } = useApp();

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const projectsById = useMemo(
    () => Object.fromEntries((db.projects || []).map((p) => [p.id, p])),
    [db.projects],
  );

  const notifications = useMemo(() => {
    const all = (db.notifications || []).slice();
    return all.sort((a, b) => `${b.date || ''}${b.time || ''}`.localeCompare(`${a.date || ''}${a.time || ''}`));
  }, [db.notifications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      if (tab === 'unread' && n.read) return false;
      if (q && !n.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [notifications, tab, query]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((n) => {
      const key = fmtGroupLabel(n.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    });
    return [...map.entries()];
  }, [filtered]);

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const border = dark ? 'border-zinc-800' : 'border-zinc-200';
  const rowHover = dark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50';
  const inputBg = dark
    ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-zinc-500'
    : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:border-zinc-500';

  const renderRow = (n) => {
    const project = projectsById[n.projectId];
    const type = TYPE_LABELS[n.type] || '';
    const unread = !n.read;
    return (
      <button
        key={n.id}
        onClick={() => markNotificationRead(n.id)}
        title={unread ? 'Click to mark as read' : ''}
        className={`flex w-full items-start gap-3 px-1 py-2.5 text-left transition-colors cursor-pointer ${rowHover}`}
      >
        <span className={`w-12 shrink-0 text-[11px] tabular-nums ${unread ? heading : muted}`}>{n.time || '—'}</span>
        <div className="min-w-0 flex-1">
          <span className={`block text-xs leading-relaxed ${unread ? `font-semibold ${heading}` : muted}`}>{n.title}</span>
          <span className={`mt-0.5 block text-[10px] ${muted}`}>
            {n.date}
            {project ? ` · ${project.name}` : ''}
            {type ? ` · ${type}` : ''}
          </span>
        </div>
        {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />}
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>Notifications</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
          </p>
        </div>
        <button
          onClick={markAllNotificationsRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-40 disabled:hover:text-zinc-500 cursor-pointer"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>

      <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-2xl border p-3 ${panel}`}>
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications..."
            className={`w-full rounded-xl border pl-8 pr-2 py-1.5 text-xs outline-none ${inputBg}`}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-zinc-500/10 p-1">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                tab === t.id
                  ? dark
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'bg-zinc-900 text-white'
                  : dark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 sm:p-5 ${panel}`}>
        {groups.length > 0 ? (
          groups.map(([label, items]) => (
            <div key={label}>
              <div className={`flex items-center gap-2 px-1 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide ${muted}`}>
                {label}
                <span className={`h-px flex-1 ${border}`} />
              </div>
              <div className={`mb-2 divide-y ${border}`}>
                {items.map((n) => (
                  <div key={n.id} className={`border-b last:border-b-0 ${border}`}>
                    {renderRow(n)}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center">
            <Bell className={`mx-auto h-10 w-10 ${muted}`} />
            <p className={`mt-3 text-sm font-semibold ${heading}`}>No notifications</p>
            <p className={`mt-1 text-xs ${muted}`}>
              {tab === 'unread' ? 'You have no unread notifications.' : 'System events will appear here as a read-only log.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}