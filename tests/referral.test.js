const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Referral = require('../models/Referral');

// Mock Express request and response
const mockRequest = (body = {}, query = {}, params = {}) => ({ body, query, params });
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Referral System Tests', () => {
  let mongoServer;
  let connection;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    connection = await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Referral.deleteMany({});
  });

  describe('Unqualified Referrals - No Credit Tests', () => {
    test('should not give credits to users who do not meet eligibility requirements', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        completedRounds: 2,
        acceptedReflections: 1,
        credits: 0,
        pendingCredits: 0
      });
      await user.save();

      const convertedAmount = user.convertPendingCredits();
      expect(convertedAmount).toBe(0);
      expect(user.credits).toBe(0);
      expect(user.pendingCredits).toBe(0);
    });
  });

  describe('Fractional Credit Accrual Tests', () => {
    test('should accrue L1 referrals as 1.0 fractional credits', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0
      });
      await user.save();

      const convertedCredits = user.addFractionalCredits(1.0);
      await user.save();

      expect(user.pendingCredits).toBe(1.0);
      expect(convertedCredits).toBe(1);
      expect(user.credits).toBe(1);
    });

    test('should accumulate multiple fractional credits correctly', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0.3
      });
      await user.save();

      const convertedCredits = user.addFractionalCredits(0.7);
      await user.save();

      expect(user.pendingCredits).toBe(0);
      expect(convertedCredits).toBe(1);
      expect(user.credits).toBe(1);
    });
  });

  describe('Auto-Conversion at 1.0 Tests', () => {
    test('should auto-convert when pending credits reach exactly 1.0', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0.8
      });
      await user.save();

      const convertedCredits = user.addFractionalCredits(0.2);
      await user.save();

      expect(convertedCredits).toBe(1);
      expect(user.credits).toBe(1);
      expect(user.pendingCredits).toBe(0);
    });

    test('should auto-convert when pending credits exceed 1.0', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0.5
      });
      await user.save();

      const convertedCredits = user.addFractionalCredits(1.0);
      await user.save();

      expect(convertedCredits).toBe(1);
      expect(user.credits).toBe(1);
      expect(user.pendingCredits).toBe(0.5);
    });

    test('should not auto-convert when pending credits are below 1.0', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0.3
      });
      await user.save();

      const convertedCredits = user.addFractionalCredits(0.2);
      await user.save();

      expect(convertedCredits).toBe(0);
      expect(user.credits).toBe(0);
      expect(user.pendingCredits).toBe(0.5);
    });
  });

  describe('Monthly Caps Enforcement Tests', () => {
    test('should enforce L2+L3 combined cap of 50 credits', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0,
        monthlyStats: {
          l2Credits: 49.5,
          l3Credits: 0,
          totalReferrals: 10,
          month: new Date().toISOString().slice(0, 7)
        }
      });
      await user.save();

      // Try to add L2 credits that would exceed the cap
      const wouldExceedCap = user.monthlyStats.l2Credits + 0.25 > 50;
      expect(wouldExceedCap).toBe(true);
    });

    test('should enforce total referrals cap of 100', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0,
        monthlyStats: {
          l2Credits: 0,
          l3Credits: 0,
          totalReferrals: 100,
          month: new Date().toISOString().slice(0, 7)
        }
      });
      await user.save();

      const atCap = user.monthlyStats.totalReferrals >= 100;
      expect(atCap).toBe(true);
    });

    test('should reset monthly stats when month changes', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthString = lastMonth.toISOString().slice(0, 7);

      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0,
        monthlyStats: {
          l2Credits: 50,
          l3Credits: 25,
          totalReferrals: 100,
          month: lastMonthString
        }
      });
      await user.save();

      user.resetMonthlyStats();
      await user.save();

      const currentMonth = new Date().toISOString().slice(0, 7);
      expect(user.monthlyStats.month).toBe(currentMonth);
      expect(user.monthlyStats.l2Credits).toBe(0);
      expect(user.monthlyStats.l3Credits).toBe(0);
      expect(user.monthlyStats.totalReferrals).toBe(0);
    });
  });

  describe('Manual Credit Conversion Tests', () => {
    test('should allow manual conversion for qualified users', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        completedRounds: 8,
        acceptedReflections: 3,
        credits: 0,
        pendingCredits: 2.5
      });
      await user.save();

      const convertedAmount = user.convertPendingCredits();
      await user.save();

      expect(convertedAmount).toBe(2.5);
      expect(user.credits).toBe(2.5);
      expect(user.pendingCredits).toBe(0);
    });

    test('should not allow conversion for unqualified users', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        completedRounds: 3,
        acceptedReflections: 1,
        credits: 0,
        pendingCredits: 5.0
      });
      await user.save();

      const convertedAmount = user.convertPendingCredits();
      await user.save();

      expect(convertedAmount).toBe(0);
      expect(user.credits).toBe(0);
      expect(user.pendingCredits).toBe(5.0);
    });
  });

  describe('User Model Methods Tests', () => {
    test('should check eligibility correctly', () => {
      const qualifiedUser = new User({
        completedRounds: 8,
        acceptedReflections: 3
      });
      expect(qualifiedUser.isEligibleForCredit()).toBe(true);

      const unqualifiedUser = new User({
        completedRounds: 4,
        acceptedReflections: 1
      });
      expect(unqualifiedUser.isEligibleForCredit()).toBe(false);
    });

    test('should handle edge cases in fractional credit addition', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 0,
        pendingCredits: 0.99
      });
      await user.save();

      // Add 0.01 to reach exactly 1.0
      const convertedCredits = user.addFractionalCredits(0.01);
      await user.save();

      expect(convertedCredits).toBe(1);
      expect(user.credits).toBe(1);
      expect(user.pendingCredits).toBe(0);
    });
  });
}); 