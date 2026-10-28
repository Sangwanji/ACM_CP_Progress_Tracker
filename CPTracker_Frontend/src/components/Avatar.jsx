import { useState } from 'react';
import { safeHref } from '../lib/format';

const SIZES = { md: 'h-10 w-10 text-sm', lg: 'h-20 w-20 text-2xl' };

// Shows the photo if the link is https and loads, otherwise initials
export function Avatar({ name = '', url, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const src = url && safeHref(url)?.startsWith('https://') ? url : null;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const cls = `${SIZES[size]} shrink-0 rounded-full border border-line`;

  if (src && !failed) {
    return (
      <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)}
        className={`${cls} object-cover`} />
    );
  }
  return (
    <span className={`${cls} flex items-center justify-center bg-surface-2 font-mono font-bold text-brand`}>
      {initials || '?'}
    </span>
  );
}