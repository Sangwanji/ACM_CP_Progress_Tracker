import { Link } from 'react-router-dom';
import { useReviewQueue } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { ExternalLink } from '../components/ExternalLink';
import { ReviewForm } from '../components/ReviewForm';
import { formatDate } from '../lib/format';

export default function ReviewQueue() {
  const { data, isLoading, error } = useReviewQueue();

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  return (
    <>
      <PageHeader title="Review queue" subtitle={`${data.count} waiting, oldest first`} />

      {data.count === 0 ? (
        <Card>
          <EmptyState title="All caught up" hint="No submissions are waiting for review." />
        </Card>
      ) : (
        <div className="space-y-4">
          {data.queue.map((q) => (
            <Card key={q.assignmentId} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link to={`/tasks/${q.task.id}`} className="font-medium hover:text-brand">
                    {q.task.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    <Link to={`/members/${q.assignee.id}`} className="hover:text-brand">{q.assignee.name}</Link>
                    <span className="ml-2 font-mono text-xs uppercase">{q.assignee.role}</span>
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-muted">
                  <p>Submitted {formatDate(q.submittedAt)}</p>
                  <p>Due {formatDate(q.task.deadline)}</p>
                  {q.late && <p className="text-tle">Submitted late</p>}
                </div>
              </div>

              {q.submissionLink && (
                <p className="mt-3 text-sm">
                  <span className="text-muted">Submission: </span>
                  <ExternalLink url={q.submissionLink} />
                </p>
              )}
              {q.assigneeNote && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{q.assigneeNote}</p>
              )}

              <div className="mt-4 border-t border-line pt-4">
                <ReviewForm assignment={{ id: q.assignmentId, status: 'SUBMITTED', expertFeedback: '' }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}