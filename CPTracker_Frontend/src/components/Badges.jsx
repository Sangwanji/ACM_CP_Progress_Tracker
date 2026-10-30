// Role tag. Experts who also have admin access get a second ADMIN tag.
export function RoleBadge({ user }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="rounded border border-line px-1.5 py-0.5 font-mono text-xs uppercase text-muted">
        {user.role}
      </span>
      {user.isAdmin && user.role !== 'ADMIN' && (
        <span className="rounded border border-brand/40 bg-brand/10 px-1.5 py-0.5 font-mono text-xs text-brand">
          ADMIN
        </span>
      )}
    </span>
  );
}

export function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${active ? 'text-ac' : 'text-muted'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}