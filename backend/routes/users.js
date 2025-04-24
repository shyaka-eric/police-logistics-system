const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { verifyToken, isSystemAdmin } = require('../middleware/auth');
const Log = require('../models/Log');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the status change
    await new Log({
      action: 'UPDATE_USER_STATUS',
      details: `User status updated to ${status}`,
      performedBy: req.userId,
      affectedUser: user._id
    }).save();

    res.json(user);
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// Update user role
router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the role change
    await new Log({
      action: 'UPDATE_USER_ROLE',
      details: `User role updated to ${role}`,
      performedBy: req.userId,
      affectedUser: user._id
    }).save();

    res.json(user);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// Create new user
router.post('/', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username: email,
      name,
      email,
      password: hashedPassword,
      role,
      status: 'active' // Set default status to active
    });

    await newUser.save();
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Update user
router.put('/:id', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      _id: { $ne: userId },
      email
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name,
        email,
        username: email,
        role,
        status
      },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Delete user
router.delete('/:id', verifyToken, isSystemAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router; 