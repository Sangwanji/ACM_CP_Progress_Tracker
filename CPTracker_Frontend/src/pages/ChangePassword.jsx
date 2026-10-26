import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { ErrorBox, Loading } from '../components/ui';

export default function ChangePassword() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('Use at least 8 characters');
    if (newPassword !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-line bg-surface p-6">
        <div>
          <p className="font-mono text-sm text-muted">
            <span className="text-ac">$</span> passwd
          </p>
          <h1 className="mt-2 text-xl font-semibold">Change your password</h1>
          {user.mustChangePassword && (
            <p className="mt-1 text-sm text-muted">
              You are using a temporary password. Choose a new one to continue.
            </p>
          )}
        </div>
        {error && <ErrorBox message={error} />}
        <label className="block text-sm">
          <span className="text-muted">Current password</span>
          <input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)}
            className="input mt-1" autoComplete="current-password" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">New password</span>
          <input type="password" required value={newPassword} onChange={(e) => setNew(e.target.value)}
            className="input mt-1" autoComplete="new-password" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Confirm new password</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="input mt-1" autoComplete="new-password" />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  );
}