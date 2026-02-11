import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './AdminBookings.css';
import { PaymentModal } from '../components/PaymentModal';
import { useRef } from 'react';

const STATUS_OPTIONS = ['Booked', 'Rented', 'Returned'];

export function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentBooking, setPaymentBooking] = useState(null);
  const paymentAmountRef = useRef(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `/bookings?status=${statusFilter}` : '/bookings';
      const data = await api.get(url);
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdating(bookingId);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}`, { status: newStatus });
      fetchBookings();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handlePaymentChange = async (bookingId, paymentStatus) => {
    setUpdating(bookingId);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}`, { paymentStatus });
      fetchBookings();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (b) => {
    if (b.rentalType === 'hours') {
      const totalHours = Number(b.rentalDuration) || 0;
      const hrs = Math.floor(totalHours);
      const mins = Math.round((totalHours - hrs) * 60);
      const parts = [];
      if (hrs > 0) parts.push(`${hrs} hour${hrs !== 1 ? 's' : ''}`);
      if (mins > 0) parts.push(`${mins} min${mins !== 1 ? 's' : ''}`);
      return parts.length ? parts.join(' ') : '0 min';
    }
    if (b.startDate && b.endDate) {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${b.rentalDuration || 1} day${(b.rentalDuration || 1) !== 1 ? 's' : ''}`;
  };

  const computePenalty = (b) => {
    const penaltyPerDay = b.penaltyPerDay || 0;
    if (!penaltyPerDay) return 0;
    const start = b.startDate ? new Date(b.startDate) : null;
    let expectedEnd = b.endDate ? new Date(b.endDate) : null;
    if (!expectedEnd && start) {
      if (b.rentalType === 'hours') {
        expectedEnd = new Date(start.getTime() + (b.rentalDuration || 0) * 60 * 60 * 1000);
      } else {
        expectedEnd = new Date(start);
        expectedEnd.setDate(expectedEnd.getDate() + (b.rentalDuration || 0));
      }
    }
    if (!expectedEnd) return 0;
    const actual = b.returnedAt ? new Date(b.returnedAt) : (b.status === 'Rented' ? new Date() : null);
    if (!actual) return 0;
    if (actual <= expectedEnd) return 0;
    const lateMs = actual - expectedEnd;
    const lateDays = Math.ceil(lateMs / (24 * 60 * 60 * 1000));
    return lateDays * penaltyPerDay;
  };

  if (loading) return <p className="loading-msg">Loading...</p>;
  if (error && bookings.length === 0) return <div className="error-msg">{error}</div>;

  return (
    <div className="admin-bookings">
      <div className="admin-bookings-header">
        <h2>All Bookings</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
      {bookings.length === 0 ? (
        <p className="empty-msg">No bookings yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Equipment</th>
                <th>Duration</th>
                <th>Total</th>
                <th>Fine</th>
                <th>Payment</th>
                <th>Booked On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="customer-cell">
                      <strong>{b.user?.name}</strong>
                      <span>{b.user?.email}</span>
                    </div>
                  </td>
                  <td>{b.equipment?.name}</td>
                  <td>{formatDuration(b)}</td>
                  <td>₹{b.totalAmount}</td>
                  <td>{computePenalty(b) > 0 ? `₹${computePenalty(b)}` : '—'}</td>
                  <td>
                    <select
                      value={b.paymentStatus || 'Pending'}
                      onChange={(e) => handlePaymentChange(b._id, e.target.value)}
                      disabled={updating === b._id}
                      className={`payment-select ${(b.paymentStatus || 'Pending').toLowerCase()}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                    {computePenalty(b) > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div className="booking-penalty">Penalty: ₹{computePenalty(b)}</div>
                        <button
                          type="button"
                          className="btn-pay"
                          onClick={async () => {
                            if ((b.outstandingAmount || 0) > 0) {
                              setUpdating(b._id);
                              try {
                                await api.post(`/bookings/${b._id}/penalty/pay`);
                                fetchBookings();
                              } catch (err) {
                                setError(err.message || 'Collect failed');
                              } finally {
                                setUpdating(null);
                              }
                            } else {
                              paymentAmountRef.current = computePenalty(b);
                              setPaymentBooking(b);
                            }
                          }}
                        >
                          Collect Penalty
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td>
                    <span className={`booking-status status-${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b._id, e.target.value)}
                      disabled={updating === b._id}
                      className="status-select"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {updating === b._id && <span className="updating-text">Updating...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    {paymentBooking && (
      <PaymentModal
        booking={paymentBooking}
        amount={paymentAmountRef.current}
        onClose={() => setPaymentBooking(null)}
      />
    )}
    </div>
  );
}
