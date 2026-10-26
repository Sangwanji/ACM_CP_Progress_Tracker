import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function navFor(user) {
  const items = [{ to: '/', label: 'Dashboard', end: true }];
  if (user.role === 'SCHOLAR' || user.role === 'FELLOW') items.push({ to: '/tasks', label: 'My tasks' });
  if (user.role === 'EXPERT') {
    items.push({ to: '/review', label: 'Review queue' }, { to: '/tasks', label: 'Tasks' });
  }
  if (user.role === 'ADMIN') items.push({ to: '/tasks', label: 'Tasks' });
  items.push({ to: '/members', label: 'Members' });
  if (user.isAdmin) items.push({ to: '/admin/users', label: 'Users' });
  items.push({ to: '/profile', label: 'My profile' });
  return items;
}

function NavLinks({ items }) {
  return items.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
          isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'
        }`
      }
    >
      {item.label}
    </NavLink>
  ));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const items = navFor(user);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-mono text-base font-bold tracking-tight">
            acm<span className="text-brand">::</span>cp
          </span>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLinks items={items} />
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.name}</span>
            <span className="rounded border border-line px-1.5 py-0.5 font-mono text-xs uppercase text-muted">
              {user.role}
            </span>
            <button onClick={logout} className="text-muted hover:text-fg">
              Log out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          <NavLinks items={items} />
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}