import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAssignTask, useUsers } from '../lib/queries';
import { Card, ErrorBox } from './ui';

// task: the full task object. Lists your own mentees who are not on it yet.
export function AddAssignees({ task }) {
  const { user } = useAuth();
  const { data: users } = useUsers();
  const assign = useAssignTask();
  const [picked, setPicked] = useState([]);

  if (!users) return null;

  const assigned = new Set(task.assignments.map((a) => a.assignee.id));
  const available = users.filter(
    (u) =>
      u.isActive &&
      ['SCHOLAR', 'FELLOW'].includes(u.role) &&
      u.mentorIds.includes(user.id) &&
      !assigned.has(u.id)
  );

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Card className="p-4">
      <h2 className="font-mono text-sm font-medium">Add people</h2>
      {available.length === 0 ? (
        <p className="mt-2 text-sm text-muted">All your mentees are already on this task.</p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {available.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-2"
              >
                <input type="checkbox" checked={picked.includes(m.id)} onChange={() => toggle(m.id)} />
                {m.name}
                <span className="ml-auto font-mono text-xs uppercase text-muted">{m.role}</span>
              </label>
            ))}
          </div>
          {assign.error && <div className="mt-3"><ErrorBox message={assign.error.message} /></div>}
          <button
            className="btn-primary mt-3"
            disabled={assign.isPending || picked.length === 0}
            onClick={() => assign.mutate({ id: task.id, assigneeIds: picked }, { onSuccess: () => setPicked([]) })}
          >
            {assign.isPending ? 'Adding…' : `Add ${picked.length || ''} selected`}
          </button>
        </>
      )}
    </Card>
  );
}