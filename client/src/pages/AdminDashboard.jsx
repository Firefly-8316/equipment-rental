import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './AdminDashboard.css';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p className="loading-msg">Loading...</p>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return null;

  return (
    <div className="admin-dashboard">
      <h2>Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.equipmentCount}</span>
          <span className="stat-label">Total Equipment</span>
          <Link to="equipment">Manage →</Link>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.availableCount}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalBookings}</span>
          <span className="stat-label">Total Bookings</span>
          <Link to="bookings">View all →</Link>
        </div>
        <div className="stat-card highlight">
          <span className="stat-value">₹{stats.totalRevenue}</span>
          <span className="stat-label">Revenue (Paid)</span>
        </div>
      </div>
      <div className="booking-stats">
        <h3>Bookings by Status</h3>
        <div className="status-badges">
          <span className="badge booked">Booked: {stats.bookings?.Booked || 0}</span>
          <span className="badge rented">Rented: {stats.bookings?.Rented || 0}</span>
          <span className="badge returned">Returned: {stats.bookings?.Returned || 0}</span>
        </div>
        <p className="pending-payments">{stats.pendingPayments} payment(s) pending</p>
      </div>
    </div>
  );
}
