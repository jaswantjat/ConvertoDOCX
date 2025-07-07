const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const logger = require('./utils/logger')
const errorHandler = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')
const docxController = require('./controllers/docxController')
const exerciseController = require('./controllers/exerciseController')
const exerciseManagementController = require('./controllers/exerciseManagementController')

const app = express()
const PORT = process.env.PORT || 3000

// Trust proxy configuration for Railway deployment
// Only trust Railway's proxy, not arbitrary proxies
if (process.env.NODE_ENV === 'production') {
  // Railway uses specific proxy configuration
  app.set('trust proxy', 1) // Trust first proxy only
} else {
  // Development mode - trust localhost
  app.set('trust proxy', 'loopback')
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}

app.use(cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files from public directory
app.use(express.static('public'))

// Enhanced rate limiting with proper proxy handling
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Enhanced key generator for better security
  keyGenerator: (req) => {
    // Use the real IP address, considering trusted proxies
    const ip = req.ip || req.connection.remoteAddress
    const apiKey = req.headers['x-api-key']

    // Combine IP and API key hash for more granular rate limiting
    if (apiKey) {
      const crypto = require('crypto')
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 8)
      return `${ip}:${keyHash}`
    }

    return ip
  },
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/health'
  }
})

app.use('/api/', limiter)

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes with authentication
app.use('/api', authMiddleware)
app.post('/api/generate-docx', docxController.generateDocx)
app.get('/api/templates', docxController.listTemplates)
app.post('/api/templates', docxController.uploadTemplate)

// Educational content routes
app.post('/api/generate-exercise', exerciseController.generateExercise)
app.get('/api/exercise-template', exerciseController.getExerciseTemplate)
app.post('/api/validate-exercise', exerciseController.validateExercise)

// Exercise management routes
app.get('/api/exercise-categories', exerciseManagementController.getCategories)
app.post('/api/exercise-categories', exerciseManagementController.createCategory)
app.get('/api/exercise-topics', exerciseManagementController.getTopics)
app.post('/api/exercise-topics', exerciseManagementController.createTopic)
app.get('/api/supported-languages', exerciseManagementController.getSupportedLanguages)
app.get('/api/exercise-stats', exerciseManagementController.getExerciseStats)
app.get('/api/search-exercises', exerciseManagementController.searchExercises)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DOCX Generator API',
    version: '1.0.0',
    description: 'API for generating DOCX documents from templates',
    endpoints: {
      health: '/health',
      generateDocx: '/api/generate-docx',
      generateExercise: '/api/generate-exercise',
      templates: '/api/templates',
      exerciseTemplate: '/api/exercise-template',
      validateExercise: '/api/validate-exercise',
      exerciseCategories: '/api/exercise-categories',
      exerciseTopics: '/api/exercise-topics',
      supportedLanguages: '/api/supported-languages',
      exerciseStats: '/api/exercise-stats',
      searchExercises: '/api/search-exercises'
    },
    documentation: '/docs'
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist.`,
    availableEndpoints: ['/health', '/api/generate-docx', '/api/templates']
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
  logger.info(`Health check available at: http://localhost:${PORT}/health`)
  logger.info(`API documentation available at: http://localhost:${PORT}/docs`)
})

module.exports = app
