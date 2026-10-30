import { useState } from 'react';
import { Card } from './ui';

export function TempPassword({ email, password, onClose }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the password is on screen, copy it by hand
    }
  }

  return (
    <Card className="border-judge/40 bg-judge/10 p-4">
      <h2 className="font-mono text-sm font-medium text-judge">Temporary password (shown once)</h2>
      <p className="mt-1 text-sm text-muted">
        Share it privately with {email}. They must change it at first login. You can't see it again, but you can
        reset it.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="rounded border border-line bg-bg px-3 py-2 font-mono text-base tracking-wide">
          {password}
        </code>
        <button className="btn-ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
        {onClose && <button className="btn-ghost" onClick={onClose}>Dismiss</button>}
      </div>
    </Card>
  );
}