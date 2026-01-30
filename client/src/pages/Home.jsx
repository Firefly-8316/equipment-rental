import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Equipment Rental Management System</h1>
        <p>Browse, book, and manage equipment rentals with ease.</p>
        {user ? (
          <div className="hero-actions">
            <Link to="/equipment" className="btn-primary">Browse Equipment</Link>
            <Link to="/bookings" className="btn-secondary">My Bookings</Link>
          </div>
        ) : (
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-secondary">Login</Link>
          </div>
        )}
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
