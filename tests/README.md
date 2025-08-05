# Referral System Test Suite

This directory contains comprehensive unit tests and integration tests for the referral system.

## Test Files

- **`referral.test.js`** - Unit tests for core business logic
- **`api.test.js`** - Integration tests for API endpoints
- **`setup.js`** - Jest configuration and test setup

## Test Coverage

### ✅ Unqualified Referrals - No Credit Tests
- Users who don't meet eligibility requirements (6 rounds + 2 reflections) cannot convert credits
- Pending credits remain unchanged for unqualified users
- Manual conversion is blocked for ineligible users

### ✅ Fractional Credit Accrual Tests
- L1 referrals accrue 1.0 fractional credits
- L2 referrals accrue 0.25 fractional credits  
- L3 referrals accrue 0.10 fractional credits
- Multiple fractional credits accumulate correctly
- Edge cases in fractional credit addition

### ✅ Auto-Conversion at 1.0 Tests
- Credits auto-convert when pending balance reaches exactly 1.0
- Credits auto-convert when pending balance exceeds 1.0
- No auto-conversion when pending credits are below 1.0
- Multiple full credits convert when pending exceeds 2.0

### ✅ Monthly Caps Enforcement Tests
- L2+L3 combined cap of 50 credits is enforced
- Total referrals cap of 100 is enforced
- Monthly stats reset when month changes
- Caps are properly calculated and validated

### ✅ Manual Credit Conversion Tests
- Qualified users can manually convert pending credits
- Unqualified users cannot convert credits
- Conversion handles edge cases (no pending credits)
- Eligibility requirements are properly checked

### ✅ API Integration Tests
- User invitation with unique referral codes
- Referral code redemption and credit distribution
- User status retrieval
- Credit conversion via API
- Complete multi-level referral chain testing
- Error handling for invalid inputs

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- tests/referral.test.js
npm test -- tests/api.test.js
```

## Test Environment

- **Database**: MongoDB Memory Server (in-memory database for testing)
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Coverage**: Istanbul/nyc

## Test Structure

Each test file follows this structure:

```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup MongoDB connection
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(async () => {
    // Clear database before each test
  });

  test('should do something specific', async () => {
    // Test implementation
  });
});
```

## Key Test Scenarios

### 1. Unqualified Users
- Users with < 6 completed rounds cannot convert credits
- Users with < 2 accepted reflections cannot convert credits
- Pending credits remain untouched for unqualified users

### 2. Fractional Credit System
- All credits start as fractions in pending balance
- Fractions accumulate correctly (0.25 + 0.25 + 0.5 = 1.0)
- Auto-conversion triggers at 1.0 threshold
- Remaining fractions stay in pending balance

### 3. Auto-Conversion Logic
- Exact 1.0 triggers conversion
- Values > 1.0 convert full credits, keep remainder
- Values < 1.0 stay in pending
- Multiple conversions work correctly

### 4. Monthly Caps
- L2 + L3 credits cannot exceed 50 per month
- Total referrals cannot exceed 100 per month
- Caps reset monthly
- Cap enforcement prevents over-crediting

### 5. API Endpoints
- All endpoints return correct status codes
- Error handling works properly
- Database operations are atomic
- Multi-level referral chains work correctly

## Coverage Goals

- **Models**: 100% coverage of User and Referral models
- **Controllers**: 100% coverage of all business logic
- **Routes**: 100% coverage of API endpoints
- **Integration**: Full end-to-end testing

## Debugging Tests

To debug a failing test:

1. Run the specific test in watch mode:
   ```bash
   npm test -- --watch tests/referral.test.js
   ```

2. Add console.log statements to understand the flow

3. Check the test database state:
   ```javascript
   const users = await User.find({});
   console.log('Users in DB:', users);
   ```

4. Use Jest's `--verbose` flag for more details:
   ```bash
   npm test -- --verbose
   ```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- Fast execution (< 30 seconds)
- No external dependencies
- Deterministic results
- Clear error messages
- High coverage metrics 