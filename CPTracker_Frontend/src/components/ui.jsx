export function Card({ className = '', children }) {
  return <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return <p className="py-10 text-center font-mono text-sm text-muted">{label}</p>;
}

export function ErrorBox({ message }) {
  return (
    <p className="rounded-md border border-tle/40 bg-tle/10 px-3 py-2 text-sm text-tle">{message}</p>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="py-12 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Stat({ tag, label, value, color, children }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={`font-mono text-xs font-bold ${color}`}>{tag}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
      {children}
    </Card>
  );
}