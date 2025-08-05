const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const Referral = require('../models/Referral');
const referralRoutes = require('../routes/referrals');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/referrals', referralRoutes);

describe('Referral System API Tests', () => {
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

  describe('POST /api/referrals/invite', () => {
    test('should create a new user with unique referral code', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/referrals/invite')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User invited successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.referralCode).toHaveLength(8);
      expect(response.body.user.id).toBeDefined();

      // Verify user was saved to database
      const savedUser = await User.findById(response.body.user.id);
      expect(savedUser).toBeTruthy();
      expect(savedUser.email).toBe(userData.email);
    });

    test('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser'
      };

      // Create first user
      await request(app)
        .post('/api/referrals/invite')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/referrals/invite')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/referrals/redeem', () => {
    test('should redeem referral code and distribute credits', async () => {
      // Create referrer
      const referrer = new User({
        email: 'referrer@example.com',
        username: 'referrer',
        referralCode: 'REF123',
        credits: 0,
        pendingCredits: 0
      });
      await referrer.save();

      // Create user to be referred
      const user = new User({
        email: 'user@example.com',
        username: 'user',
        referralCode: 'USER123',
        credits: 0,
        pendingCredits: 0
      });
      await user.save();

      const response = await request(app)
        .post('/api/referrals/redeem')
        .send({
          code: 'REF123',
          userId: user._id
        })
        .expect(200);

      expect(response.body.message).toBe('Referral code redeemed successfully');
      expect(response.body.referralLevel).toBe(1);
      expect(response.body.creditAmount).toBe(1.0);

      // Verify referrer received credits
      const updatedReferrer = await User.findById(referrer._id);
      expect(updatedReferrer.pendingCredits).toBe(1.0);

      // Verify user was marked as referred
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.referredBy.toString()).toBe(referrer._id.toString());
      expect(updatedUser.referralLevel).toBe(1);
    });

    test('should reject invalid referral code', async () => {
      const user = new User({
        email: 'user@example.com',
        username: 'user',
        referralCode: 'USER123',
        credits: 0,
        pendingCredits: 0
      });
      await user.save();

      const response = await request(app)
        .post('/api/referrals/redeem')
        .send({
          code: 'INVALID',
          userId: user._id
        })
        .expect(404);

      expect(response.body.error).toBe('Invalid referral code');
    });

    test('should reject self-referral', async () => {
      const user = new User({
        email: 'user@example.com',
        username: 'user',
        referralCode: 'USER123',
        credits: 0,
        pendingCredits: 0
      });
      await user.save();

      const response = await request(app)
        .post('/api/referrals/redeem')
        .send({
          code: 'USER123',
          userId: user._id
        })
        .expect(400);

      expect(response.body.error).toBe('Cannot refer yourself');
    });
  });

  describe('GET /api/referrals/status', () => {
    test('should return user referral status', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        credits: 10,
        pendingCredits: 2.5,
        completedRounds: 8,
        acceptedReflections: 3
      });
      await user.save();

      const response = await request(app)
        .get('/api/referrals/status')
        .query({ userId: user._id })
        .expect(200);

      expect(response.body.user.id).toBe(user._id.toString());
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.currentCredits).toBe(10);
      expect(response.body.pendingCredits).toBe(2.5);
      expect(response.body.isEligibleForConversion).toBe(true);
      expect(response.body.referralLink).toContain('TEST123');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get('/api/referrals/status')
        .query({ userId: fakeId })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/referrals/convert-credits', () => {
    test('should convert pending credits for eligible user', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        completedRounds: 8,
        acceptedReflections: 3,
        credits: 5,
        pendingCredits: 2.5
      });
      await user.save();

      const response = await request(app)
        .post('/api/referrals/convert-credits')
        .send({ userId: user._id })
        .expect(200);

      expect(response.body.message).toBe('Credits converted successfully');
      expect(response.body.convertedAmount).toBe(2.5);
      expect(response.body.totalCredits).toBe(7.5);
      expect(response.body.remainingPending).toBe(0);

      // Verify database was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.credits).toBe(7.5);
      expect(updatedUser.pendingCredits).toBe(0);
    });

    test('should reject conversion for ineligible user', async () => {
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

      const response = await request(app)
        .post('/api/referrals/convert-credits')
        .send({ userId: user._id })
        .expect(400);

      expect(response.body.error).toBe('User not eligible for credit conversion');
      expect(response.body.requirements).toBeDefined();

      // Verify no credits were converted
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.credits).toBe(0);
      expect(updatedUser.pendingCredits).toBe(5.0);
    });

    test('should handle conversion with no pending credits', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST123',
        completedRounds: 8,
        acceptedReflections: 3,
        credits: 10,
        pendingCredits: 0
      });
      await user.save();

      const response = await request(app)
        .post('/api/referrals/convert-credits')
        .send({ userId: user._id })
        .expect(200);

      expect(response.body.message).toBe('No pending credits to convert');
      expect(response.body.convertedAmount).toBe(0);
      expect(response.body.totalCredits).toBe(10);
      expect(response.body.remainingPending).toBe(0);
    });
  });

  describe('Integration Tests - Complete Referral Chain', () => {
    test('should handle multi-level referral chain correctly', async () => {
      // Create L1 referrer
      const l1Referrer = new User({
        email: 'l1@example.com',
        username: 'l1referrer',
        referralCode: 'L1REF',
        credits: 0,
        pendingCredits: 0
      });
      await l1Referrer.save();

      // Create L2 referrer
      const l2Referrer = new User({
        email: 'l2@example.com',
        username: 'l2referrer',
        referralCode: 'L2REF',
        referredBy: l1Referrer._id,
        referralLevel: 1,
        credits: 0,
        pendingCredits: 0
      });
      await l2Referrer.save();

      // Create L3 referrer
      const l3Referrer = new User({
        email: 'l3@example.com',
        username: 'l3referrer',
        referralCode: 'L3REF',
        referredBy: l2Referrer._id,
        referralLevel: 1,
        credits: 0,
        pendingCredits: 0
      });
      await l3Referrer.save();

      // Create referral records
      const l1Referral = new Referral({
        referrer: l1Referrer._id,
        referred: l2Referrer._id,
        level: 1,
        creditAmount: 1.0,
        month: new Date().toISOString().slice(0, 7)
      });
      await l1Referral.save();

      const l2Referral = new Referral({
        referrer: l2Referrer._id,
        referred: l3Referrer._id,
        level: 1,
        creditAmount: 1.0,
        month: new Date().toISOString().slice(0, 7)
      });
      await l2Referral.save();

      // Create new user to be referred by L3
      const newUser = new User({
        email: 'new@example.com',
        username: 'newuser',
        referralCode: 'NEW123',
        credits: 0,
        pendingCredits: 0
      });
      await newUser.save();

      // Redeem L3's referral code
      await request(app)
        .post('/api/referrals/redeem')
        .send({
          code: 'L3REF',
          userId: newUser._id
        })
        .expect(200);

      // Verify all levels received appropriate credits
      const updatedL1Referrer = await User.findById(l1Referrer._id);
      const updatedL2Referrer = await User.findById(l2Referrer._id);
      const updatedL3Referrer = await User.findById(l3Referrer._id);

      expect(updatedL1Referrer.pendingCredits).toBe(0.10); // L3 referral
      expect(updatedL2Referrer.pendingCredits).toBe(1.0); // L1 referral
      expect(updatedL3Referrer.pendingCredits).toBe(1.0); // L1 referral
    });
  });
}); 