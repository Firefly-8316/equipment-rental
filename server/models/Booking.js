const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  rentalType: {
    type: String,
    enum: ['hours', 'days'],
    default: 'days',
  },
  rentalDuration: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  penaltyPerDay: {
    type: Number,
    default: 0,
  },
  returnedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Booked', 'Rented', 'Returned'],
    default: 'Booked',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  paymentAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
