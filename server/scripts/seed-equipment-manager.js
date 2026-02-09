/**
 * Seed script: Creates an equipment manager user for demo/testing.
 * Run: node scripts/seed-equipment-manager.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const EM_EMAIL = process.env.SEED_EM_EMAIL || 'manager@example.com';
const EM_PASSWORD = process.env.SEED_EM_PASSWORD || 'manager123';
const EM_NAME = process.env.SEED_EM_NAME || 'Equipment Manager';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const exists = await User.findOne({ email: EM_EMAIL });
    if (exists) {
      if (exists.role === 'equipment_manager') {
        console.log(`Equipment manager already exists: ${EM_EMAIL}`);
        process.exit(0);
      }
      exists.role = 'equipment_manager';
      await exists.save();
      console.log(`Updated ${EM_EMAIL} to equipment_manager role`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(EM_PASSWORD, salt);
      await User.create({ name: EM_NAME, email: EM_EMAIL, password: hashed, role: 'equipment_manager' });
      console.log(`Created equipment manager: ${EM_EMAIL} / ${EM_PASSWORD}`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
