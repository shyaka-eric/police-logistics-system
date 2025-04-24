const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  action: {
    type: String,
    required: true,
    enum: ['view', 'create', 'update', 'delete', 'other']
  },
  module: {
    type: String,
    required: true
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
  userRole: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  metadata: {
    body: Object,
    params: Object,
    query: Object,
    response: Object
  }
}, {
  timestamps: true
});

// Index for efficient querying
logSchema.index({ timestamp: -1 });
logSchema.index({ performedBy: 1 });
logSchema.index({ action: 1 });
logSchema.index({ module: 1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log; 