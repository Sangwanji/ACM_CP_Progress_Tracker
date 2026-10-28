import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';
import MyTasks from './pages/MyTasks';
import MemberTaskDetail from './pages/MemberTaskDetail';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import MyProfile from './pages/MyProfile';


// Scholars and fellows see their own tasks. Experts and admins get the task manager later.
function TasksIndex() {
  const { user } = useAuth();
  const isMember = user.role === 'SCHOLAR' || user.role === 'FELLOW';
  return isMember ? <MyTasks /> : <ComingSoon title="Tasks" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<TasksIndex />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:userId" element={<MemberProfile />} />
          <Route path="/profile" element={<MyProfile />} />

          <Route element={<ProtectedRoute roles={['SCHOLAR', 'FELLOW']} />}>
            <Route path="/tasks/:id" element={<MemberTaskDetail />} />
          </Route>
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