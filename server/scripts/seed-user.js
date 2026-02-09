/**
 * Seed script: Creates a regular user for demo/testing.
 * Run: node scripts/seed-user.js
 * Or: npm run seed:user
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const USER_EMAIL = process.env.SEED_USER_EMAIL || 'user@example.com';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'user123';
const USER_NAME = process.env.SEED_USER_NAME || 'Demo User';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const exists = await User.findOne({ email: USER_EMAIL });
    if (exists) {
      console.log(`User already exists: ${USER_EMAIL}`);
      console.log(`You can login with: ${USER_EMAIL} / ${USER_PASSWORD}`);
      process.exit(0);
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(USER_PASSWORD, salt);
    await User.create({ name: USER_NAME, email: USER_EMAIL, password: hashed, role: 'user' });
    console.log(`Created user: ${USER_EMAIL} / ${USER_PASSWORD}`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
