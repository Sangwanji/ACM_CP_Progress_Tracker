import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useOverview, useReviewQueue } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader, Stat } from '../components/ui';
import { formatDate } from '../lib/format';

function sumStats(cards) {
  const t = { total: 0, done: 0, submitted: 0, overdue: 0 };
  for (const c of cards) {
    t.total += c.stats.total;
    t.done += c.stats.done;
    t.submitted += c.stats.submitted;
    t.overdue += c.stats.overdue;
  }
  return t;
}

function MenteeCard({ m, showExperts }) {
  const s = m.stats;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/members/${m.id}`} className="block truncate font-medium hover:text-brand">
            {m.name}
          </Link>
          <p className="font-mono text-xs uppercase text-muted">{m.role}</p>
        </div>
        {s.overdue > 0 && (
          <span className="rounded border border-tle/40 bg-tle/10 px-1.5 py-0.5 font-mono text-xs text-tle">
            {s.overdue} TLE
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded bg-bg">
        <div className="h-full bg-ac" style={{ width: `${s.completionRate}%` }} />
      </div>
      <p className="mt-1 font-mono text-xs text-muted">
        {s.done}/{s.total} AC · {s.completionRate}%
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 font-mono text-xs">
        <span className="text-run">{s.todo + s.inProgress} open</span>
        <span className="text-judge">{s.submitted} judging</span>
      </div>
      <p className="mt-2 text-xs text-muted">
        {s.nextDeadline ? `Next due ${formatDate(s.nextDeadline)}` : 'No upcoming deadline'}
      </p>
      {showExperts && m.mentors.length > 0 && (
        <p className="mt-1 text-xs text-muted">Experts: {m.mentors.map((x) => x.name).join(', ')}</p>
      )}
    </Card>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const isExpert = user.role === 'EXPERT';
  const canToggle = isExpert && user.isAdmin; // expert who is also admin
  const [scope, setScope] = useState('mine');
  const { data, isLoading, error } = useOverview();
  const queue = useReviewQueue(isExpert);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const onlyMine = canToggle && scope === 'mine';
  const cards = onlyMine ? data.mentees.filter((m) => m.mentors.some((x) => x.id === user.id)) : data.mentees;
  const t = sumStats(cards);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={user.role === 'ADMIN' ? 'Everyone in the program' : 'Your mentees'}
        actions={isExpert && <Link to="/tasks/new" className="btn-primary">New task</Link>}
      />

      {isExpert && queue.data && (
        <Link
          to="/review"
          className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 ${
            queue.data.count > 0 ? 'border-judge/40 bg-judge/10' : 'border-line bg-surface'
          }`}
        >
          <span className="text-sm">
            {queue.data.count > 0
              ? `${queue.data.count} submission${queue.data.count === 1 ? '' : 's'} waiting for your review`
              : 'No submissions waiting for review'}
          </span>
          <span className="font-mono text-xs text-brand">Open review queue →</span>
        </Link>
      )}

      {canToggle && (
        <div className="mb-4 flex gap-2">
          {[['mine', 'My mentees'], ['all', 'Everyone']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
                scope === key ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat tag="MEM" label="Members" value={cards.length} color="text-brand" />
        <Stat tag="AC" label="Solved" value={`${t.done}/${t.total}`} color="text-ac" />
        <Stat tag="Judging" label="Waiting for review" value={t.submitted} color="text-judge" />
        <Stat tag="TLE" label="Overdue" value={t.overdue} color="text-tle" />
      </div>

      {cards.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            title="No mentees yet"
            hint="An admin can assign scholars and fellows to you under Users."
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((m) => (
            <MenteeCard key={m.id} m={m} showExperts={user.isAdmin && !onlyMine} />
          ))}
        </div>
      )}
    </>
  );
}