// Test setup file
const path = require('path')

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.API_KEY = 'test-api-key-12345'
process.env.LOG_LEVEL = 'error' // Reduce log noise during tests
process.env.RATE_LIMIT_WINDOW_MS = '60000' // 1 minute for tests
process.env.RATE_LIMIT_MAX_REQUESTS = '1000' // High limit for tests
process.env.MAX_FILE_SIZE = '10485760' // 10MB
process.env.MAX_TEMPLATE_SIZE = '5242880' // 5MB

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Global test timeout
jest.setTimeout(30000)

// Clean up after tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 100))
})
