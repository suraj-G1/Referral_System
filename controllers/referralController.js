const User = require('../models/User');
const Referral = require('../models/Referral');
const { v4: uuidv4 } = require('uuid');

// Constants for credit amounts (fractions)
const CREDIT_AMOUNTS = {
  L1: 1.0,
  L2: 0.25,
  L3: 0.10
};

// Monthly caps
const MONTHLY_CAPS = {
  L2_L3_COMBINED: 50,
  TOTAL_REFERRALS: 100
};

// Auto-conversion threshold
const AUTO_CONVERSION_THRESHOLD = 1.0;

// Generate unique referral code
const generateReferralCode = () => {
  return uuidv4().substring(0, 8).toUpperCase();
};

// Function to add fractional credits and handle auto-conversion
const addFractionalCredits = async (user, creditAmount) => {
  // Use the User model method for fractional credit handling
  const convertedCredits = user.addFractionalCredits(creditAmount);
  
  if (convertedCredits > 0) {
    console.log(`Auto-converted ${convertedCredits} credits for user ${user.username}`);
  }
  
  await user.save();
  return user;
};

// Function to check and enforce monthly caps
const checkMonthlyCaps = async (referrer, newCreditAmount, currentMonth) => {
  // Get current monthly stats
  const monthlyReferrals = await Referral.find({
    referrer: referrer._id,
    month: currentMonth
  });

  const l2L3Credits = monthlyReferrals
    .filter(ref => ref.level === 2 || ref.level === 3)
    .reduce((sum, ref) => sum + ref.creditAmount, 0);

  const totalReferrals = monthlyReferrals.length;

  // Check L2+L3 combined cap (only applies to L2 and L3 credits)
  const isL2OrL3 = newCreditAmount === CREDIT_AMOUNTS.L2 || newCreditAmount === CREDIT_AMOUNTS.L3;
  if (isL2OrL3 && l2L3Credits + newCreditAmount > MONTHLY_CAPS.L2_L3_COMBINED) {
    return { allowed: false, reason: 'Monthly L2+L3 credit cap exceeded' };
  }

  // Check total referrals cap
  if (totalReferrals >= MONTHLY_CAPS.TOTAL_REFERRALS) {
    return { allowed: false, reason: 'Monthly total referral cap exceeded' };
  }

  return { allowed: true };
};

// POST /api/referrals/invite
const inviteUser = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = generateReferralCode();
      const existingCode = await User.findOne({ referralCode });
      if (!existingCode) {
        isUnique = true;
      }
    }

    // Create new user
    const newUser = new User({
      email,
      username,
      referralCode
    });

    await newUser.save();

    res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        referralCode: newUser.referralCode
      }
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
};

// POST /api/referrals/redeem
const redeemCode = async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Referral code and user ID are required' });
    }

    // Find the referrer by code
    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Find the user redeeming the code
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already referred
    if (user.referredBy) {
      return res.status(400).json({ error: 'User is already referred' });
    }

    // Check if user is trying to refer themselves
    if (user._id.toString() === referrer._id.toString()) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Update user with referral information
    user.referredBy = referrer._id;
    user.referralLevel = 1; // L1 referral
    await user.save();

    // Reset monthly stats for referrer if needed
    referrer.resetMonthlyStats();

    // Check monthly caps for L1 referral
    const currentMonth = new Date().toISOString().slice(0, 7);
    const capCheck = await checkMonthlyCaps(referrer, CREDIT_AMOUNTS.L1, currentMonth);
    
    if (!capCheck.allowed) {
      return res.status(400).json({ error: capCheck.reason });
    }

    // Create L1 referral record
    const l1Referral = new Referral({
      referrer: referrer._id,
      referred: user._id,
      level: 1,
      creditAmount: CREDIT_AMOUNTS.L1,
      month: currentMonth
    });

    await l1Referral.save();

    // Add fractional credits to referrer with auto-conversion
    await addFractionalCredits(referrer, CREDIT_AMOUNTS.L1);
    referrer.monthlyStats.totalReferrals += 1;
    await referrer.save();

    // Find L2 referrals (referrals of the referrer)
    const l2Referrals = await Referral.find({
      referred: referrer._id,
      level: 1,
      status: 'pending'
    });

    for (const l2Ref of l2Referrals) {
      const l2Referrer = await User.findById(l2Ref.referrer);
      if (l2Referrer && l2Referrer.isActive) {
        l2Referrer.resetMonthlyStats();

        // Check monthly caps for L2 referral
        const l2CapCheck = await checkMonthlyCaps(l2Referrer, CREDIT_AMOUNTS.L2, currentMonth);

        if (l2CapCheck.allowed) {
          // Create L2 referral record
          const l2ReferralRecord = new Referral({
            referrer: l2Referrer._id,
            referred: user._id,
            level: 2,
            creditAmount: CREDIT_AMOUNTS.L2,
            month: currentMonth
          });

          await l2ReferralRecord.save();

          // Add fractional credits to L2 referrer with auto-conversion
          await addFractionalCredits(l2Referrer, CREDIT_AMOUNTS.L2);
          l2Referrer.monthlyStats.l2Credits += CREDIT_AMOUNTS.L2;
          l2Referrer.monthlyStats.totalReferrals += 1;
          await l2Referrer.save();
        }
      }
    }

    // Find L3 referrals (referrals of L2 referrers)
    const l3Referrals = await Referral.find({
      referred: referrer._id,
      level: 2,
      status: 'pending'
    });

    for (const l3Ref of l3Referrals) {
      const l3Referrer = await User.findById(l3Ref.referrer);
      if (l3Referrer && l3Referrer.isActive) {
        l3Referrer.resetMonthlyStats();

        // Check monthly caps for L3 referral
        const l3CapCheck = await checkMonthlyCaps(l3Referrer, CREDIT_AMOUNTS.L3, currentMonth);

        if (l3CapCheck.allowed) {
          // Create L3 referral record
          const l3ReferralRecord = new Referral({
            referrer: l3Referrer._id,
            referred: user._id,
            level: 3,
            creditAmount: CREDIT_AMOUNTS.L3,
            month: currentMonth
          });

          await l3ReferralRecord.save();

          // Add fractional credits to L3 referrer with auto-conversion
          await addFractionalCredits(l3Referrer, CREDIT_AMOUNTS.L3);
          l3Referrer.monthlyStats.l3Credits += CREDIT_AMOUNTS.L3;
          l3Referrer.monthlyStats.totalReferrals += 1;
          await l3Referrer.save();
        }
      }
    }

    res.json({
      message: 'Referral code redeemed successfully',
      referralLevel: 1,
      creditAmount: CREDIT_AMOUNTS.L1
    });

  } catch (error) {
    console.error('Error redeeming code:', error);
    res.status(500).json({ error: 'Failed to redeem referral code' });
  }
};

