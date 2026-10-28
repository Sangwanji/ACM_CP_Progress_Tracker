import { useState } from 'react';
import { useReview } from '../lib/queries';
import { ErrorBox } from './ui';

// assignment: { id, status, expertFeedback }
export function ReviewForm({ assignment }) {
  const review = useReview();
  const original = assignment.expertFeedback || '';
  const [text, setText] = useState(original);
  const changed = text.trim() !== original.trim();
  const status = assignment.status;

  function send(decision) {
    const body = {};
    if (decision) body.decision = decision;
    if (changed) body.feedback = text.trim();
    review.mutate({ id: assignment.id, body });
  }

  return (
    <div className="space-y-3">
      <textarea
        className="input min-h-20"
        placeholder="Feedback for them (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
      />
      {review.error && <ErrorBox message={review.error.message} />}
      <div className="flex flex-wrap items-center gap-2">
        {status === 'SUBMITTED' && (
          <>
            <button className="btn-primary" disabled={review.isPending} onClick={() => send('DONE')}>
              Accept (AC)
            </button>
            <button className="btn-ghost" disabled={review.isPending} onClick={() => send('REOPEN')}>
              Send back
            </button>
          </>
        )}
        {status === 'DONE' && (
          <button className="btn-ghost" disabled={review.isPending} onClick={() => send('REOPEN')}>
            Reopen
          </button>
        )}
        {(status === 'TODO' || status === 'IN_PROGRESS') && (
          <button
            className="btn-ghost"
            disabled={review.isPending}
            onClick={() => {
              if (window.confirm('Mark as accepted without a submission?')) send('DONE');
            }}
          >
            Mark as AC
          </button>
        )}
        <button className="btn-ghost" disabled={review.isPending || !changed} onClick={() => send(null)}>
          Save feedback
        </button>
        {review.isSuccess && !changed && <span className="font-mono text-xs text-ac">Saved</span>}
      </div>
    </div>
  );
}