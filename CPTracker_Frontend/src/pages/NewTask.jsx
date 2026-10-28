import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCreateTask, useUsers } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';

const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  return toLocalInput(d);
}

export default function NewTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: users, isLoading, error } = useUsers();
  const create = useCreateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [links, setLinks] = useState(['']);
  const [picked, setPicked] = useState([]);
  const [localError, setLocalError] = useState('');

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  // Only your own active scholars and fellows
  const mentees = users.filter(
    (u) => u.isActive && ['SCHOLAR', 'FELLOW'].includes(u.role) && u.mentorIds.includes(user.id)
  );

  if (mentees.length === 0) {
    return (
      <Card>
        <EmptyState title="You have no mentees yet" hint="An admin can assign scholars and fellows to you." />
      </Card>
    );
  }

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const setLink = (i, v) => setLinks((l) => l.map((x, j) => (j === i ? v : x)));

  function onSubmit(e) {
    e.preventDefault();
    setLocalError('');
    const when = new Date(deadline);
    if (Number.isNaN(when.getTime()) || when <= new Date()) return setLocalError('Pick a deadline in the future');
    if (picked.length === 0) return setLocalError('Pick at least one person');

    const body = {
      title: title.trim(),
      problemLinks: links.map((l) => l.trim()).filter(Boolean),
      deadline: when.toISOString(),
      assigneeIds: picked,
    };
    if (description.trim()) body.description = description.trim();
    if (difficulty) body.difficulty = difficulty;

    create.mutate(body, { onSuccess: ({ task }) => navigate(`/tasks/${task.id}`) });
  }

  const groups = [['Scholars', 'SCHOLAR'], ['Fellows', 'FELLOW']];
  const error2 = localError || create.error?.message;

  return (
    <>
      <PageHeader title="New task" subtitle="Assign work to your mentees" />
      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-4">
          <h2 className="font-mono text-sm font-medium">Problem</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="text-muted">Title</span>
              <input className="input mt-1" required maxLength={200} value={title}
                onChange={(e) => setTitle(e.target.value)} placeholder="Two Pointers set 1" />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Description (optional)</span>
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
                  min={toLocalInput(new Date())} onChange={(e) => setDeadline(e.target.value)} />
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-mono text-sm font-medium">Problem links</h2>
          <p className="mt-1 text-sm text-muted">Links must start with https:// (or http://).</p>
          <div className="mt-4 space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" value={l} maxLength={500} placeholder="https://leetcode.com/problems/…"
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

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-sm font-medium">Assign to ({picked.length} selected)</h2>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => setPicked(mentees.map((m) => m.id))}>
                Select all
              </button>
              <button type="button" className="btn-ghost" onClick={() => setPicked([])}>Clear</button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {groups.map(([label, role]) => {
              const list = mentees.filter((m) => m.role === role);
              if (list.length === 0) return null;
              return (
                <div key={role}>
                  <p className="font-mono text-xs uppercase text-muted">{label}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {list.map((m) => (
                      <label key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-2">
                        <input type="checkbox" checked={picked.includes(m.id)} onChange={() => toggle(m.id)} />
                        {m.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {error2 && <ErrorBox message={error2} />}

        <div className="flex gap-3">
          <button className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create task'}
          </button>
          <Link to="/tasks" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}