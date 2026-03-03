import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './EMBookings.css';
import { PaymentModal } from '../components/PaymentModal';
import { useRef } from 'react';

const STATUS_OPTIONS = ['Booked', 'Rented', 'Returned', 'Cancelled'];

export function EMBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);
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

  const computePenalty = (b) => {
    // Prefer server-recorded penaltyAmount when available
    if (typeof b.penaltyAmount === 'number' && b.penaltyAmount > 0) {
      return b.penaltyAmount;
    }
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
    <div className="em-bookings">
      <div className="em-bookings-header">
        <h2>Bookings</h2>
        <p className="em-bookings-hint">Assign equipment (Booked → Rented) and record returns (Rented → Returned)</p>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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
                  <td>
                    <div>{formatDateTime(b.startDate)}</div>
                    <div className="muted">{formatDateTime(b.endDate)}</div>
                  </td>
                  <td>₹{b.totalAmount}</td>
                  <td>{computePenalty(b) > 0 ? `₹${computePenalty(b)}` : '—'}</td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td>
                    <span className={`booking-status status-${b.status.toLowerCase()}`}>{b.status}</span>
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
                    {/* show penalty / outstanding if any */}
                    {(() => {
                      const penalty = computePenalty(b);
                      if (penalty <= 0) return null;
                      const outstanding = b.outstandingAmount || 0;
                      const collected =
                        penalty > 0 &&
                        outstanding === 0 &&
                        (b.paymentStatus === 'Paid' || b.penaltyPaidAt);
                      const statusText = outstanding > 0
                        ? 'Not collected'
                        : collected
                        ? 'Collected'
                        : 'Included in total';
                      return (
                        <div style={{ marginTop: 8 }}>
                          <div className="booking-penalty">
                            Penalty: ₹{penalty}{' '}
                            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>({statusText})</span>
                          </div>
                          {outstanding > 0 && (
                            <button
                              type="button"
                              className="btn-pay"
                              onClick={async () => {
                                setUpdating(b._id);
                                try {
                                  await api.post(`/bookings/${b._id}/penalty/pay`);
                                  fetchBookings();
                                } catch (err) {
                                  setError(err.message || 'Collect failed');
                                } finally {
                                  setUpdating(null);
                                }
                              }}
                            >
                              Collect Penalty
                            </button>
                          )}
                        </div>
                      );
                    })()}
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
