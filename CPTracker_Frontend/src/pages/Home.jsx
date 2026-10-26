import { useAuth } from '../auth/AuthContext';
import { Card, PageHeader } from '../components/ui';
import { StatusBadge, DifficultyBadge } from '../components/StatusBadge';
import MemberDashboard from './MemberDashboard';


export default function Home() {
  const { user } = useAuth();
  if (user.role === 'SCHOLAR' || user.role === 'FELLOW') return <MemberDashboard />;
  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Dashboards are coming next." />

      {user.mentors?.length > 0 && (
        <Card className="mb-4 p-4">
          <p className="text-sm text-muted">Your experts</p>
          <p className="mt-1">{user.mentors.map((m) => m.name).join(', ')}</p>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="font-mono text-sm font-medium">Verdict legend</h2>
        <p className="mt-1 text-sm text-muted">Task progress is shown like contest verdicts.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['TODO', false, 'Not started'],
            ['IN_PROGRESS', false, 'You are working on it'],
            ['SUBMITTED', false, 'Submitted, waiting for review'],
            ['DONE', false, 'Marked done by an expert'],
            ['IN_PROGRESS', true, 'Deadline passed, not submitted'],
          ].map(([status, overdue, text]) => (
            <div key={text} className="flex items-center gap-3">
              <StatusBadge status={status} overdue={overdue} />
              <span className="text-sm text-muted">{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          Difficulty: <DifficultyBadge value="Easy" /> <DifficultyBadge value="Medium" /> <DifficultyBadge value="Hard" />
        </div>
      </Card>
    </>
  );
}