import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Link2,
  Search,
  Timer,
} from 'lucide-react';
import { useApp } from '../../data/context.js';
import { WoStatusBadge } from '../badges.jsx';
import { WO_STATUS_LABELS } from '../ptdMeta.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DONE_STATUSES = new Set(['completed', 'done']);
const ACTIVE_STATUSES = new Set(['in-progress', 'submitted-review', 'changes-requested']);

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtHours(h) {
  const n = Number(h) || 0;
  return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1);
}

function initials(name) {
  return (name || '')
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Reports({ dark }) {
  const { db } = useApp();

  const [selectedId, setSelectedId] = useState(() => {
    const firstDev = (db.users || []).find((u) => u.role === 'dev');
    return firstDev?.id || '';
  });
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState(() => toIsoLocal(new Date()));

  const periodActive = Boolean(fromDate && toDate && fromDate <= toDate);

  const projectsById = useMemo(
    () => Object.fromEntries((db.projects || []).map((p) => [p.id, p])),
    [db.projects],
  );
  const workOrdersById = useMemo(
    () => Object.fromEntries((db.workOrders || []).map((w) => [w.id, w])),
    [db.workOrders],
  );

  const today = toIsoLocal(new Date());

  const resetPeriod = () => {
    const d = new Date();
    setFromDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    setToDate(toIsoLocal(new Date()));
  };

  const reports = useMemo(() => {
    const inRange = (w) =>
      !periodActive ||
      ((!w.startDate || w.startDate <= toDate) && (!w.dueDate || w.dueDate >= fromDate));
    const entInRange = (e) => !periodActive || Boolean(e.date && e.date >= fromDate && e.date <= toDate);
    const devs = (db.users || []).filter((u) => u.role === 'dev');
    return devs.map((user) => {
      const wos = (db.workOrders || []).filter((w) => w.assignee === user.id && inRange(w));
      const entries = (db.reportEntries || [])
        .filter((e) => e.userId === user.id && entInRange(e))
        .sort((a, b) => `${b.date || ''}${b.time || ''}`.localeCompare(`${a.date || ''}${a.time || ''}`));
      const sum = (fn) => wos.reduce((s, w) => s + (Number(fn(w)) || 0), 0);
      const est = sum((w) => w.estimatedHours);
      const logged = sum((w) => w.actualHours);
      const remaining = sum((w) => Math.max(0, (Number(w.estimatedHours) || 0) - (Number(w.actualHours) || 0)));
      const done = wos.filter((w) => DONE_STATUSES.has(w.status)).length;
      const inProgress = wos.filter((w) => ACTIVE_STATUSES.has(w.status)).length;
      const overdue = wos.filter((w) => w.dueDate && w.dueDate < today && !DONE_STATUSES.has(w.status)).length;
      const avgProgress = wos.length
        ? Math.round(wos.reduce((s, w) => s + (Number(w.progress) || 0), 0) / wos.length)
        : 0;
      const entryHours = entries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
      return {
        user,
        wos,
        est,
        logged,
        remaining,
        done,
        inProgress,
        overdue,
        avgProgress,
        entries,
        entryCount: entries.length,
        entryHours,
      };
    });
  }, [db, today, periodActive, fromDate, toDate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter(
      (r) => !q || r.user.name.toLowerCase().includes(q) || r.user.title.toLowerCase().includes(q),
    );
  }, [reports, query]);

  const selected = reports.find((r) => r.user.id === selectedId) || reports[0];

  const downloadReport = () => {
    if (!selected) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 48;

    const BLACK = hexToRgb('#000000');
    const GRAY = hexToRgb('#4b5563');
    const LIGHT = hexToRgb('#f3f4f6');
    const ZEBRA = hexToRgb('#f9fafb');
    const BORDER = hexToRgb('#d1d5db');
    const TRACK = hexToRgb('#e5e7eb');
    const WHITE = hexToRgb('#ffffff');

    const hPct = selected.est ? Math.min(100, Math.round((selected.logged / selected.est) * 100)) : 0;

    // ---- Footer on every page ----
    const drawFooter = () => {
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text('System Soft - Programser International - Confidential', M, pageH - 26);
        doc.text(`Page ${i} of ${pages}`, pageW - M, pageH - 26, { align: 'right' });
      }
    };

    // ---- Section header with underline ----
    const sectionHeader = (label, currentY) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...BLACK);
      doc.text(label.toUpperCase(), M, currentY);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.7);
      doc.line(M, currentY + 6, pageW - M, currentY + 6);
      return currentY + 20;
    };

    // ---- Black masthead band ----
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, pageW, 34, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text('System Soft', M, 21);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 207, 215);
    doc.text('Programser International - Confidential', pageW - M, 21, { align: 'right' });

    // ---- Title ----
    let y = 80;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...BLACK);
    doc.text('Employee Work Report', M, y);
    y += 19;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    const periodText = periodActive ? `Report period: ${fromDate} to ${toDate}. ` : '';
    doc.text(
      `Prepared for ${selected.user.name} (${selected.user.title}), ${periodText}generated ${toIsoLocal(new Date())}.`,
      M,
      y,
    );
    y += 9;
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(1.4);
    doc.line(M, y, pageW - M, y);
    y += 26;

    // ---- Employee info card ----
    const yc = y;
    const cardH = 54;
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(M, yc, pageW - 2 * M, cardH, 6, 6, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...BLACK);
    doc.text(selected.user.name, M + 18, yc + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(selected.user.title, M + 18, yc + 38);

    const stats = [
      ['Work Orders', String(selected.wos.length)],
      ['Completed', String(selected.done)],
      ['Active', String(selected.inProgress)],
      ['Overdue', String(selected.overdue)],
    ];
    stats.forEach(([label, value], i) => {
      const right = pageW - M - 16 - i * 78;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(label.toUpperCase(), right, yc + 22, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...BLACK);
      doc.text(value, right, yc + 36, { align: 'right' });
    });
    y = yc + cardH + 24;

    // ---- Summary - hours boxes ----
    y = sectionHeader('Summary - Hours', y);
    const gap = 10;
    const boxW = (pageW - 2 * M - 3 * gap) / 4;
    const boxH = 62;
    const metrics = [
      { label: 'Estimated', value: `${fmtHours(selected.est)}h`, sub: 'assigned hours' },
      { label: 'Logged', value: `${fmtHours(selected.logged)}h`, sub: 'time spent' },
      { label: 'Remaining', value: `${fmtHours(selected.remaining)}h`, sub: 'still to spend' },
      { label: 'Avg Progress', value: `${selected.avgProgress}%`, sub: 'across work orders' },
    ];
    metrics.forEach((m, i) => {
      const x = M + i * (boxW + gap);
      doc.setFillColor(...LIGHT);
      doc.setDrawColor(...BORDER);
      doc.roundedRect(x, y, boxW, boxH, 6, 6, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(m.label.toUpperCase(), x + 13, y + 18);
      doc.setFontSize(17);
      doc.setTextColor(...BLACK);
      doc.text(m.value, x + 13, y + 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(m.sub, x + 13, y + 53);
    });
    y += boxH + 24;

    // ---- Hours spent progress bar ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('HOURS SPENT', M, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`${fmtHours(selected.logged)}h of ${fmtHours(selected.est)}h estimated (${hPct}%)`, pageW - M, y, {
      align: 'right',
    });
    const barY = y + 12;
    const barW = pageW - 2 * M;
    doc.setFillColor(...TRACK);
    doc.roundedRect(M, barY, barW, 9, 4.5, 4.5, 'F');
    if (hPct > 0) {
      doc.setFillColor(...BLACK);
      doc.roundedRect(M, barY, Math.max(6, (barW * hPct) / 100), 9, 4.5, 4.5, 'F');
    }

    // ---- Work order breakdown table ----
    const tableY = sectionHeader('Work Order Breakdown', barY + 30);
    const woBody = selected.wos.length
      ? selected.wos.map((w) => {
          const project = projectsById[w.projectId];
          const remainingH = Math.max(0, (Number(w.estimatedHours) || 0) - (Number(w.actualHours) || 0));
          return [
            w.title,
            project?.name || '-',
            WO_STATUS_LABELS[w.status] || w.status,
            fmtHours(w.estimatedHours),
            fmtHours(w.actualHours),
            fmtHours(remainingH),
            `${w.progress ?? 0}%`,
            w.dueDate || '-',
          ];
        })
      : [['No work orders assigned.', '', '', '', '', '', '', '']];

    autoTable(doc, {
      startY: tableY + 10,
      head: [['Work Order', 'Project', 'Status', 'Est', 'Logged', 'Remaining', 'Progress', 'Due']],
      body: woBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: BLACK, lineColor: BORDER, lineWidth: 0.6, valign: 'middle' },
      headStyles: { fillColor: BLACK, textColor: WHITE, fontStyle: 'bold', fontSize: 8, cellPadding: 5 },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: {
        0: { cellWidth: 150 },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
      },
      margin: { left: M, right: M, top: 70 },
    });

    // ---- Daily report entries table ----
    const entriesBody = selected.entries.length
      ? selected.entries.map((e) => {
          const wo = workOrdersById[e.workOrderId];
          return [
            e.date || '-',
            e.time || '-',
            e.hours > 0 ? `${fmtHours(e.hours)}h` : '-',
            wo ? wo.id : e.workOrderId || 'General',
            e.notes || '-',
          ];
        })
      : [['No daily reports submitted.', '', '', '', '']];

    const tableEndY = (doc.lastAutoTable?.finalY || tableY) + 20;
    autoTable(doc, {
      startY: sectionHeader('Daily Report Entries', tableEndY) + 10,
      head: [['Date', 'Time', 'Hours', 'Work Order', 'Notes']],
      body: entriesBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: BLACK, lineColor: BORDER, lineWidth: 0.6, valign: 'middle' },
      headStyles: { fillColor: BLACK, textColor: WHITE, fontStyle: 'bold', fontSize: 8, cellPadding: 5 },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 90 },
      },
      margin: { left: M, right: M, top: 70 },
    });

    drawFooter();
    const periodTag = periodActive ? `-${fromDate}-to-${toDate}` : '';
    doc.save(`employee-report-${selected.user.name.replace(/\s+/g, '-').toLowerCase()}${periodTag}.pdf`);
  };

  const panel = dark ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white/80';
  const heading = dark ? 'text-zinc-200' : 'text-zinc-800';
  const muted = dark ? 'text-zinc-500' : 'text-zinc-500';
  const border = dark ? 'border-zinc-800' : 'border-zinc-200';
  const rowHover = dark ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50';
  const inputBg = dark
    ? 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-zinc-500'
    : 'border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:border-zinc-500';

  const renderWoRow = (w) => {
    const project = projectsById[w.projectId];
    const remainingH = Math.max(0, (Number(w.estimatedHours) || 0) - (Number(w.actualHours) || 0));
    const pct = w.estimatedHours ? Math.min(100, Math.round(((w.actualHours || 0) / w.estimatedHours) * 100)) : 0;
    return (
      <div
        key={w.id}
        className={`grid grid-cols-1 gap-2 rounded-xl border px-3 py-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-center ${border} ${rowHover}`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`truncate text-xs font-semibold ${heading}`}>{w.title}</span>
            {project && <span className={`text-[10px] ${muted}`}>{project.name}</span>}
          </div>
          <div className={`mt-1 flex flex-wrap items-center gap-2 ${muted}`}>
            {w.dueDate && (
              <span className="flex items-center gap-1 text-[10px]">
                <Clock className="h-3 w-3" /> Due {w.dueDate}
              </span>
            )}
            <span className="text-[10px]">progress {w.progress ?? 0}%</span>
          </div>
        </div>
        <WoStatusBadge status={w.status} />
        <div className="flex items-center gap-4 text-[11px] tabular-nums">
          <span className={muted}>Est <span className={`font-semibold ${heading}`}>{fmtHours(w.estimatedHours)}h</span></span>
          <span className={muted}>Logged <span className="font-semibold text-violet-400">{fmtHours(w.actualHours)}h</span></span>
          <span className={muted}>Remaining <span className="font-semibold text-amber-400">{fmtHours(remainingH)}h</span></span>
          <div className="hidden w-20 h-1.5 overflow-hidden rounded-full bg-zinc-500/20 sm:block">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${heading}`}>Reports</h1>
          <p className={`mt-1 text-xs ${muted}`}>
            Daily work reports — hours estimated, hours logged and hours remaining, per employee.
            {periodActive && (
              <span className="mt-1 block">
                Period: <span className="font-semibold">{fromDate}</span> → <span className="font-semibold">{toDate}</span>
                {fromDate > toDate && <span className="ml-2 font-semibold text-rose-500">— From must be before To</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className={`flex flex-col gap-1 text-[10px] font-semibold uppercase ${muted}`}>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`rounded-xl border px-2 py-1.5 text-xs outline-none ${inputBg}`}
            />
          </label>
          <label className={`flex flex-col gap-1 text-[10px] font-semibold uppercase ${muted}`}>
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`rounded-xl border px-2 py-1.5 text-xs outline-none ${inputBg}`}
            />
          </label>
          <button
            onClick={resetPeriod}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-[300px_1fr]">
        {/* LEFT: employee list */}
        <div className={`rounded-2xl border p-3.5 ${panel} lg:sticky lg:top-0`}>
          <div className="flex items-center justify-between px-1 pb-2.5">
            <div>
              <h2 className={`text-sm font-bold ${heading}`}>Employees</h2>
              <p className={`text-[11px] ${muted}`}>{reports.length} developers on the team</p>
            </div>
          </div>

          <div className="relative mb-2.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees..."
              className={`w-full rounded-xl border pl-8 pr-2 py-1.5 text-xs outline-none ${inputBg}`}
            />
          </div>

          <div className="flex max-h-[62vh] flex-col gap-1.5 overflow-y-auto pr-0.5">
            {filtered.map((r) => {
              const active = selected?.user.id === r.user.id;
              const pct = r.est ? Math.min(100, Math.round((r.logged / r.est) * 100)) : 0;
              return (
                <button
                  key={r.user.id}
                  onClick={() => setSelectedId(r.user.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    active
                      ? dark
                        ? 'border-zinc-600 bg-zinc-800 ring-1 ring-zinc-700'
                        : 'border-zinc-900 bg-zinc-100 ring-1 ring-zinc-200'
                      : `${border} ${rowHover}`
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      active
                        ? dark
                          ? 'bg-zinc-200 text-zinc-900'
                          : 'bg-zinc-900 text-white'
                        : dark
                          ? 'bg-zinc-800 text-zinc-200'
                          : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {initials(r.user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`block truncate text-xs font-semibold ${heading}`}>{r.user.name}</span>
                    <span className={`block truncate text-[10px] ${muted}`}>{r.user.title}</span>
                    <div className={`mt-1.5 flex items-center gap-2 text-[10px] ${muted}`}>
                      <span className="font-semibold text-violet-400">{fmtHours(r.logged)}h</span>
                      <span>/ {fmtHours(r.est)}h est</span>
                      <span className="mx-0.5 text-zinc-500">·</span>
                      <span className="font-semibold text-amber-400">{fmtHours(r.remaining)}h</span>
                      <span>left</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`flex h-11 w-1.5 rounded-full ${active ? (dark ? 'bg-zinc-200' : 'bg-zinc-900') : 'bg-zinc-500/30'}`}>
                      <span
                        className={`w-full self-end rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                        style={{ height: `${pct}%` }}
                      />
                    </span>
                    <span className={`text-[9px] font-semibold ${muted}`}>{r.wos.length} WO</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className={`py-8 text-center text-xs ${muted}`}>No employees match your search.</div>
            )}
          </div>
        </div>

        {/* RIGHT: selected employee report */}
        <div className="min-w-0">
          {selected ? (
            <>
              {/* Employee header */}
              <div className={`rounded-2xl border p-5 ${panel}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold ${border} ${
                        dark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      {initials(selected.user.name)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className={`text-lg font-bold ${heading}`}>{selected.user.name}</h2>
                      </div>
                      <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
                        <span>{selected.user.title}</span>
                        <span>· {selected.wos.length} work order{selected.wos.length !== 1 ? 's' : ''}</span>
                        <span>· {periodActive ? `period ${fromDate} → ${toDate}` : 'all time'}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> {selected.done} done
                        </span>
                        <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                          <Timer className="h-3 w-3" /> {selected.inProgress} active
                        </span>
                        <span className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> {selected.overdue} overdue
                        </span>
                        <span className="flex items-center gap-1 rounded-lg bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-400 border border-violet-500/20">
                          <FileText className="h-3 w-3" /> {selected.entryCount} daily report{selected.entryCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 rounded-lg bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                          <Clock className="h-3 w-3" /> {fmtHours(selected.entryHours)}h reported
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 cursor-pointer"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Download Report
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className={`rounded-2xl border p-4 ${panel}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase ${muted}`}>
                    <Hourglass className="h-3.5 w-3.5" /> Estimated
                  </div>
                  <div className={`mt-1.5 text-2xl font-bold ${heading}`}>{fmtHours(selected.est)}h</div>
                  <div className={`mt-0.5 text-[10px] ${muted}`}>assigned hours</div>
                </div>
                <div className={`rounded-2xl border p-4 ${panel}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase ${muted}`}>
                    <Clock className="h-3.5 w-3.5" /> Logged
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-violet-400">{fmtHours(selected.logged)}h</div>
                  <div className={`mt-0.5 text-[10px] ${muted}`}>time spent so far</div>
                </div>
                <div className={`rounded-2xl border p-4 ${panel}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase ${muted}`}>
                    <Timer className="h-3.5 w-3.5" /> Remaining
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-amber-400">{fmtHours(selected.remaining)}h</div>
                  <div className={`mt-0.5 text-[10px] ${muted}`}>still to be spent</div>
                </div>
                <div className={`rounded-2xl border p-4 ${panel}`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase ${muted}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Avg Progress
                  </div>
                  <div className={`mt-1.5 text-2xl font-bold ${heading}`}>{selected.avgProgress}%</div>
                  <div className={`mt-0.5 text-[10px] ${muted}`}>across work orders</div>
                </div>
              </div>

              {/* Hours progress bar */}
              <div className={`mt-4 rounded-2xl border p-5 ${panel}`}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-semibold uppercase ${muted}`}>Hours Spent</span>
                  <span className={`tabular-nums ${muted}`}>
                    {fmtHours(selected.logged)}h of {fmtHours(selected.est)}h estimated ({selected.est ? Math.round((selected.logged / selected.est) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-500/20">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selected.est && selected.logged >= selected.est ? 'bg-emerald-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${selected.est ? Math.min(100, Math.round((selected.logged / selected.est) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              {/* Work orders */}
              <div className={`mt-4 rounded-2xl border p-4 sm:p-5 ${panel}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${heading}`}>Work Orders ({selected.wos.length})</h3>
                </div>
                {selected.wos.length > 0 ? (
                  <div className="flex flex-col gap-2">{selected.wos.map(renderWoRow)}</div>
                ) : (
                  <div className={`py-8 text-center text-xs ${muted}`}>
                    {periodActive ? 'No work orders in this period.' : 'No work orders assigned yet.'}
                  </div>
                )}
              </div>

              {/* Daily report entries */}
              <div className={`mt-4 rounded-2xl border p-4 sm:p-5 ${panel}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${heading}`}>Daily Report Entries ({selected.entries.length})</h3>
                  <span className={`text-[10px] ${muted}`}>
                    {fmtHours(selected.entryHours)}h reported by {selected.user.name.split(' ')[0]}
                  </span>
                </div>
                {selected.entries.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selected.entries.map((e) => {
                      const wo = workOrdersById[e.workOrderId];
                      return (
                        <div key={e.id} className={`rounded-xl border px-3 py-2.5 ${border} ${rowHover}`}>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                            <span className={`font-bold tabular-nums ${heading}`}>{e.date}</span>
                            {e.time && <span className={muted}>{e.time}</span>}
                            {e.hours > 0 && (
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
                                {fmtHours(e.hours)}h
                              </span>
                            )}
                            {wo ? (
                              <span className="flex items-center gap-1 rounded bg-zinc-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-400">
                                <Link2 className="h-3 w-3" /> {wo.id}
                              </span>
                            ) : (
                              <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
                                General
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-xs leading-relaxed ${e.notes ? heading : muted}`}>
                            {e.notes || 'No notes added.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`py-8 text-center text-xs ${muted}`}>
                    {periodActive ? 'No daily reports in this period.' : 'No daily reports submitted yet.'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`rounded-2xl border py-16 text-center ${panel}`}>
              <Search className={`mx-auto h-10 w-10 ${muted}`} />
              <p className={`mt-3 text-sm font-semibold ${heading}`}>No employees found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}