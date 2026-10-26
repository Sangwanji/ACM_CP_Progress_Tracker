import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<ComingSoon title="Tasks" />} />
          <Route path="/members" element={<ComingSoon title="Members" />} />
          <Route path="/profile" element={<ComingSoon title="My profile" />} />

          <Route element={<ProtectedRoute roles={['EXPERT']} />}>
            <Route path="/review" element={<ComingSoon title="Review queue" />} />
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin/users" element={<ComingSoon title="Users" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}