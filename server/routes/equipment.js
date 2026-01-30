const express = require('express');
const Equipment = require('../models/Equipment');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { available } = req.query;
    const filter = {};
    if (available === 'true') filter.isAvailable = true;
    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, rentalPrice, category, imageURL, isAvailable } = req.body;
    if (!name || rentalPrice === undefined) {
      return res.status(400).json({ message: 'Name and rental price are required' });
    }
    const equipment = await Equipment.create({
      name,
      description: description || '',
      rentalPrice: Number(rentalPrice),
      category: category || 'General',
      imageURL: imageURL || '',
      isAvailable: isAvailable !== false,
    });
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
