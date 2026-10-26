import { useAuth } from '../auth/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">ACM CP Tracker</span>
          <div className="flex items-center gap-4 text-sm">
            <span>{user.name} <span className="text-gray-500">({user.role.toLowerCase()})</span></span>
            <button onClick={logout} className="text-blue-600 hover:underline">Log out</button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <h2 className="text-lg font-semibold">Welcome, {user.name}</h2>
        {user.mentors?.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Your experts: {user.mentors.map((m) => m.name).join(', ')}
          </p>
        )}
        <p className="text-gray-500 mt-4">Dashboards come next.</p>
      </main>
    </div>
  );
}