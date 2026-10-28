import { safeHref } from '../lib/format';

export function ExternalLink({ url, label }) {
  const href = safeHref(url);
  if (!href) return <span className="break-all text-muted">{label || url}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
      {label || url}
    </a>
  );
}