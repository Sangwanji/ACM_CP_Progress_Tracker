const STYLES = {
  TODO:        { label: 'In queue', hint: 'Not started',                      cls: 'border-queue/40 bg-queue/10 text-queue' },
  IN_PROGRESS: { label: 'Running',  hint: 'In progress',                      cls: 'border-run/40 bg-run/10 text-run' },
  SUBMITTED:   { label: 'Judging',  hint: 'Submitted, waiting for review',    cls: 'border-judge/40 bg-judge/10 text-judge' },
  DONE:        { label: 'AC',       hint: 'Accepted: marked done by an expert', cls: 'border-ac/40 bg-ac/10 text-ac' },
  OVERDUE:     { label: 'TLE',      hint: 'Time limit exceeded: deadline passed', cls: 'border-tle/40 bg-tle/10 text-tle' },
};

// status: TODO | IN_PROGRESS | SUBMITTED | DONE.  overdue: boolean from the API
export function StatusBadge({ status, overdue = false }) {
  const open = status === 'TODO' || status === 'IN_PROGRESS';
  const s = STYLES[overdue && open ? 'OVERDUE' : status] || STYLES.TODO;
  return (
    <span
      title={s.hint}
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs font-medium ${s.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

const DIFFICULTY = {
  easy: 'text-ac',
  medium: 'text-judge',
  hard: 'text-tle',
};

export function DifficultyBadge({ value }) {
  if (!value) return <span className="text-muted">-</span>;
  const cls = DIFFICULTY[String(value).toLowerCase()] || 'text-muted';
  return <span className={`font-mono text-xs font-medium ${cls}`}>{value}</span>;
}