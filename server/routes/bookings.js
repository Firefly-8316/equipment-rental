const express = require('express');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { protect, admin, equipmentManager } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { equipmentId, startDate, startTime, rentalType, rentalDuration, endDate, endTime } = req.body;
    if (!equipmentId) {
      return res.status(400).json({ message: 'Equipment is required' });
    }
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    if (!equipment.isAvailable) {
      return res.status(400).json({ message: 'Equipment is not available' });
    }

    let startDateTime;
    let endDateTime;
    let durationDays;
    let totalAmount;

    if (rentalType === 'hours') {
      const start = new Date(startDate);
      if (startTime) {
        const [h, m] = startTime.split(':').map(Number);
        start.setHours(h || 0, m || 0, 0, 0);
      }
      startDateTime = start;
      const hours = Number(rentalDuration) || 1;
      endDateTime = new Date(start.getTime() + hours * 60 * 60 * 1000);
      durationDays = Math.ceil(hours / 24);
      totalAmount = equipment.rentalPrice * Math.max(1, durationDays);
    } else {
      const start = new Date(startDate);
      if (startTime) {
        const [h, m] = startTime.split(':').map(Number);
        start.setHours(h || 0, m || 0, 0, 0);
      }
      startDateTime = start;
      if (endDate) {
        endDateTime = new Date(endDate);
        if (endTime) {
          const [h, m] = endTime.split(':').map(Number);
          endDateTime.setHours(h || 0, m || 0, 0, 0);
        }
        durationDays = Math.ceil((endDateTime - startDateTime) / (24 * 60 * 60 * 1000));
      } else {
        const days = Math.max(1, Number(rentalDuration) || 1);
        endDateTime = new Date(start);
        endDateTime.setDate(endDateTime.getDate() + days);
        durationDays = days;
      }
      totalAmount = equipment.rentalPrice * durationDays;
    }

    const penaltyPerDay = equipment.penaltyPerDay || 0;

    const booking = await Booking.create({
      user: req.user._id,
      equipment: equipmentId,
      startDate: startDateTime,
      endDate: endDateTime,
      rentalType: rentalType || 'days',
      rentalDuration: rentalType === 'hours' ? Number(rentalDuration) : durationDays,
      totalAmount,
      penaltyPerDay,
    });
    await Equipment.findByIdAndUpdate(equipmentId, { isAvailable: false });
    const populated = await Booking.findById(booking._id).populate('equipment').populate('user', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Collect penalty / mark penalty as paid
router.post('/:id/penalty/pay', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Authorization: allow equipment managers/admins OR the booking owner
    const role = String(req.user.role || '').toLowerCase().replace(/\s+/g, '_');
    const isManager = role === 'admin' || role === 'equipment_manager';
    const isOwner = String(booking.user) === String(req.user._id);
    if (!isManager && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to collect penalty for this booking' });
    }

    const outstanding = booking.outstandingAmount || 0;
    // If booking was unpaid and penalty was added to totalAmount, user may pay totalAmount instead.
    // For this endpoint we only accept collecting outstandingAmount.
    if (outstanding <= 0) {
      return res.status(400).json({ message: 'No outstanding penalty to collect' });
    }
    booking.outstandingAmount = 0;
    booking.penaltyPaidAt = new Date();
    await booking.save();
    const populated = await Booking.findById(booking._id).populate('equipment').populate('user', 'name email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const bookings = await Booking.find(filter)
      .populate('equipment')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, equipmentManager, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const bookings = await Booking.find(filter)
      .populate('equipment')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', protect, equipmentManager, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    // fetch existing booking to determine previous status and timestamps
    const existing = await Booking.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const update = {};

    if (status) {
      if (!['Booked', 'Rented', 'Returned'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // If booking was just returned, allow a short window (1 minute) to revert the change
      if (existing.status === 'Returned' && (status === 'Rented' || status === 'Booked')) {
        const returnedAt = existing.returnedAt;
        const now = Date.now();
        if (!returnedAt || (now - new Date(returnedAt).getTime()) > 60 * 1000) {
          return res.status(400).json({ message: 'Cannot revert status after 1 minute of returning' });
        }
        update.status = status;
        // clear returnedAt when reverting
        update.returnedAt = undefined;
      } else if (status === 'Returned') {
        update.status = 'Returned';
        update.returnedAt = new Date();
        // compute penalty if not already computed
        const penaltyPerDay = existing.penaltyPerDay || 0;
        if (penaltyPerDay) {
          // only compute if not already set
          if (!existing.penaltyAmount || existing.penaltyAmount === 0) {
            // determine expected end
            let expectedEnd = existing.endDate ? new Date(existing.endDate) : null;
            if (!expectedEnd && existing.startDate) {
              const start = new Date(existing.startDate);
              if (existing.rentalType === 'hours') {
                expectedEnd = new Date(start.getTime() + (existing.rentalDuration || 0) * 60 * 60 * 1000);
              } else {
                expectedEnd = new Date(start);
                expectedEnd.setDate(expectedEnd.getDate() + (existing.rentalDuration || 0));
              }
            }
            const actualReturn = update.returnedAt || new Date();
            let penaltyAmount = 0;
            if (expectedEnd && actualReturn > expectedEnd) {
              const lateMs = actualReturn - expectedEnd;
              const lateDays = Math.ceil(lateMs / (24 * 60 * 60 * 1000));
              penaltyAmount = lateDays * penaltyPerDay;
            }
            if (penaltyAmount > 0) {
              update.penaltyAmount = penaltyAmount;
              // if booking already paid, record outstanding amount for penalty
              if (existing.paymentStatus === 'Paid') {
                update.outstandingAmount = (existing.outstandingAmount || 0) + penaltyAmount;
              } else {
                // booking not paid yet: add penalty to total so payment will cover it
                update.totalAmount = (existing.totalAmount || 0) + penaltyAmount;
              }
            }
          }
        }
      } else {
        update.status = status;
      }
    }

    if (paymentStatus) {
      if (!['Pending', 'Paid'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }

      // If booking was just paid, allow a short window (1 minute) to revert the change
      if (existing.paymentStatus === 'Paid' && paymentStatus === 'Pending') {
        const paidAt = existing.paymentAt;
        const now = Date.now();
        if (!paidAt || (now - new Date(paidAt).getTime()) > 60 * 1000) {
          return res.status(400).json({ message: 'Cannot revert payment status after 1 minute of payment' });
        }
        update.paymentStatus = 'Pending';
        // clear paymentAt when reverting
        update.paymentAt = undefined;
      } else if (paymentStatus === 'Paid') {
        update.paymentStatus = 'Paid';
        update.paymentAt = new Date();
      } else {
        update.paymentStatus = paymentStatus;
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('equipment').populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update equipment availability based on new status
    if (update.status === 'Returned') {
      await Equipment.findByIdAndUpdate(booking.equipment._id, { isAvailable: true });
    } else if (update.status === 'Rented' || update.status === 'Booked') {
      await Equipment.findByIdAndUpdate(booking.equipment._id, { isAvailable: false });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
