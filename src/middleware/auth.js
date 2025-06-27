const logger = require('../utils/logger')

const authMiddleware = (req, res, next) => {
  try {
    // Get API key from headers
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    // Check if API key is provided
    if (!apiKey) {
      logger.warn({
        message: 'API key missing',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      })
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'API key required',
          code: 'MISSING_API_KEY',
          details: 'Please provide a valid API key in the X-API-Key header or Authorization header'
        }
      })
    }

    // Validate API key
    const validApiKey = process.env.API_KEY
    if (!validApiKey) {
      logger.error('API_KEY environment variable not set')
      return res.status(500).json({
        success: false,
        error: {
          message: 'Server configuration error',
          code: 'SERVER_CONFIG_ERROR'
        }
      })
    }

    if (apiKey !== validApiKey) {
      logger.warn({
        message: 'Invalid API key attempt',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        providedKey: apiKey.substring(0, 8) + '...' // Log only first 8 chars for security
      })
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid API key',
          code: 'INVALID_API_KEY'
        }
      })
    }

    // API key is valid, proceed to next middleware
    logger.info({
      message: 'API key validated successfully',
      ip: req.ip,
      path: req.path,
      method: req.method
    })
    
    next()
  } catch (error) {
    logger.error({
      message: 'Authentication middleware error',
      error: error.message,
      stack: error.stack
    })
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    })
  }
}

module.exports = authMiddleware
