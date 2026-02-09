const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  rentalPrice: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  imageURL: {
    type: String,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  condition: {
    type: String,
    enum: ['Good', 'Damaged', 'Unavailable'],
    default: 'Good',
  },
  conditionNotes: {
    type: String,
    default: '',
  },
  penaltyPerDay: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Equipment', equipmentSchema);
