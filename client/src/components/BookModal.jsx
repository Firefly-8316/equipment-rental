import { useState } from 'react';
import { api } from '../services/api';
import './BookModal.css';

export function BookModal({ equipment, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0];
  const [rentalType, setRentalType] = useState('days');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  // days-mode duration
  const [rentalDuration, setRentalDuration] = useState(1);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  // hours-mode duration: hours + minutes
  const [rentalHours, setRentalHours] = useState(1);
  const [rentalMinutes, setRentalMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateTotal = () => {
    if (!equipment) return 0;
    if (rentalType === 'hours') {
      const hrs = Math.max(0, Number(rentalHours) || 0);
      const mins = Math.max(0, Number(rentalMinutes) || 0);
      const totalHours = hrs + mins / 60;
      const effectiveHours = Math.max(1 / 60, totalHours); // at least 1 minute
      const days = Math.ceil(effectiveHours / 24);
      return equipment.rentalPrice * Math.max(1, days);
    }
    let days = Number(rentalDuration) || 1;
    if (endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    }
    return equipment.rentalPrice * Math.max(1, days);
  };

  const total = calculateTotal();
  const penaltyPerDay = equipment?.penaltyPerDay || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // build payload
      let payload = {
        equipmentId: equipment._id,
        startDate,
        startTime,
        rentalType,
        endDate: rentalType === 'days' && endDate ? endDate : undefined,
        endTime: rentalType === 'days' && endDate ? endTime : undefined,
      };
      if (rentalType === 'hours') {
        const hrs = Math.max(0, Number(rentalHours) || 0);
        const mins = Math.max(0, Number(rentalMinutes) || 0);
        const totalHours = hrs + mins / 60;
        if (totalHours <= 0) {
          setError('Please specify a duration greater than 0 minutes');
          setLoading(false);
          return;
        }
        payload.rentalDuration = Number(totalHours.toFixed(3));
      } else {
        payload.rentalDuration = Math.max(1, Number(rentalDuration));
      }
      await api.post('/bookings', payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content book-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book: {equipment?.name}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}
          <p className="modal-price">₹{equipment?.rentalPrice} per day</p>
          {penaltyPerDay > 0 && (
            <p className="modal-penalty">Late return penalty: ₹{penaltyPerDay} per day</p>
          )}

          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            required
          />

          <label>Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <label>Rental Type</label>
          <select value={rentalType} onChange={(e) => setRentalType(e.target.value)}>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>

          {rentalType === 'hours' ? (
            <>
              <label>Duration (hours & minutes)</label>
              <div className="duration-options">
                <input
                  type="number"
                  min="0"
                  value={rentalHours}
                  onChange={(e) => setRentalHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="Hours"
                />
                <span className="option-divider">hrs</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={rentalMinutes}
                  onChange={(e) => setRentalMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  placeholder="Minutes"
                />
                <span className="option-divider">mins</span>
              </div>
            </>
          ) : (
            <>
              <label>Duration (days) OR End Date</label>
              <div className="duration-options">
                <input
                  type="number"
                  min="1"
                  placeholder="Days"
                  value={!endDate ? rentalDuration : ''}
                  onChange={(e) => {
                    setRentalDuration(Math.max(1, parseInt(e.target.value, 10) || 1));
                    setEndDate('');
                  }}
                />
                <span className="option-divider">or</span>
                <input
                  type="date"
                  placeholder="End date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (e.target.value) setRentalDuration(1);
                  }}
                />
              </div>
              {endDate && (
                <>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </>
              )}
            </>
          )}

          <p className="modal-total">Total: ₹{total}</p>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
