import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProfile, useUpdateProfile } from '../lib/queries';
import { Card, ErrorBox, Loading, PageHeader } from '../components/ui';
import { Avatar } from '../components/Avatar';

function Field({ label, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function ProfileForm({ profile }) {
  const update = useUpdateProfile();
  const [f, setF] = useState({
    year: profile.year ?? '',
    branch: profile.branch ?? '',
    rollNo: profile.rollNo ?? '',
    phone: profile.phone ?? '',
    leetcodeHandle: profile.leetcodeHandle ?? '',
    codeforcesHandle: profile.codeforcesHandle ?? '',
    codechefHandle: profile.codechefHandle ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  });
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  function save(e) {
    e.preventDefault();
    // empty strings clear a field on the server
    update.mutate({ id: profile.userId, body: { ...f, year: f.year === '' ? null : Number(f.year) } });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-4">
        <h2 className="font-mono text-sm font-medium">Basics</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={profile.name} url={f.avatarUrl} size="lg" />
          <div className="flex-1">
            <Field label="Photo link" hint="Link to an image, starting with https://">
              <input className="input" value={f.avatarUrl} onChange={set('avatarUrl')} maxLength={500}
                placeholder="https://…" />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Year">
            <select className="input" value={f.year} onChange={set('year')}>
              <option value="">Not set</option>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </Field>
          <Field label="Branch">
            <input className="input" value={f.branch} onChange={set('branch')} maxLength={60} placeholder="CSE" />
          </Field>
          <Field label="Roll number">
            <input className="input" value={f.rollNo} onChange={set('rollNo')} maxLength={30} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Phone" hint="Visible only to you, your experts and admins.">
            <input className="input sm:max-w-xs" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Bio" hint={`${f.bio.length}/500`}>
            <textarea className="input min-h-24" value={f.bio} onChange={set('bio')} maxLength={500} />
          </Field>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-mono text-sm font-medium">Coding handles</h2>
        <p className="mt-1 text-sm text-muted">Just the username, not the full link.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="LeetCode">
            <input className="input" value={f.leetcodeHandle} onChange={set('leetcodeHandle')} maxLength={40} />
          </Field>
          <Field label="Codeforces">
            <input className="input" value={f.codeforcesHandle} onChange={set('codeforcesHandle')} maxLength={40} />
          </Field>
          <Field label="CodeChef">
            <input className="input" value={f.codechefHandle} onChange={set('codechefHandle')} maxLength={40} />
          </Field>
        </div>
      </Card>

      {update.error && <ErrorBox message={update.error.message} />}

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save profile'}
        </button>
        <Link to={`/members/${profile.userId}`} className="btn-ghost">View my profile</Link>
        {update.isSuccess && <span className="font-mono text-xs text-ac">Saved</span>}
      </div>
    </form>
  );
}

export default function MyProfile() {
  const { user } = useAuth();
  const { data, isLoading, error } = useProfile(user.id);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  return (
    <>
      <PageHeader title="My profile" subtitle={`${user.name} · ${user.email}`} />
      <ProfileForm profile={data} />
    </>
  );
}