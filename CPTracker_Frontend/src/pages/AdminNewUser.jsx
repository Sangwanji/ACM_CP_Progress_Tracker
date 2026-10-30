import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateUser, useUsers } from '../lib/queries';
import { Card, ErrorBox, Loading, PageHeader } from '../components/ui';
import { ExpertPicker } from '../components/ExpertPicker';
import { RoleBadge } from '../components/Badges';
import { TempPassword } from '../components/TempPassword';

const ROLES = [
  ['SCHOLAR', 'Scholar'],
  ['FELLOW', 'Fellow'],
  ['EXPERT', 'Expert'],
  ['ADMIN', 'Admin (manager only, not an expert)'],
];

export default function AdminNewUser() {
  const { data: users, isLoading, error } = useUsers();
  const create = useCreateUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('FELLOW');
  const [alsoAdmin, setAlsoAdmin] = useState(false);
  const [picked, setPicked] = useState([]);
  const [localError, setLocalError] = useState('');
  const [result, setResult] = useState(null);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const experts = users.filter((u) => u.role === 'EXPERT' && u.isActive);
  const needsMentors = role === 'SCHOLAR' || role === 'FELLOW';

  function reset() {
    setName(''); setEmail(''); setRole('FELLOW'); setAlsoAdmin(false); setPicked([]);
    setLocalError(''); setResult(null); create.reset();
  }

  function onSubmit(e) {
    e.preventDefault();
    setLocalError('');
    if (needsMentors && picked.length === 0) return setLocalError('Pick at least one expert');
    const body = {
      name: name.trim(),
      email: email.trim(),
      role,
      isAdmin: role === 'EXPERT' ? alsoAdmin : undefined,
      mentorIds: needsMentors ? picked : undefined,
    };
    create.mutate(body, {
      onSuccess: ({ user, temporaryPassword }) => setResult({ user, password: temporaryPassword }),
    });
  }

  if (result) {
    return (
      <>
        <PageHeader title="Account created" />
        <Card className="mb-4 p-4">
          <p className="font-medium">{result.user.name}</p>
          <p className="text-sm text-muted">{result.user.email}</p>
          <div className="mt-2"><RoleBadge user={result.user} /></div>
        </Card>
        <TempPassword email={result.user.email} password={result.password} />
        <div className="mt-4 flex gap-3">
          <button className="btn-primary" onClick={reset}>Create another</button>
          <Link to={`/admin/users/${result.user.id}`} className="btn-ghost">Manage this user</Link>
          <Link to="/admin/users" className="btn-ghost">Back to users</Link>
        </div>
      </>
    );
  }

  const err = localError || create.error?.message;

  return (
    <>
      <PageHeader title="New user" subtitle="They log in with this email and a temporary password" />
      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted">Full name</span>
              <input className="input mt-1" required maxLength={100} value={name}
                onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Email</span>
              <input type="email" className="input mt-1" required value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
          <label className="mt-4 block text-sm">
            <span className="text-muted">Role</span>
            <select className="input mt-1 sm:max-w-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {role === 'EXPERT' && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={alsoAdmin} onChange={(e) => setAlsoAdmin(e.target.checked)} />
              Also give admin access (manage users and mentors)
            </label>
          )}
        </Card>

        {needsMentors && (
          <Card className="p-4">
            <h2 className="font-mono text-sm font-medium">Experts ({picked.length} selected)</h2>
            <p className="mt-1 text-sm text-muted">Choose one or more experts to mentor this person.</p>
            <div className="mt-3"><ExpertPicker experts={experts} value={picked} onChange={setPicked} /></div>
          </Card>
        )}

        {err && <ErrorBox message={err} />}

        <div className="flex gap-3">
          <button className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create account'}
          </button>
          <Link to="/admin/users" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}