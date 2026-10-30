import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, ErrorBox } from './ui';

export function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const change = useMutation({
    mutationFn: (body) => api('/auth/change-password', { method: 'POST', body }),
  });

  function onSubmit(e) {
    e.preventDefault();
    setLocalError('');
    change.reset();
    if (next.length < 8) return setLocalError('Use at least 8 characters');
    if (next !== confirm) return setLocalError('Passwords do not match');
    if (next === current) return setLocalError('New password must be different from the current one');

    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
        },
      }
    );
  }

  const error = localError || change.error?.message;

  return (
    <Card className="p-4">
      <h2 className="font-mono text-sm font-medium">Change password</h2>
      <p className="mt-1 text-sm text-muted">Use at least 8 characters.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 sm:max-w-sm">
        <label className="block text-sm">
          <span className="text-muted">Current password</span>
          <input type="password" required className="input mt-1" value={current}
            onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">New password</span>
          <input type="password" required className="input mt-1" value={next}
            onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Confirm new password</span>
          <input type="password" required className="input mt-1" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </label>

        {error && <ErrorBox message={error} />}

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={change.isPending}>
            {change.isPending ? 'Saving…' : 'Update password'}
          </button>
          {change.isSuccess && <span className="font-mono text-xs text-ac">Password changed</span>}
        </div>
      </form>
    </Card>
  );
}