import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getDashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'equipment_manager') return '/equipment-manager';
  return '/equipment';
}

export function ProtectedRoute({ children, adminOnly, equipmentManagerOnly, userOnly }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  if (equipmentManagerOnly && user.role !== 'equipment_manager') {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  if (userOnly && ['admin', 'equipment_manager'].includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}
