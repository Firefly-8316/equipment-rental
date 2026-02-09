const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const equipmentManager = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Equipment manager access required' });
  }
  const role = String(req.user.role || '').toLowerCase().replace(/\s+/g, '_');
  const allowed = role === 'admin' || role === 'equipment_manager';
  if (allowed) {
    next();
  } else {
    res.status(403).json({ message: 'Equipment manager access required' });
  }
};

module.exports = { protect, admin, equipmentManager };
