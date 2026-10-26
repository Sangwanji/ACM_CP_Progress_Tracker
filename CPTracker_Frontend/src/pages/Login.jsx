import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(u.mustChangePassword ? '/change-password' : '/', { replace: true });
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
            <span className="text-ac">$</span> login
          </p>
          <h1 className="mt-2 font-mono text-xl font-bold tracking-tight">
            acm<span className="text-brand">::</span>cp tracker
          </h1>
        </div>
        {error && <ErrorBox message={error} />}
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="input mt-1" autoComplete="username" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="input mt-1" autoComplete="current-password" />
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}