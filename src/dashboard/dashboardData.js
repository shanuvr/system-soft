import { WO_STATUS_CHART } from './chartTheme.js';

export function statusCounts(workOrders) {
  return WO_STATUS_CHART.reduce((acc, s) => {
    const count = workOrders.filter((w) => w.status === s.key).length;
    if (count > 0) acc.push({ ...s, value: count });
    return acc;
  }, []);
}

const FIXED_COLOR = '#10b981';
const OPEN_COLOR = '#f43f5e';

export function issueFixedOpenCounts(issues) {
  const all = issues || [];
  const fixed = all.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
  const stillOpen = all.length - fixed;
  const data = [];
  if (fixed > 0) data.push({ key: 'fixed', label: 'Fixed', color: FIXED_COLOR, value: fixed });
  if (stillOpen > 0) data.push({ key: 'open', label: 'Still Open', color: OPEN_COLOR, value: stillOpen });
  return data;
}

export function avgTimeToFix(issues) {
  const resolved = (issues || []).filter(
    (i) => (i.status === 'resolved' || i.status === 'closed') && i.resolvedDate && i.dateReported,
  );
  if (!resolved.length) return null;
  const days = resolved.reduce((s, i) => {
    const diff = new Date(`${i.resolvedDate}T00:00:00`).getTime() - new Date(`${i.dateReported}T00:00:00`).getTime();
    return s + Math.max(0, diff / 86400000);
  }, 0);
  return Math.round((days / resolved.length) * 10) / 10;
}

export function perProjectHours(projects, workOrders) {
  return projects.map((p) => {
    const wos = workOrders.filter((w) => w.projectId === p.id);
    return {
      name: p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name,
      estimated: Math.round(wos.reduce((s, w) => s + (w.estimatedHours || 0), 0) * 10) / 10,
      logged: Math.round(wos.reduce((s, w) => s + (w.actualHours || 0), 0) * 10) / 10,
    };
  });
}

export function workloadByDev(users, workOrders) {
  return users
    .filter((u) => u.role === 'dev')
    .map((u) => {
      const wos = workOrders.filter((w) => w.assignee === u.id);
      const est = wos.reduce((s, w) => s + (w.estimatedHours || 0), 0);
      const logged = wos.reduce((s, w) => s + (w.actualHours || 0), 0);
      return {
        name: u.name,
        estimated: Math.round(est * 10) / 10,
        logged: Math.round(logged * 10) / 10,
        remaining: Math.round(Math.max(0, est - logged) * 10) / 10,
        count: wos.length,
      };
    })
    .filter((d) => d.count > 0);
}

const HOURS_RE = /logged\s+([\d.]+)\s*h/i;

export function hoursTrend(activity, days = 14, actor = null) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayItems = (activity || []).filter(
      (a) =>
        a.date === iso &&
        (!actor || a.actor === actor) &&
        HOURS_RE.test(a.text),
    );
    const hours = dayItems.reduce((s, a) => {
      const m = a.text.match(HOURS_RE);
      return s + (m ? parseFloat(m[1]) : 0);
    }, 0);
    out.push({ day: label, hours: Math.round(hours * 10) / 10 });
  }
  return out;
}

export function summarizeWorkOrders(wos) {
  return {
    total: wos.length,
    active: wos.filter((w) => w.status === 'in-progress').length,
    inReview: wos.filter((w) => w.status === 'submitted-review').length,
    done: wos.filter((w) => w.status === 'completed' || w.status === 'done').length,
    notStarted: wos.filter((w) => w.status === 'not-started').length,
    changes: wos.filter((w) => w.status === 'changes-requested').length,
    est: wos.reduce((s, w) => s + (w.estimatedHours || 0), 0),
    logged: wos.reduce((s, w) => s + (w.actualHours || 0), 0),
  };
}

export function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);
}