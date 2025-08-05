const express = require('express');
const router = express.Router();
const { inviteUser, redeemCode, getReferralStatus, convertCredits } = require('../controllers/referralController');

// Helper to wrap async route handlers with error logging
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      console.error('Route error:', err);
      next(err);
    });
  };
}

// POST /api/referrals/invite
router.post('/invite', asyncHandler(inviteUser));

// POST /api/referrals/redeem
router.post('/redeem', asyncHandler(redeemCode));

// GET /api/referrals/status
router.get('/status', asyncHandler(getReferralStatus));

// POST /api/referrals/convert-credits
router.post('/convert-credits', asyncHandler(convertCredits));

module.exports = router; 