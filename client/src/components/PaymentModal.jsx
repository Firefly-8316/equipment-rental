import './PaymentModal.css';

export function PaymentModal({ booking, amount: overrideAmount, onClose }) {
  if (!booking) return null;

  const amount = overrideAmount ?? booking.totalAmount;
  const equipmentName = booking.equipment?.name || 'Equipment';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment Details</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="payment-body">
          <p className="payment-equipment">{equipmentName}</p>
          <p className="payment-amount">Amount to pay: <strong>₹{amount}</strong></p>
          <div className="payment-instructions">
            <h4>Payment Instructions</h4>
            <p>• Bank Transfer: Account XXXX XXXX 1234</p>
            <p>• UPI: equipment@rental</p>
            <p>• Cash/Card at our counter</p>
            <p className="payment-note">Complete payment and inform the admin. Your booking will be marked as paid after verification.</p>
          </div>
          <button type="button" className="btn-done" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
