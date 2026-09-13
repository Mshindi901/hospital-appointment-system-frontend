import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function RoleRoute({ allowedRoles, redirectTo = '/login' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking access..." />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const dashboardMap = {
      admin: '/admin',
      manager: '/manager',
      doctor: '/doctor',
    };

    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return <Outlet />;
}
