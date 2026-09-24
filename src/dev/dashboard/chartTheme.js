export const PALETTE = [
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#0ea5e9',
  '#64748b',
  '#ec4899',
  '#22c55e',
];

export const WO_STATUS_CHART = [
  { key: 'not-started', label: 'Not Started', color: '#71717a' },
  { key: 'in-progress', label: 'In Progress', color: '#0ea5e9' },
  { key: 'submitted-review', label: 'In Review', color: '#8b5cf6' },
  { key: 'changes-requested', label: 'Changes', color: '#f59e0b' },
  { key: 'completed', label: 'Done', color: '#10b981' },
  { key: 'done', label: 'Done', color: '#10b981' },
];

export function axisProps(dark) {
  return {
    tickLine: false,
    axisLine: { stroke: dark ? '#3f3f46' : '#d4d4d8' },
    tick: { fill: dark ? '#a1a1aa' : '#52525b', fontSize: 11 },
  };
}

export function gridProps(dark) {
  return { strokeDasharray: '3 3', stroke: dark ? '#27272a' : '#e4e4e7' };
}

export const centeredLabel = {
  pointerEvents: 'none',
  fontSize: 11,
  fill: '#71717a',
};