import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyAssignments } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { DifficultyBadge, StatusBadge } from '../components/StatusBadge';
import { Countdown } from '../components/Countdown';
import { formatDate, isLate, isOpen } from '../lib/format';

const TABS = [
  ['all', 'All', () => true],
  ['open', 'Open', (a) => isOpen(a.status)],
  ['judging', 'Judging', (a) => a.status === 'SUBMITTED'],
  ['ac', 'AC', (a) => a.status === 'DONE'],
  ['tle', 'TLE', (a) => isLate(a.status, a.task.deadline)],
];

// Contest-style problem letters: A, B, C...
const letter = (i) => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1));

export default function MyTasks() {
  const { data, isLoading, error } = useMyAssignments();
  const [tab, setTab] = useState('all');

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const all = data.map((a, i) => ({ ...a, letter: letter(i) })); // letters stay stable when filtering
  const test = TABS.find((t) => t[0] === tab)[2];
  const rows = all.filter(test);

  return (
    <>
      <PageHeader title="My tasks" subtitle="Soonest deadline first" />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([key, label, fn]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
              tab === key ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:text-fg'
            }`}
          >
            {label} {all.filter(fn).length}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? 'No tasks yet' : 'Nothing here'}
            hint={all.length === 0 ? 'Your experts will assign tasks here.' : 'Try another filter.'}
          />
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line font-mono text-xs uppercase text-muted">
              <tr>
                <th className="w-12 px-4 py-2">#</th>
                <th className="px-4 py-2">Problem</th>
                <th className="px-4 py-2">Difficulty</th>
                <th className="px-4 py-2">Verdict</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2">Assigned by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3 font-mono text-muted">{a.letter}</td>
                  <td className="px-4 py-3">
                    <Link to={`/tasks/${a.id}`} className="font-medium hover:text-brand">
                      {a.task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><DifficultyBadge value={a.task.difficulty} /></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} overdue={isLate(a.status, a.task.deadline)} />
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatDate(a.task.deadline)}</div>
                    <Countdown deadline={a.task.deadline} status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">{a.task.createdBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}