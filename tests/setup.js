// Global test setup
process.env.NODE_ENV = 'test';

// Increase timeout for MongoDB operations
jest.setTimeout(30000);

// Suppress console.log during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 