import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';
import './Bookings.css';
import { useRef } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Booked', label: 'Booked' },
  { value: 'Rented', label: 'Rented' },
  { value: 'Returned', label: 'Returned' },
];

export function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentBooking, setPaymentBooking] = useState(null);
  const paymentAmountRef = useRef(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `/bookings/user?status=${statusFilter}` : '/bookings/user';
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
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

  const getDurationText = (b) => {
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

  if (loading) return <div className="page"><p className="loading-msg">Loading...</p></div>;
  if (error) return <div className="page"><div className="error-msg">{error}</div></div>;

  return (
    <div className="page bookings-page">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {bookings.length === 0 ? (
        <p className="empty-msg">You have no bookings yet. Browse equipment and make your first booking!</p>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b._id} className="booking-card">
              <div className="booking-main">
                <div className="booking-equipment">
                  <h3>{b.equipment?.name || 'Unknown'}</h3>
                  <span className="booking-category">{b.equipment?.category}</span>
                </div>
                <span className={`booking-status status-${b.status.toLowerCase()}`}>
                  {b.status}
                </span>
              </div>
              <div className="booking-details">
                <p><strong>Start:</strong> {formatDateTime(b.startDate)}</p>
                <p><strong>End:</strong> {formatDateTime(b.endDate)}</p>
                <p><strong>Duration:</strong> {getDurationText(b)}</p>
                <p><strong>Total:</strong> ₹{b.totalAmount}</p>
                {(b.penaltyPerDay || 0) > 0 && (
                  <>
                    <p className="booking-penalty"><strong>Late return penalty:</strong> ₹{b.penaltyPerDay}/day</p>
                    {computePenalty(b) > 0 && (
                      <p className="booking-penalty"><strong>Penalty due:</strong> ₹{computePenalty(b)}</p>
                    )}
                  </>
                )}
                <p>
                  <strong>Payment:</strong>{' '}
                  <span className={`payment-badge ${(b.paymentStatus || 'Pending').toLowerCase()}`}>
                    {b.paymentStatus || 'Pending'}
                  </span>
                  {(() => {
                    const penalty = computePenalty(b);
                    if ((b.paymentStatus || 'Pending') === 'Pending') {
                      // user needs to pay base total + penalty
                      paymentAmountRef.current = (b.totalAmount || 0) + (penalty || 0);
                      return (
                        <button
                          type="button"
                          className="btn-pay"
                          onClick={() => setPaymentBooking(b)}
                        >
                          Pay Now
                        </button>
                      );
                    }
                    if ((b.paymentStatus || 'Pending') === 'Paid' && penalty > 0) {
                      // booking paid, but penalty outstanding — prefer calling API only if outstandingAmount recorded
                      if ((b.outstandingAmount || 0) > 0) {
                        return (
                          <button
                            type="button"
                            className="btn-pay"
                            onClick={async () => {
                              try {
                                await api.post(`/bookings/${b._id}/penalty/pay`);
                                fetchBookings();
                              } catch (err) {
                                setError(err.message || 'Payment failed');
                              }
                            }}
                          >
                            Pay Penalty
                          </button>
                        );
                      }
                      // no outstanding recorded — open payment modal so user can pay penalty manually (frontend preview)
                      paymentAmountRef.current = penalty;
                      return (
                        <button
                          type="button"
                          className="btn-pay"
                          onClick={() => setPaymentBooking(b)}
                        >
                          Pay Penalty
                        </button>
                      );
                    }
                    return null;
                  })()}
                </p>
                <p><strong>Booked on:</strong> {formatDate(b.createdAt)}</p>
              </div>
            </div>
          ))}
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
