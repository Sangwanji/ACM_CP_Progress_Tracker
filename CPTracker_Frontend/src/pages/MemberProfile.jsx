import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../lib/queries';
import { Card, EmptyState, ErrorBox, Loading } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { HandleChips } from '../components/HandleChips';
import { yearLabel } from '../lib/format';

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function MemberProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { data: p, isLoading, error } = useProfile(userId);

  if (isLoading) return <Loading />;
  if (error?.status === 404) {
    return (
      <Card>
        <EmptyState title="Profile not found" />
        <p className="pb-6 text-center text-sm">
          <Link to="/members" className="text-brand hover:underline">Back to members</Link>
        </p>
      </Card>
    );
  }
  if (error) return <ErrorBox message={error.message} />;

  const isMe = p.userId === user.id;

  return (
    <>
      <Link to="/members" className="font-mono text-xs text-muted hover:text-fg">← members</Link>

      <Card className="mt-3 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={p.name} url={p.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{p.name}</h1>
            <p className="font-mono text-xs uppercase text-muted">{p.role}</p>
          </div>
          {isMe && <Link to="/profile" className="btn-ghost">Edit profile</Link>}
        </div>

        {p.bio && <p className="mt-4 whitespace-pre-wrap text-sm">{p.bio}</p>}

        <div className="mt-4"><HandleChips profile={p} /></div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <Row label="Year">{yearLabel(p.year)}</Row>
          <Row label="Branch">{p.branch}</Row>
          <Row label="Roll number">{p.rollNo}</Row>
          <Row label="Email">
            <a href={`mailto:${p.email}`} className="text-brand hover:underline">{p.email}</a>
          </Row>
          {/* phone is only returned when you are allowed to see it */}
          <Row label="Phone">{p.phone}</Row>
          <Row label="Experts">
            {p.mentors.length > 0 ? p.mentors.map((m) => m.name).join(', ') : null}
          </Row>
        </dl>
      </Card>
    </>
  );
}