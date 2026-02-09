import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getDashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'equipment_manager') return '/equipment-manager';
  return '/equipment';
}

export function GuestOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  return children;
}
