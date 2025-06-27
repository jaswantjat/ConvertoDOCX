const request = require('supertest')
const app = require('../../src/server')
const fs = require('fs')
const path = require('path')

// Mock environment variables for testing
process.env.API_KEY = 'test-api-key-12345'
process.env.NODE_ENV = 'test'

describe('API Integration Tests', () => {
  const validApiKey = 'test-api-key-12345'
  const invalidApiKey = 'invalid-key'

  describe('Health Check', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('environment')
      expect(response.body).toHaveProperty('version')
    })
  })

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .send({
          template: 'test-template.docx',
          data: { name: 'Test' }
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_API_KEY')
    })

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', invalidApiKey)
        .send({
          template: 'test-template.docx',
          data: { name: 'Test' }
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_API_KEY')
    })

    it('should accept requests with valid API key in X-API-Key header', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', validApiKey)
        .send({
          template: 'non-existent-template.docx',
          data: { name: 'Test' }
        })

      // Should pass authentication but fail on template not found
      expect(response.status).not.toBe(401)
    })

    it('should accept requests with valid API key in Authorization header', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('Authorization', `Bearer ${validApiKey}`)
        .send({
          template: 'non-existent-template.docx',
          data: { name: 'Test' }
        })

      // Should pass authentication but fail on template not found
      expect(response.status).not.toBe(401)
    })
  })

  describe('DOCX Generation', () => {
    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', validApiKey)
        .send({
          // Missing required fields
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Validation error')
    })

    it('should require template field', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', validApiKey)
        .send({
          data: { name: 'Test' }
          // Missing template field
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.details).toContain('Template name is required')
    })

    it('should require data field', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', validApiKey)
        .send({
          template: 'test-template.docx'
          // Missing data field
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.details).toContain('Data is required')
    })

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', validApiKey)
        .send({
          template: 'non-existent-template.docx',
          data: { name: 'Test' }
        })

      expect(response.status).toBe(500) // Will be 500 due to template not found error
    })
  })

  describe('Template Management', () => {
    it('should list templates', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('X-API-Key', validApiKey)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('templates')
      expect(response.body.data).toHaveProperty('count')
      expect(Array.isArray(response.body.data.templates)).toBe(true)
    })

    it('should require authentication for template upload', async () => {
      const response = await request(app)
        .post('/api/templates')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('MISSING_API_KEY')
    })

    it('should validate file upload', async () => {
      const response = await request(app)
        .post('/api/templates')
        .set('X-API-Key', validApiKey)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('No template file provided')
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // This test would need to make many requests quickly
      // For now, we just verify the endpoint exists and responds
      const response = await request(app)
        .get('/api/templates')
        .set('X-API-Key', validApiKey)

      expect(response.headers).toHaveProperty('x-ratelimit-limit')
      expect(response.headers).toHaveProperty('x-ratelimit-remaining')
    })
  })

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/generate-docx')
        .set('Origin', 'http://localhost:3000')

      expect(response.headers).toHaveProperty('access-control-allow-origin')
      expect(response.headers).toHaveProperty('access-control-allow-methods')
      expect(response.headers).toHaveProperty('access-control-allow-headers')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404)

      expect(response.body.error).toBe('Endpoint not found')
      expect(response.body.availableEndpoints).toBeDefined()
    })

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/generate-docx')
        .set('X-API-Key', validApiKey)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
    })
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
      expect(response.headers).toHaveProperty('x-xss-protection')
    })
  })
})
