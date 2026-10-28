const PLATFORMS = [
  ['leetcodeHandle', 'LC', 'LeetCode', (h) => `https://leetcode.com/u/${encodeURIComponent(h)}`],
  ['codeforcesHandle', 'CF', 'Codeforces', (h) => `https://codeforces.com/profile/${encodeURIComponent(h)}`],
  ['codechefHandle', 'CC', 'CodeChef', (h) => `https://www.codechef.com/users/${encodeURIComponent(h)}`],
];

export function HandleChips({ profile }) {
  const items = PLATFORMS.filter(([key]) => profile[key]);
  if (items.length === 0) return <p className="text-sm text-muted">No handles added.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([key, tag, name, url]) => (
        <a
          key={key}
          href={url(profile[key])}
          target="_blank"
          rel="noopener noreferrer"
          title={name}
          className="inline-flex items-center gap-1.5 rounded border border-line px-2 py-0.5 font-mono text-xs hover:border-brand hover:text-brand"
        >
          <span className="text-muted">{tag}</span>
          {profile[key]}
        </a>
      ))}
    </div>
  );
}