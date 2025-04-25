const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get notifications for the current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Create a notification for specific roles
router.post('/create-for-roles', verifyToken, async (req, res) => {
  try {
    const { roles, message } = req.body;
    
    // Find all users with the specified roles
    const users = await User.find({ role: { $in: roles } });
    
    // Create notifications for each user
    const notifications = await Promise.all(
      users.map(user => 
        Notification.create({
          userId: user._id,
          message,
          read: false
        })
      )
    );

    res.status(201).json(notifications);
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({ message: 'Error creating notifications' });
  }
});

// Helper function to create notifications for specific roles
const createNotificationForRoles = async (roles, message) => {
  try {
    const users = await User.find({ role: { $in: roles } });
    return Promise.all(
      users.map(user =>
        Notification.create({
          userId: user._id,
          message,
          read: false
        })
      )
    );
  } catch (error) {
    console.error('Error creating notifications:', error);
    throw error;
  }
};

module.exports = { router, createNotificationForRoles }; 