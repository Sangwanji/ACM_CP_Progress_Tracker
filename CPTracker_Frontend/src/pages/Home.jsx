import { useAuth } from '../auth/AuthContext';
import MemberDashboard from './MemberDashboard';
import StaffDashboard from './StaffDashboard';

export default function Home() {
  const { user } = useAuth();
  const isMember = user.role === 'SCHOLAR' || user.role === 'FELLOW';
  return isMember ? <MemberDashboard /> : <StaffDashboard />;
}