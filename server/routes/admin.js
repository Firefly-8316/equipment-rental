const express = require('express');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', async (req, res) => {
  try {
    const [equipmentCount, availableCount, bookings] = await Promise.all([
      Equipment.countDocuments(),
      Equipment.countDocuments({ isAvailable: true }),
      Booking.find().populate('equipment'),
    ]);
    const byStatus = { Booked: 0, Rented: 0, Returned: 0 };
    let totalRevenue = 0;
    bookings.forEach((b) => {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if ((b.paymentStatus || 'Pending') === 'Paid') totalRevenue += b.totalAmount;
    });
    res.json({
      equipmentCount,
      availableCount,
      bookedCount: equipmentCount - availableCount,
      bookings: byStatus,
      totalBookings: bookings.length,
      totalRevenue,
      pendingPayments: bookings.filter((b) => (b.paymentStatus || 'Pending') === 'Pending').length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'equipment_manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (req.params.id === req.user._id.toString() && role === 'user') {
      return res.status(400).json({ message: 'Cannot demote yourself' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
