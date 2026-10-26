import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// roles: optional list of allowed roles. adminOnly: requires the admin flag.
export default function ProtectedRoute({ roles, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}