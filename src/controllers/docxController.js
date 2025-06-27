const Joi = require('joi')
const multer = require('multer')
const path = require('path')
const docxService = require('../services/docxService')
const htmlService = require('../services/htmlService')
const logger = require('../utils/logger')

// Multer configuration for file uploads (v2 compatible)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_TEMPLATE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Multer v2 expects Error object or null for rejection (no second parameter)
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true)
    } else {
      cb(new Error('Only DOCX files are allowed'))
    }
  }
})

// Validation schemas
const generateDocxSchema = Joi.object({
  template: Joi.string().required().messages({
    'string.empty': 'Template name is required',
    'any.required': 'Template name is required'
  }),
  data: Joi.object().required().messages({
    'object.base': 'Data must be a valid object',
    'any.required': 'Data is required'
  }),
  format: Joi.string().valid('docx', 'html').default('docx').messages({
    'any.only': 'Format must be either "docx" or "html"'
  }),
  options: Joi.object({
    paragraphLoop: Joi.boolean().default(true),
    linebreaks: Joi.boolean().default(true),
    language: Joi.string().default('javascript'),
    nullGetter: Joi.function(),
    parser: Joi.function(),
    delimiters: Joi.object({
      start: Joi.string(),
      end: Joi.string()
    })
  }).default({})
})

const docxController = {
  /**
   * Generate document from template (DOCX or HTML)
   */
  async generateDocx(req, res, next) {
    try {
      // Validate request body
      const { error, value } = generateDocxSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => detail.message)
          }
        })
      }

      const { template, data, format, options } = value

      logger.info({
        message: `${format.toUpperCase()} generation request received`,
        template,
        format,
        dataKeys: Object.keys(data),
        ip: req.ip
      })

      if (format === 'html') {
        // Generate HTML
        const htmlContent = await htmlService.generateCodingExercise(data, options)

        // Set response headers for HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8')

        logger.info({
          message: 'HTML generated and sent successfully',
          template,
          size: htmlContent.length,
          ip: req.ip
        })

        // Send the HTML content
        res.send(htmlContent)

      } else {
        // Generate DOCX (existing functionality)
        // Validate template data
        const validation = await docxService.validateTemplateData(template, data)
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Template data validation failed',
              details: validation.errors
            }
          })
        }

        // Generate DOCX
        const docxBuffer = await docxService.generateFromTemplate(template, data, options)

        // Set response headers for file download
        const filename = `${template.replace('.docx', '')}_${Date.now()}.docx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Length', docxBuffer.length)

        logger.info({
          message: 'DOCX generated and sent successfully',
          template,
          filename,
          size: docxBuffer.length,
          ip: req.ip
        })

        // Send the DOCX file
        res.send(docxBuffer)
      }

    } catch (error) {
      logger.error({
        message: 'Error in generateDocx controller',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * List available templates
   */
  async listTemplates(req, res, next) {
    try {
      const templates = docxService.listTemplates()

      logger.info({
        message: 'Templates list requested',
        count: templates.length,
        ip: req.ip
      })

      res.json({
        success: true,
        data: {
          templates,
          count: templates.length
        }
      })

    } catch (error) {
      logger.error({
        message: 'Error in listTemplates controller',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Upload new template
   */
  uploadTemplate: [
    upload.single('template'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'No template file provided',
              details: 'Please upload a DOCX file'
            }
          })
        }

        const filename = req.body.filename || req.file.originalname
        
        // Validate filename
        if (!filename.endsWith('.docx')) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid file extension',
              details: 'Only DOCX files are allowed'
            }
          })
        }

        logger.info({
          message: 'Template upload request received',
          filename,
          size: req.file.size,
          ip: req.ip
        })

        // Save template
        const templatePath = await docxService.saveTemplate(req.file.buffer, filename)

        logger.info({
          message: 'Template uploaded successfully',
          filename,
          path: templatePath,
          size: req.file.size,
          ip: req.ip
        })

        res.status(201).json({
          success: true,
          data: {
            message: 'Template uploaded successfully',
            filename,
            size: req.file.size,
            path: templatePath
          }
        })

      } catch (error) {
        logger.error({
          message: 'Error in uploadTemplate controller',
          error: error.message,
          stack: error.stack,
          ip: req.ip
        })
        next(error)
      }
    }
  ]
}

module.exports = docxController
