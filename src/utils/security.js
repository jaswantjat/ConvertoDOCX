const crypto = require('crypto')
const logger = require('./logger')

class SecurityUtils {
  /**
   * Generate a secure API key
   * @param {number} length - Length of the API key
   * @returns {string} Generated API key
   */
  static generateApiKey(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Hash a string using SHA-256
   * @param {string} input - Input string to hash
   * @returns {string} Hashed string
   */
  static hashString(input) {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   * @param {any} input - Input to sanitize
   * @returns {any} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item))
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value)
      }
      return sanitized
    }
    
    return input
  }

  /**
   * Validate file upload security
   * @param {Object} file - Uploaded file object
   * @returns {Object} Validation result
   */
  static validateFileUpload(file) {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    const allowedExtensions = ['.docx']
    
    const maxSize = parseInt(process.env.MAX_TEMPLATE_SIZE) || 5 * 1024 * 1024 // 5MB
    
    const errors = []
    
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only DOCX files are allowed.')
    }
    
    // Check file extension
    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
    if (!allowedExtensions.includes(extension)) {
      errors.push('Invalid file extension. Only .docx files are allowed.')
    }
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`)
    }
    
    // Check for suspicious file names
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      errors.push('Invalid file name.')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Rate limiting key generator
   * @param {Object} req - Express request object
   * @returns {string} Rate limiting key
   */
  static getRateLimitKey(req) {
    // Use IP address and API key for rate limiting
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    return `${req.ip}:${apiKey ? this.hashString(apiKey).substring(0, 8) : 'anonymous'}`
  }

  /**
   * Log security events
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   * @param {Object} req - Express request object
   */
  static logSecurityEvent(event, details, req) {
    logger.warn({
      type: 'SECURITY_EVENT',
      event,
      details,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Validate request origin
   * @param {string} origin - Request origin
   * @returns {boolean} Whether origin is allowed
   */
  static isOriginAllowed(origin) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
    
    if (allowedOrigins.includes('*')) {
      return true
    }
    
    return allowedOrigins.includes(origin)
  }

  /**
   * Generate secure headers for responses
   * @returns {Object} Security headers
   */
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }

  /**
   * Validate template data for potential security issues
   * @param {Object} data - Template data
   * @returns {Object} Validation result
   */
  static validateTemplateData(data) {
    const errors = []
    const maxDepth = 10
    const maxKeys = 1000
    
    // Check for excessive nesting
    const checkDepth = (obj, depth = 0) => {
      if (depth > maxDepth) {
        errors.push('Data structure too deeply nested')
        return
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          checkDepth(value, depth + 1)
        }
      }
    }
    
    // Count total keys
    const countKeys = (obj) => {
      let count = 0
      const traverse = (item) => {
        if (typeof item === 'object' && item !== null) {
          count += Object.keys(item).length
          for (const value of Object.values(item)) {
            traverse(value)
          }
        }
      }
      traverse(obj)
      return count
    }
    
    try {
      checkDepth(data)
      
      const keyCount = countKeys(data)
      if (keyCount > maxKeys) {
        errors.push(`Too many keys in data structure. Maximum allowed: ${maxKeys}`)
      }
      
      // Check for potentially dangerous values
      const jsonString = JSON.stringify(data)
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /function\s*\(/i
      ]
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(jsonString)) {
          errors.push('Data contains potentially dangerous content')
          break
        }
      }
      
    } catch (error) {
      errors.push('Invalid data structure')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

module.exports = SecurityUtils
