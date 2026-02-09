/**
 * Seed script: Creates an admin user for demo/testing.
 * Run: node scripts/seed.js
 * Or: npm run seed (if added to package.json)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const exists = await User.findOne({ email: ADMIN_EMAIL });
    if (exists) {
      if (exists.role === 'admin') {
        console.log(`Admin already exists: ${ADMIN_EMAIL}`);
        process.exit(0);
      }
      exists.role = 'admin';
      await exists.save();
      console.log(`Updated ${ADMIN_EMAIL} to admin role`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);
      await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashed, role: 'admin' });
      console.log(`Created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
