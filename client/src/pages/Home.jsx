import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'equipment_manager') return <Navigate to="/equipment-manager" replace />;
    return <Navigate to="/equipment" replace />;
  }

  return (
    <div className="home">
      <div className="hero">
        <h1>Equipment Rental Management System</h1>
        <p>Browse, book, and manage equipment rentals with ease.</p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary">Get Started</Link>
          <Link to="/login" className="btn-secondary">Login</Link>
        </div>
      </div>
      <div className="features">
        <div className="feature">
          <h3>Browse Equipment</h3>
          <p>View available equipment with prices and availability.</p>
        </div>
        <div className="feature">
          <h3>Book Online</h3>
          <p>Select duration and confirm your rental in seconds.</p>
        </div>
        <div className="feature">
          <h3>Track Status</h3>
          <p>Monitor your booking status from Booked to Returned.</p>
        </div>
      </div>
    </div>
  );
}
