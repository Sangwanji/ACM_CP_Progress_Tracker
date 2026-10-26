import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMyAssignments, useUpdateAssignment } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading } from '../components/ui';
import { DifficultyBadge, StatusBadge } from '../components/StatusBadge';
import { Countdown } from '../components/Countdown';
import { formatDate, hostOf, isLate, isOpen, safeHref } from '../lib/format';

function ExternalLink({ url, label }) {
  const href = safeHref(url);
  if (!href) return <span className="break-all text-muted">{label || url}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
      {label || url}
    </a>
  );
}

function WorkForm({ a }) {
  const update = useUpdateAssignment();
  const [link, setLink] = useState(a.submissionLink || '');
  const [note, setNote] = useState(a.assigneeNote || '');
  const [localError, setLocalError] = useState('');

  const fields = { submissionLink: link.trim() || null, assigneeNote: note.trim() || null };
  const send = (body) => { setLocalError(''); update.mutate({ id: a.id, body }); };

  if (a.status === 'DONE') {
    return (
      <Card className="p-4">
        <h2 className="font-mono text-sm font-medium">Your work</h2>
        <p className="mt-2 text-sm text-ac">
          Accepted{a.completedAt ? ` on ${formatDate(a.completedAt)}` : ''}. This task is locked. Ask your expert
          if it needs to be reopened.
        </p>
        {a.submissionLink && (
          <p className="mt-3 text-sm">
            <span className="text-muted">Submission: </span>
            <ExternalLink url={a.submissionLink} />
          </p>
        )}
        {a.assigneeNote && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{a.assigneeNote}</p>}
      </Card>
    );
  }

  const error = localError || update.error?.message;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-sm font-medium">Your work</h2>
        {a.status === 'TODO' && (
          <button className="btn-ghost" disabled={update.isPending} onClick={() => send({ status: 'IN_PROGRESS' })}>
            Start working
          </button>
        )}
        {a.status === 'SUBMITTED' && (
          <button className="btn-ghost" disabled={update.isPending} onClick={() => send({ status: 'IN_PROGRESS' })}>
            Withdraw submission
          </button>
        )}
      </div>

      {a.status === 'SUBMITTED' && (
        <p className="mt-2 text-sm text-judge">Submitted. Waiting for an expert to review it.</p>
      )}

      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="text-muted">Submission link</span>
          <input
            className="input mt-1"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://leetcode.com/submissions/detail/…"
            maxLength={500}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Note for your expert (optional)</span>
          <textarea
            className="input mt-1 min-h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
          />
        </label>

        {error && <ErrorBox message={error} />}

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-ghost" disabled={update.isPending} onClick={() => send(fields)}>
            Save
          </button>
          {isOpen(a.status) && (
            <button
              className="btn-primary"
              disabled={update.isPending}
              onClick={() => {
                if (!link.trim()) return setLocalError('Add a submission link before submitting');
                send({ ...fields, status: 'SUBMITTED' });
              }}
            >
              Submit for review
            </button>
          )}
          {update.isSuccess && !error && <span className="font-mono text-xs text-ac">Saved</span>}
        </div>
      </div>
    </Card>
  );
}

export default function MemberTaskDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useMyAssignments();

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const a = data.find((x) => String(x.id) === id);
  if (!a) {
    return (
      <Card>
        <EmptyState title="Task not found" hint="It may have been removed, or it isn't assigned to you." />
        <p className="pb-6 text-center text-sm">
          <Link to="/tasks" className="text-brand hover:underline">Back to my tasks</Link>
        </p>
      </Card>
    );
  }

  const t = a.task;

  return (
    <>
      <Link to="/tasks" className="font-mono text-xs text-muted hover:text-fg">← my tasks</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{t.title}</h1>
        <DifficultyBadge value={t.difficulty} />
        <StatusBadge status={a.status} overdue={isLate(a.status, t.deadline)} />
      </div>

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
                  <li key={url}>
                    <ExternalLink url={url} label={`${hostOf(url)} ↗`} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {a.expertFeedback && (
            <Card className="border-l-4 border-l-brand p-4">
              <h2 className="font-mono text-sm font-medium">Expert feedback</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{a.expertFeedback}</p>
              <p className="mt-2 font-mono text-xs text-muted">
                {a.reviewedBy?.name || 'Expert'}{a.reviewedAt ? ` · ${formatDate(a.reviewedAt)}` : ''}
              </p>
            </Card>
          )}

          <WorkForm key={a.updatedAt} a={a} />
        </div>

        <Card className="h-fit p-4">
          <h2 className="font-mono text-sm font-medium">Details</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Due</dt>
              <dd>
                {formatDate(t.deadline)} <Countdown deadline={t.deadline} status={a.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Assigned by</dt>
              <dd>{t.createdBy?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Last updated</dt>
              <dd>{formatDate(a.updatedAt)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}