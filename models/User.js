const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralLevel: {
    type: Number,
    default: 0 // 0 = not referred, 1 = L1, 2 = L2, 3 = L3
  },
  credits: {
    type: Number,
    default: 0
  },
  pendingCredits: {
    type: Number,
    default: 0
  },
  completedRounds: {
    type: Number,
    default: 0
  },
  acceptedReflections: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  monthlyStats: {
    l2Credits: { type: Number, default: 0 },
    l3Credits: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    month: { type: String, default: () => new Date().toISOString().slice(0, 7) } // YYYY-MM format
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if user is eligible for credit conversion
userSchema.methods.isEligibleForCredit = function() {
  return this.completedRounds >= 6 && this.acceptedReflections >= 2;
};

// Method to convert pending credits to actual credits
userSchema.methods.convertPendingCredits = function() {
  if (this.isEligibleForCredit() && this.pendingCredits > 0) {
    const creditsToConvert = this.pendingCredits;
    this.credits += creditsToConvert;
    this.pendingCredits = 0;
    return creditsToConvert;
  }
  return 0;
};

// Method to add fractional credits with auto-conversion
userSchema.methods.addFractionalCredits = function(amount) {
  this.pendingCredits += amount;
  
  // Auto-convert at 1.0 threshold
  if (this.pendingCredits >= 1.0) {
    const fullCredits = Math.floor(this.pendingCredits);
    this.credits += fullCredits;
    this.pendingCredits -= fullCredits;
    return fullCredits;
  }
  
  return 0;
};

// Method to reset monthly stats
userSchema.methods.resetMonthlyStats = function() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (this.monthlyStats.month !== currentMonth) {
    this.monthlyStats = {
      l2Credits: 0,
      l3Credits: 0,
      totalReferrals: 0,
      month: currentMonth
    };
  }
};

module.exports = mongoose.model('User', userSchema); 