import { useNow } from '../lib/useNow';
import { isOpen, span } from '../lib/format';

// T-3d 04h before the deadline, T+2d 01h after it. Shown only for open tasks.
export function Countdown({ deadline, status }) {
  const now = useNow();
  if (!isOpen(status)) return null;
  const ms = new Date(deadline).getTime() - now;
  const cls = ms < 0 ? 'text-tle' : ms < 86400000 ? 'text-judge' : 'text-muted';
  return (
    <span className={`font-mono text-xs ${cls}`}>
      {ms < 0 ? 'T+' : 'T-'}{span(ms)}
    </span>
  );
}