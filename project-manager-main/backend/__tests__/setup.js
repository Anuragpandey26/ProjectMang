import { jest } from "@jest/globals";

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key";
process.env.SEND_GRID_API = "test-sendgrid-api-key";
process.env.FROM_EMAIL = "test@taskhub.com";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.ARCJET_KEY = "test-arcjet-key";
process.env.MONGODB_URI = "mongodb://localhost:27017/taskhub-test";

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