// POST /api/referrals/convert-credits
const convertCredits = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is eligible for conversion
    if (!user.isEligibleForCredit()) {
      return res.status(400).json({ 
        error: 'User not eligible for credit conversion',
        requirements: {
          completedRounds: user.completedRounds,
          requiredRounds: 6,
          acceptedReflections: user.acceptedReflections,
          requiredReflections: 2
        }
      });
    }

    // Convert pending credits to full credits
    const convertedAmount = user.convertPendingCredits();
    
    if (convertedAmount > 0) {
      await user.save();
      res.json({
        message: 'Credits converted successfully',
        convertedAmount,
        totalCredits: user.credits,
        remainingPending: user.pendingCredits
      });
    } else {
      res.json({
        message: 'No pending credits to convert',
        convertedAmount: 0,
        totalCredits: user.credits,
        remainingPending: user.pendingCredits
      });
    }

  } catch (error) {
    console.error('Error converting credits:', error);
    res.status(500).json({ error: 'Failed to convert credits' });
  }
};

// GET /api/referrals/status
const getReferralStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get referral statistics
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const l1Referrals = await Referral.find({
      referrer: user._id,
      level: 1,
      month: currentMonth
    });

    const l2Referrals = await Referral.find({
      referrer: user._id,
      level: 2,
      month: currentMonth
    });

    const l3Referrals = await Referral.find({
      referrer: user._id,
      level: 3,
      month: currentMonth
    });

    // Calculate pending fractions and auto-conversion info
    const pendingCredits = user.pendingCredits;
    const isEligibleForConversion = user.isEligibleForCredit();
    const creditsToNextConversion = AUTO_CONVERSION_THRESHOLD - pendingCredits;
    const canAutoConvert = pendingCredits >= AUTO_CONVERSION_THRESHOLD;

    // Calculate monthly caps progress
    const l2L3Combined = user.monthlyStats.l2Credits + user.monthlyStats.l3Credits;
    const totalReferrals = user.monthlyStats.totalReferrals;

    const monthlyCapsProgress = {
      l2L3Combined: {
        current: l2L3Combined,
        limit: MONTHLY_CAPS.L2_L3_COMBINED,
        percentage: Math.round((l2L3Combined / MONTHLY_CAPS.L2_L3_COMBINED) * 100)
      },
      totalReferrals: {
        current: totalReferrals,
        limit: MONTHLY_CAPS.TOTAL_REFERRALS,
        percentage: Math.round((totalReferrals / MONTHLY_CAPS.TOTAL_REFERRALS) * 100)
      }
    };

    // Generate unique referral link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/invite?code=${user.referralCode}`;

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode
      },
      stats: {
        l1: {
          count: l1Referrals.length,
          credits: l1Referrals.reduce((sum, ref) => sum + ref.creditAmount, 0)
        },
        l2: {
          count: l2Referrals.length,
          credits: l2Referrals.reduce((sum, ref) => sum + ref.creditAmount, 0)
        },
        l3: {
          count: l3Referrals.length,
          credits: l3Referrals.reduce((sum, ref) => sum + ref.creditAmount, 0)
        }
      },
      pendingCredits,
      isEligibleForConversion,
      autoConversion: {
        canAutoConvert,
        creditsToNextConversion: Math.max(0, creditsToNextConversion),
        threshold: AUTO_CONVERSION_THRESHOLD
      },
      requirements: {
        completedRounds: user.completedRounds,
        requiredRounds: 6,
        acceptedReflections: user.acceptedReflections,
        requiredReflections: 2
      },
      monthlyCapsProgress,
      referralLink,
      currentCredits: user.credits
    });

  } catch (error) {
    console.error('Error getting referral status:', error);
    res.status(500).json({ error: 'Failed to get referral status' });
  }
};

module.exports = {
  inviteUser,
  redeemCode,
  getReferralStatus,
  convertCredits
}; 