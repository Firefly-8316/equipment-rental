const express = require('express');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const { protect, equipmentManager } = require('../middleware/auth');

const router = express.Router();

router.use(protect, equipmentManager);

router.get('/stats', async (req, res) => {
  try {
    const [equipmentCount, availableCount, bookings] = await Promise.all([
      Equipment.countDocuments(),
      Equipment.countDocuments({ isAvailable: true }),
      Booking.find().populate('equipment'),
    ]);
    const byStatus = { Booked: 0, Rented: 0, Returned: 0 };
    const damagedCount = await Equipment.countDocuments({ condition: 'Damaged' });
    const unavailableCount = await Equipment.countDocuments({ condition: 'Unavailable' });
    bookings.forEach((b) => {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    });
    res.json({
      equipmentCount,
      availableCount,
      bookings: byStatus,
      totalBookings: bookings.length,
      damagedCount,
      unavailableCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
