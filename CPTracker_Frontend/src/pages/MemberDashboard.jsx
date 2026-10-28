import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMyDashboard } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { DifficultyBadge } from '../components/StatusBadge';
import { Countdown } from '../components/Countdown';
import { formatDate } from '../lib/format';
import { Stat } from '../components/ui';

function TaskList({ title, items, empty }) {
  return (
    <Card className="p-4">
      <h2 className="font-mono text-sm font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((t) => (
            <li key={t.assignmentId}>
              <Link
                to={`/tasks/${t.assignmentId}`}
                className="flex items-center justify-between gap-3 py-2 hover:text-brand"
              >
                <span className="min-w-0 truncate text-sm">{t.title}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <DifficultyBadge value={t.difficulty} />
                  <Countdown deadline={t.deadline} status={t.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useMyDashboard();

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const s = data.stats;

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Your progress at a glance" />

      {s.total === 0 ? (
        <Card>
          <EmptyState title="No tasks yet" hint="Your experts will assign tasks here." />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat tag="AC" label="Solved" value={`${s.done}/${s.total}`} color="text-ac">
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-bg">
                <div className="h-full bg-ac" style={{ width: `${s.completionRate}%` }} />
              </div>
              <p className="mt-1 font-mono text-xs text-muted">{s.completionRate}% complete</p>
            </Stat>
            <Stat tag="Running" label="Open" value={s.todo + s.inProgress} color="text-run" />
            <Stat tag="Judging" label="Waiting for review" value={s.submitted} color="text-judge" />
            <Stat tag="TLE" label="Overdue" value={s.overdue} color="text-tle" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TaskList title="Overdue" items={data.overdue} empty="Nothing overdue. Nice." />
            <TaskList title="Upcoming deadlines" items={data.upcoming} empty="No open tasks." />
            <TaskList title="Waiting for review" items={data.awaitingReview} empty="No submissions waiting." />

            <Card className="p-4">
              <h2 className="font-mono text-sm font-medium">Recent feedback</h2>
              {data.recentFeedback.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No feedback yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {data.recentFeedback.map((f) => (
                    <li key={f.assignmentId} className="py-2">
                      <Link to={`/tasks/${f.assignmentId}`} className="text-sm font-medium hover:text-brand">
                        {f.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{f.feedback}</p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {f.reviewedBy?.name || 'Expert'} · {formatDate(f.reviewedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {user.mentors?.length > 0 && (
        <Card className="mt-4 p-4">
          <h2 className="font-mono text-sm font-medium">Your experts</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {user.mentors.map((m) => (
              <li key={m.id}>
                {m.name} <span className="text-muted">· {m.email}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}