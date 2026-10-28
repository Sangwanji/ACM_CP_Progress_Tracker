import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading, PageHeader } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { HandleChips } from '../components/HandleChips';
import { yearLabel } from '../lib/format';

const TABS = [['all', 'All'], ['SCHOLAR', 'Scholars'], ['FELLOW', 'Fellows']];

export default function Members() {
  const { data, isLoading, error } = useProfiles();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={error.message} />;

  const q = search.trim().toLowerCase();
  const rows = data.filter(
    (p) =>
      (tab === 'all' || p.role === tab) &&
      (!q ||
        [p.name, p.branch, p.leetcodeHandle, p.codeforcesHandle, p.codechefHandle].some(
          (v) => v && v.toLowerCase().includes(q)
        ))
  );

  return (
    <>
      <PageHeader title="Members" subtitle={`${data.length} scholars and fellows`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
                tab === key ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="input max-w-xs"
          placeholder="Search name, branch or handle"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <Card><EmptyState title="No members found" hint="Try a different search or filter." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Card key={p.userId} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} url={p.avatarUrl} />
                <div className="min-w-0">
                  <Link to={`/members/${p.userId}`} className="block truncate font-medium hover:text-brand">
                    {p.name}
                  </Link>
                  <p className="font-mono text-xs text-muted">
                    <span className="uppercase">{p.role}</span>
                    {yearLabel(p.year) && ` · ${yearLabel(p.year)}`}
                    {p.branch && ` · ${p.branch}`}
                  </p>
                </div>
              </div>
              <div className="mt-3"><HandleChips profile={p} /></div>
              {p.mentors.length > 0 && (
                <p className="mt-3 text-xs text-muted">Experts: {p.mentors.map((m) => m.name).join(', ')}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}