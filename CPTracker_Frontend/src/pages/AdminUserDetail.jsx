import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useDeleteUser, useResetPassword, useSetActive, useSetMentors, useUsers } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading } from '../components/ui';
import { ActiveBadge, RoleBadge } from '../components/Badges';
import { ExpertPicker } from '../components/ExpertPicker';
import { TempPassword } from '../components/TempPassword';

function MentorEditor({ u, experts }) {
  const setMentors = useSetMentors();
  const activeIds = new Set(experts.map((e) => e.id));
  const initial = u.mentorIds.filter((id) => activeIds.has(id));
  const hasInactive = initial.length !== u.mentorIds.length;
  const [picked, setPicked] = useState(initial);
  const changed = hasInactive || picked.length !== initial.length || picked.some((id) => !initial.includes(id));

  return (
    <Card className="p-4">
      <h2 className="font-mono text-sm font-medium">Experts</h2>
      <p className="mt-1 text-sm text-muted">A scholar or fellow needs at least one active expert.</p>
      <div className="mt-3"><ExpertPicker experts={experts} value={picked} onChange={setPicked} /></div>
      {hasInactive && (
        <p className="mt-2 text-xs text-judge">
          A deactivated expert is still linked to this person. Saving removes that link.
        </p>
      )}
      {setMentors.error && <div className="mt-3"><ErrorBox message={setMentors.error.message} /></div>}
      <div className="mt-3 flex items-center gap-3">
        <button
          className="btn-primary"
          disabled={setMentors.isPending || picked.length === 0 || !changed}
          onClick={() => setMentors.mutate({ id: u.id, mentorIds: picked })}
        >
          {setMentors.isPending ? 'Saving…' : 'Save experts'}
        </button>
        {setMentors.isSuccess && !changed && <span className="font-mono text-xs text-ac">Saved</span>}
      </div>
    </Card>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const setActive = useSetActive();
  const reset = useResetPassword();
  const del = useDeleteUser();
  const [tempPw, setTempPw] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const u = users.find((x) => String(x.id) === id);
  if (!u) {
    return (
      <Card>
        <EmptyState title="User not found" />
        <p className="pb-6 text-center text-sm">
          <Link to="/admin/users" className="text-brand hover:underline">Back to users</Link>
        </p>
      </Card>
    );
  }

  const isSelf = u.id === me.id;
  const isMentee = u.role === 'SCHOLAR' || u.role === 'FELLOW';
  const experts = users.filter((x) => x.role === 'EXPERT' && x.isActive);
  const mentees = u.role === 'EXPERT' ? users.filter((x) => x.mentorIds.includes(u.id)) : [];

  function toggleActive() {
    if (u.isActive && !window.confirm(`Deactivate ${u.name}? They won't be able to log in, but their history is kept.`)) return;
    setActive.mutate({ id: u.id, isActive: !u.isActive });
  }

  function onReset() {
    if (!window.confirm(`Reset the password for ${u.name}? Their current password stops working.`)) return;
    reset.mutate(u.id, { onSuccess: (d) => setTempPw(d.temporaryPassword) });
  }

  return (
    <>
      <Link to="/admin/users" className="font-mono text-xs text-muted hover:text-fg">← users</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{u.name}</h1>
        <RoleBadge user={u} />
        <ActiveBadge active={u.isActive} />
      </div>
      <p className="-mt-4 mb-6 text-sm text-muted">
        {u.email}
        {u.role !== 'ADMIN' && (
          <> · <Link to={`/members/${u.id}`} className="text-brand hover:underline">View profile</Link></>
        )}
      </p>

      <div className="space-y-4">
        {isMentee && <MentorEditor key={u.mentorIds.join(',')} u={u} experts={experts} />}

        {u.role === 'EXPERT' && (
          <Card className="p-4">
            <h2 className="font-mono text-sm font-medium">Mentees ({mentees.length})</h2>
            {mentees.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No mentees yet. Assign this expert from a scholar's or fellow's page.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {mentees.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <Link to={`/admin/users/${m.id}`} className="hover:text-brand">{m.name}</Link>
                    <span className="font-mono text-xs uppercase text-muted">{m.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card className="p-4">
          <h2 className="font-mono text-sm font-medium">Account</h2>
          {(setActive.error || reset.error) && (
            <div className="mt-3"><ErrorBox message={(setActive.error || reset.error).message} /></div>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="btn-ghost" disabled={setActive.isPending || isSelf} onClick={toggleActive}>
              {u.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
            <button className="btn-ghost" disabled={reset.isPending} onClick={onReset}>
              Reset password
            </button>
          </div>
          {isSelf && <p className="mt-2 text-xs text-muted">You can't deactivate your own account.</p>}
        </Card>

        {tempPw && <TempPassword email={u.email} password={tempPw} onClose={() => setTempPw(null)} />}

        <Card className="border-tle/40 p-4">
          <h2 className="font-mono text-sm font-medium text-tle">Delete account</h2>
          <p className="mt-1 text-sm text-muted">
            This permanently deletes the account, its profile, and all of its task progress and feedback. If this
            person has left the program, deactivate them instead and keep their history.
          </p>
          {isSelf ? (
            <p className="mt-2 text-xs text-muted">You can't delete your own account.</p>
          ) : (
            <>
              <label className="mt-3 block text-sm">
                <span className="text-muted">Type <span className="font-mono text-fg">{u.email}</span> to confirm</span>
                <input className="input mt-1 sm:max-w-sm" value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)} />
              </label>
              {del.error && <div className="mt-3"><ErrorBox message={del.error.message} /></div>}
              <button
                className="btn-ghost mt-3 text-tle"
                disabled={del.isPending || confirmText.trim().toLowerCase() !== u.email.toLowerCase()}
                onClick={() => del.mutate(u.id, { onSuccess: () => navigate('/admin/users', { replace: true }) })}
              >
                {del.isPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </>
          )}
        </Card>
      </div>
    </>
  );
}