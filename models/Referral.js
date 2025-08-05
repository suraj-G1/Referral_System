const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: Number,
    required: true,
    enum: [1, 2, 3] // L1, L2, L3
  },
  creditAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'cancelled'],
    default: 'pending'
  },
  month: {
    type: String,
    required: true // YYYY-MM format
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  creditedAt: {
    type: Date,
    default: null
  }
});

// Index for efficient queries
referralSchema.index({ referrer: 1, month: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ status: 1 });

module.exports = mongoose.model('Referral', referralSchema); 