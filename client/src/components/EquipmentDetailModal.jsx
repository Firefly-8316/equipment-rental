import { useState } from 'react';
import './EquipmentDetailModal.css';

export function EquipmentDetailModal({ equipment, onClose, onBook }) {
  if (!equipment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content equipment-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{equipment.name}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="equipment-detail-body">
          <div className="equipment-detail-image">
            {equipment.imageURL ? (
              <img src={equipment.imageURL} alt={equipment.name} />
            ) : (
              <div className="equipment-placeholder">No image</div>
            )}
          </div>
          <div className="equipment-detail-info">
            <span className="equipment-category">{equipment.category}</span>
            <p className="equipment-description">
              {equipment.description || 'No description available.'}
            </p>
            <div className="equipment-detail-price">
              <strong>₹{equipment.rentalPrice}</strong> per day
            </div>
            {(equipment.penaltyPerDay || 0) > 0 && (
              <p className="equipment-penalty">Late return penalty: ₹{equipment.penaltyPerDay} per day</p>
            )}
            <span className={`equipment-badge ${equipment.isAvailable ? 'available' : 'unavailable'}`}>
              {equipment.isAvailable ? 'Available' : 'Currently booked'}
            </span>
            {equipment.isAvailable && (
              <button type="button" className="btn-book" onClick={() => { onClose(); onBook?.(equipment); }}>
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
