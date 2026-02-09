import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './EMOverview.css';

export function EMOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/equipment-manager/stats');
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
    <div className="em-overview">
      <h2>Overview</h2>
      <div className="em-stats-grid">
        <div className="em-stat-card">
          <span className="em-stat-value">{stats.equipmentCount}</span>
          <span className="em-stat-label">Total Equipment</span>
          <Link to="equipment">Manage →</Link>
        </div>
        <div className="em-stat-card">
          <span className="em-stat-value">{stats.availableCount}</span>
          <span className="em-stat-label">Available</span>
        </div>
        <div className="em-stat-card">
          <span className="em-stat-value">{stats.totalBookings}</span>
          <span className="em-stat-label">Total Bookings</span>
          <Link to="bookings">View all →</Link>
        </div>
        <div className="em-stat-card warning">
          <span className="em-stat-value">{stats.damagedCount || 0}</span>
          <span className="em-stat-label">Damaged</span>
        </div>
        <div className="em-stat-card warning">
          <span className="em-stat-value">{stats.unavailableCount || 0}</span>
          <span className="em-stat-label">Unavailable</span>
        </div>
      </div>
      <div className="em-booking-stats">
        <h3>Bookings by Status</h3>
        <div className="em-status-badges">
          <span className="badge booked">Booked: {stats.bookings?.Booked || 0}</span>
          <span className="badge rented">Rented: {stats.bookings?.Rented || 0}</span>
          <span className="badge returned">Returned: {stats.bookings?.Returned || 0}</span>
        </div>
      </div>
    </div>
  );
}
