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
import StaffTasks from './pages/StaffTasks';
import StaffTaskDetail from './pages/StaffTaskDetail';
import NewTask from './pages/NewTask';
import ReviewQueue from './pages/ReviewQueue';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import MyProfile from './pages/MyProfile';
import EditTask from './pages/EditTask';
import AdminUsers from './pages/AdminUsers';
import AdminNewUser from './pages/AdminNewUser';
import AdminUserDetail from './pages/AdminUserDetail';

const isMember = (user) => user.role === 'SCHOLAR' || user.role === 'FELLOW';

// Same path, different screen by role
function TasksIndex() {
  const { user } = useAuth();
  return isMember(user) ? <MyTasks /> : <StaffTasks />;
}
function TaskDetailIndex() {
  const { user } = useAuth();
  return isMember(user) ? <MemberTaskDetail /> : <StaffTaskDetail />;
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
          <Route path="/tasks/:id" element={<TaskDetailIndex />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:userId" element={<MemberProfile />} />
          <Route path="/profile" element={<MyProfile />} />

          <Route element={<ProtectedRoute roles={['EXPERT']} />}>
            <Route path="/tasks/new" element={<NewTask />} />
            <Route path="/tasks/:id/edit" element={<EditTask />} />
            <Route path="/review" element={<ReviewQueue />} />
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/new" element={<AdminNewUser />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}