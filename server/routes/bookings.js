const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { equipmentId, rentalDuration } = req.body;
    if (!equipmentId || !rentalDuration) {
      return res.status(400).json({ message: 'Equipment and rental duration are required' });
    }
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    if (!equipment.isAvailable) {
      return res.status(400).json({ message: 'Equipment is not available' });
    }
    const totalAmount = equipment.rentalPrice * Number(rentalDuration);
    const booking = await Booking.create({
      user: req.user._id,
      equipment: equipmentId,
      rentalDuration: Number(rentalDuration),
      totalAmount,
    });
    await Equipment.findByIdAndUpdate(equipmentId, { isAvailable: false });
    const populated = await Booking.findById(booking._id).populate('equipment').populate('user', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('equipment')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('equipment')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Booked', 'Rented', 'Returned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('equipment').populate('user', 'name email');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (status === 'Returned') {
      await Equipment.findByIdAndUpdate(booking.equipment._id, { isAvailable: true });
    } else if (status === 'Rented') {
      await Equipment.findByIdAndUpdate(booking.equipment._id, { isAvailable: false });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
