import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loading } from '../components/ui';

export default function ProtectedRoute({ roles, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}