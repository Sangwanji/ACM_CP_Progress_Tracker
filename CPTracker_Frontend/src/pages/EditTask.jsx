import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTask, useUpdateTask } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { toLocalInput } from '../lib/format';

function EditForm({ t }) {
  const navigate = useNavigate();
  const update = useUpdateTask();
  const [title, setTitle] = useState(t.title);
  const [description, setDescription] = useState(t.description || '');
  const [difficulty, setDifficulty] = useState(t.difficulty || '');
  const [deadline, setDeadline] = useState(toLocalInput(new Date(t.deadline)));
  const [links, setLinks] = useState(t.problemLinks?.length ? t.problemLinks : ['']);
  const [localError, setLocalError] = useState('');

  const setLink = (i, v) => setLinks((l) => l.map((x, j) => (j === i ? v : x)));

  function onSubmit(e) {
    e.preventDefault();
    setLocalError('');
    const when = new Date(deadline);
    if (Number.isNaN(when.getTime())) return setLocalError('Pick a valid deadline');
    if (when <= new Date() && !window.confirm('This deadline is in the past, so open tasks will show as TLE. Save anyway?')) {
      return;
    }
    update.mutate(
      {
        id: t.id,
        body: {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          problemLinks: links.map((l) => l.trim()).filter(Boolean),
          deadline: when.toISOString(),
        },
      },
      { onSuccess: () => navigate(`/tasks/${t.id}`) }
    );
  }

  const error = localError || update.error?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-4">
        <h2 className="font-mono text-sm font-medium">Problem</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-muted">Title</span>
            <input className="input mt-1" required maxLength={200} value={title}
              onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Description</span>
            <textarea className="input mt-1 min-h-28" maxLength={5000} value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Difficulty</span>
              <select className="input mt-1" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">Not set</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Deadline</span>
              <input type="datetime-local" className="input mt-1" required value={deadline}
                onChange={(e) => setDeadline(e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-muted">
            Everyone assigned sees the new deadline right away.
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-mono text-sm font-medium">Problem links</h2>
        <p className="mt-1 text-sm text-muted">Links must start with https:// (or http://).</p>
        <div className="mt-4 space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" value={l} maxLength={500} placeholder="https://…"
                onChange={(e) => setLink(i, e.target.value)} />
              {links.length > 1 && (
                <button type="button" className="btn-ghost" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                  Remove
                </button>
              )}
            </div>
          ))}
          {links.length < 20 && (
            <button type="button" className="btn-ghost" onClick={() => setLinks([...links, ''])}>
              Add another link
            </button>
          )}
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      <div className="flex gap-3">
        <button className="btn-primary" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <Link to={`/tasks/${t.id}`} className="btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}

export default function EditTask() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: t, isLoading, error } = useTask(id);

  if (isLoading) return <Loading />;
  if (error?.status === 404) {
    return (
      <Card>
        <EmptyState title="Task not found" />
        <p className="pb-6 text-center text-sm">
          <Link to="/tasks" className="text-brand hover:underline">Back to tasks</Link>
        </p>
      </Card>
    );
  }
  if (error) return <ErrorBox message={error.message} />;

  if (t.createdById !== user.id) {
    return (
      <Card>
        <EmptyState title="Only the creator can edit this task" hint={`Created by ${t.createdBy?.name || 'another expert'}.`} />
        <p className="pb-6 text-center text-sm">
          <Link to={`/tasks/${t.id}`} className="text-brand hover:underline">Back to the task</Link>
        </p>
      </Card>
    );
  }

  return (
    <>
      <PageHeader title="Edit task" subtitle={t.title} />
      <EditForm t={t} />
    </>
  );
}