import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useDeleteTask, useRemoveAssignee, useTask } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading } from '../components/ui';
import { DifficultyBadge, StatusBadge } from '../components/StatusBadge';
import { Countdown } from '../components/Countdown';
import { ExternalLink } from '../components/ExternalLink';
import { ReviewForm } from '../components/ReviewForm';
import { AddAssignees } from '../components/AddAssignees';
import { formatDate, hostOf, isLate, isOpen } from '../lib/format';

export default function StaffTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: t, isLoading, error } = useTask(id);
  const del = useDeleteTask();
  const remove = useRemoveAssignee();

  if (isLoading) return <Loading />;
  if (error?.status === 404) {
    return (
      <Card>
        <EmptyState title="Task not found" hint="It may have been removed, or it doesn't involve your mentees." />
        <p className="pb-6 text-center text-sm">
          <Link to="/tasks" className="text-brand hover:underline">Back to tasks</Link>
        </p>
      </Card>
    );
  }
  if (error) return <ErrorBox message={error.message} />;

  const canReview = user.role === 'EXPERT'; // pure admins can view but not review
  const canManage = user.role === 'EXPERT' && t.createdById === user.id; // edit, delete, assignees
  const total = t.assignments.length;
  const done = t.assignments.filter((a) => a.status === 'DONE').length;
  const open = t.assignments.some((a) => isOpen(a.status));
  const rows = [...t.assignments].sort((a, b) => (b.status === 'SUBMITTED') - (a.status === 'SUBMITTED'));

  function onDelete() {
    const msg = `Delete "${t.title}"?\n\nThis removes it for all ${total} assignee${total === 1 ? '' : 's'}, including their submissions and feedback. This cannot be undone.`;
    if (window.confirm(msg)) del.mutate(t.id, { onSuccess: () => navigate('/tasks', { replace: true }) });
  }

  function onRemove(a) {
    const msg = `Remove ${a.assignee.name} from this task?\n\nTheir progress and feedback on it will be deleted.`;
    if (window.confirm(msg)) remove.mutate({ taskId: t.id, assigneeId: a.assignee.id });
  }

  const actionError = del.error?.message || remove.error?.message;

  return (
    <>
      <Link to="/tasks" className="font-mono text-xs text-muted hover:text-fg">← tasks</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <DifficultyBadge value={t.difficulty} />
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link to={`/tasks/${t.id}/edit`} className="btn-ghost">Edit</Link>
            <button className="btn-ghost text-tle" disabled={del.isPending} onClick={onDelete}>
              {del.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="mb-4"><ErrorBox message={actionError} /></div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4">
            <h2 className="font-mono text-sm font-medium">Problem</h2>
            {t.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">{t.description}</p>
            ) : (
              <p className="mt-2 text-sm text-muted">No description.</p>
            )}
            {t.problemLinks?.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {t.problemLinks.map((url) => (
                  <li key={url}><ExternalLink url={url} label={`${hostOf(url)} ↗`} /></li>
                ))}
              </ul>
            )}
          </Card>

          <h2 className="font-mono text-sm font-medium">Assignees ({total})</h2>
          {rows.length === 0 && (
            <Card><EmptyState title="Nobody is assigned" hint={canManage ? 'Add people below.' : undefined} /></Card>
          )}
          {rows.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link to={`/members/${a.assignee.id}`} className="font-medium hover:text-brand">
                    {a.assignee.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs uppercase text-muted">{a.assignee.role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} overdue={isLate(a.status, t.deadline)} />
                  {canManage && (
                    <button
                      className="font-mono text-xs text-muted hover:text-tle"
                      disabled={remove.isPending}
                      onClick={() => onRemove(a)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {a.submissionLink && (
                <p className="mt-3 text-sm">
                  <span className="text-muted">Submission: </span>
                  <ExternalLink url={a.submissionLink} />
                </p>
              )}
              {a.assigneeNote && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{a.assigneeNote}</p>
              )}
              {a.reviewedBy && (
                <p className="mt-2 font-mono text-xs text-muted">
                  Last review: {a.reviewedBy.name} · {formatDate(a.reviewedAt)}
                </p>
              )}

              {canReview ? (
                <div className="mt-4 border-t border-line pt-4">
                  <ReviewForm key={a.updatedAt} assignment={a} />
                </div>
              ) : (
                a.expertFeedback && (
                  <p className="mt-3 whitespace-pre-wrap border-l-2 border-brand pl-3 text-sm">{a.expertFeedback}</p>
                )
              )}
            </Card>
          ))}

          {canManage && <AddAssignees task={t} />}
        </div>

        <Card className="h-fit p-4">
          <h2 className="font-mono text-sm font-medium">Details</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Due</dt>
              <dd>
                {formatDate(t.deadline)}{' '}
                <Countdown deadline={t.deadline} status={open ? 'IN_PROGRESS' : 'DONE'} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Progress</dt>
              <dd className="font-mono">{done}/{total} AC</dd>
            </div>
            <div>
              <dt className="text-muted">Created by</dt>
              <dd>{t.createdById === user.id ? 'You' : t.createdBy?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Created</dt>
              <dd>{formatDate(t.createdAt)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}