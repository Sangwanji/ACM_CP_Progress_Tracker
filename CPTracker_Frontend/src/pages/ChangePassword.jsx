import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';

export default function ChangePassword() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('Use at least 8 characters');
    if (newPassword !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
      await refresh(); // reloads the user so mustChangePassword becomes false
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Change your password</h1>
          {user.mustChangePassword && (
            <p className="text-sm text-gray-500">You are using a temporary password. Choose a new one to continue.</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
        <label className="block text-sm">
          Current password
          <input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2" autoComplete="current-password" />
        </label>
        <label className="block text-sm">
          New password
          <input type="password" required value={newPassword} onChange={(e) => setNew(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2" autoComplete="new-password" />
        </label>
        <label className="block text-sm">
          Confirm new password
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2" autoComplete="new-password" />
        </label>
        <button disabled={busy}
          className="w-full bg-blue-600 text-white rounded py-2 font-medium disabled:opacity-60">
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  );
}