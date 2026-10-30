import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUsers } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { ActiveBadge, RoleBadge } from '../components/Badges';

const TABS = [
  ['all', 'All', () => true],
  ['ADMIN', 'Admins', (u) => u.role === 'ADMIN'],
  ['EXPERT', 'Experts', (u) => u.role === 'EXPERT'],
  ['SCHOLAR', 'Scholars', (u) => u.role === 'SCHOLAR'],
  ['FELLOW', 'Fellows', (u) => u.role === 'FELLOW'],
  ['inactive', 'Inactive', (u) => !u.isActive],
];

export default function AdminUsers() {
  const { data, isLoading, error } = useUsers();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const byId = new Map(data.map((u) => [u.id, u]));
  const test = TABS.find((t) => t[0] === tab)[2];
  const q = search.trim().toLowerCase();
  const rows = data.filter(
    (u) => test(u) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  );

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${data.length} accounts`}
        actions={<Link to="/admin/users/new" className="btn-primary">New user</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(([key, label, fn]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
                tab === key ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {label} {data.filter(fn).length}
            </button>
          ))}
        </div>
        <input
          className="input max-w-xs"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState title="No users found" hint="Try another filter or search." />
        ) : (
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="border-b border-line font-mono text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Experts</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${u.id}`} className="font-medium hover:text-brand">{u.name}</Link>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3"><RoleBadge user={u} /></td>
                  <td className="px-4 py-3 text-muted">
                    {u.mentorIds.map((id) => byId.get(id)?.name).filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3"><ActiveBadge active={u.isActive} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/users/${u.id}`} className="font-mono text-xs text-brand hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}