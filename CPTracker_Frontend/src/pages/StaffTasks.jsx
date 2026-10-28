import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTasks } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { DifficultyBadge } from '../components/StatusBadge';
import { Countdown } from '../components/Countdown';
import { formatDate, isOpen } from '../lib/format';

const TABS = [
  ['all', 'All', () => true],
  ['mine', 'Created by me', (t, uid) => t.createdById === uid],
  ['review', 'Needs review', (t) => t.assignments.some((a) => a.status === 'SUBMITTED')],
];

export default function StaffTasks() {
  const { user } = useAuth();
  const { data, isLoading, error } = useTasks();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const test = TABS.find((x) => x[0] === tab)[2];
  const q = search.trim().toLowerCase();
  const rows = data.filter((t) => test(t, user.id) && (!q || t.title.toLowerCase().includes(q)));

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Soonest deadline first"
        actions={user.role === 'EXPERT' && <Link to="/tasks/new" className="btn-primary">New task</Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {TABS.map(([key, label, fn]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
                tab === key ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {label} {data.filter((t) => fn(t, user.id)).length}
            </button>
          ))}
        </div>
        <input
          className="input max-w-xs"
          placeholder="Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState
            title={data.length === 0 ? 'No tasks yet' : 'Nothing here'}
            hint={data.length === 0 ? 'Create the first task to get started.' : 'Try another filter or search.'}
          />
        ) : (
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="border-b border-line font-mono text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2">Problem</th>
                <th className="px-4 py-2">Difficulty</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Created by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((t) => {
                const total = t.assignments.length;
                const done = t.assignments.filter((a) => a.status === 'DONE').length;
                const judging = t.assignments.filter((a) => a.status === 'SUBMITTED').length;
                const open = t.assignments.some((a) => isOpen(a.status));
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={t.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link to={`/tasks/${t.id}`} className="font-medium hover:text-brand">{t.title}</Link>
                    </td>
                    <td className="px-4 py-3"><DifficultyBadge value={t.difficulty} /></td>
                    <td className="px-4 py-3">
                      <div>{formatDate(t.deadline)}</div>
                      <Countdown deadline={t.deadline} status={open ? 'IN_PROGRESS' : 'DONE'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded bg-bg">
                        <div className="h-full bg-ac" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {done}/{total} AC
                        {judging > 0 && <span className="text-judge"> · {judging} judging</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {t.createdById === user.id ? 'You' : t.createdBy?.name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}