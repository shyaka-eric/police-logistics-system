const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('📝 Registration attempt:', { name, email, role });

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if this is the first user (allow them to be SystemAdmin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const assignedRole = isFirstUser ? 'SystemAdmin' : (role || 'UnitLeader');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username: email,
      name,
      email,
      password: hashedPassword,
      role: assignedRole
    });

    await user.save();
    console.log('✅ User created:', { id: user._id, role: user.role });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('👤 Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password validation:', isPasswordValid ? 'success' : 'failed');
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      console.log('❌ User is inactive:', email);
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact your system administrator.',
        status: 'inactive'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log('🎟️ Token generated for user:', user.email);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router; 