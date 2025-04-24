const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE_USER',
      'UPDATE_USER_STATUS',
      'UPDATE_USER_ROLE',
      'CREATE_STOCK',
      'UPDATE_STOCK',
      'DELETE_STOCK',
      'CREATE_REPAIR_REQUEST',
      'UPDATE_REPAIR_STATUS',
      'ADD_REPAIR_REMARK'
    ]
  },
  details: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  affectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  affectedStock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  },
  affectedRepair: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairRequest'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
});

// Index for efficient querying
logSchema.index({ timestamp: -1 });
logSchema.index({ performedBy: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log; 