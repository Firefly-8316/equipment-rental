import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'equipment_manager') return '/equipment-manager';
    return '/equipment';
  };

  return (
    <nav className="navbar">
      <Link to={user ? getDashboardPath() : '/'} className="navbar-brand">
        Equipment Rental
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            {user.role === 'admin' && (
              <>
                <Link to="/admin">Admin</Link>
                <Link to="/profile">Profile</Link>
              </>
            )}
            {user.role === 'equipment_manager' && (
              <>
                <Link to="/equipment-manager">Equipment Manager</Link>
                <Link to="/profile">Profile</Link>
              </>
            )}
            {(user.role === 'user' || !['admin', 'equipment_manager'].includes(user.role)) && (
              <>
                <Link to="/equipment">Equipment</Link>
                <Link to="/bookings">My Bookings</Link>
                <Link to="/profile">Profile</Link>
              </>
            )}
            <span className="navbar-user">{user.name}</span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
