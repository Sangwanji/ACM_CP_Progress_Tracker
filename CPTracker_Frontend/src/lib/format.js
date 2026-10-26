export const isOpen = (status) => status === 'TODO' || status === 'IN_PROGRESS';

// Open and past its deadline (shown as TLE)
export const isLate = (status, deadline) => isOpen(status) && new Date(deadline).getTime() < Date.now();

export function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// "3d 04h", "5h 12m", "42m"
export function span(ms) {
  const m = Math.floor(Math.abs(ms) / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h`;
  if (h > 0) return `${h}h ${String(mm).padStart(2, '0')}m`;
  return `${mm}m`;
}

// Only allow http(s) links, so a "javascript:" link can never be clicked
export function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}