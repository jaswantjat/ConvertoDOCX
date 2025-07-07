const Docxtemplater = require('docxtemplater')
const PizZip = require('pizzip')
const fs = require('fs')
const path = require('path')
const logger = require('../utils/logger')

class DocxService {
  constructor() {
    this.templatesDir = path.join(process.cwd(), 'src', 'templates')
    this.ensureTemplatesDirectory()
  }

  ensureTemplatesDirectory() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true })
      logger.info(`Created templates directory: ${this.templatesDir}`)
    }
  }

  /**
   * Generate DOCX from template and data
   * @param {string} templateName - Name of the template file
   * @param {Object} data - Data to inject into template
   * @param {Object} options - Generation options
   * @returns {Buffer} Generated DOCX buffer
   */
  async generateFromTemplate(templateName, data, options = {}) {
    try {
      const templatePath = path.join(this.templatesDir, templateName)
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`)
      }

      // Read template file
      const templateBuffer = fs.readFileSync(templatePath)
      
      return this.generateFromBuffer(templateBuffer, data, options)
    } catch (error) {
      logger.error({
        message: 'Error generating DOCX from template',
        templateName,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Generate DOCX from buffer and data
   * @param {Buffer} templateBuffer - Template file buffer
   * @param {Object} data - Data to inject into template
   * @param {Object} options - Generation options
   * @returns {Buffer} Generated DOCX buffer
   */
  async generateFromBuffer(templateBuffer, data, options = {}) {
    try {
      const zip = new PizZip(templateBuffer)
      
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        ...options
      })

      try {
        // Data is now pre-processed by exerciseTemplateEngine before reaching this service.
        // No further processing is needed here.
        doc.render(data)
      } catch (error) {
        if (error.properties && error.properties.errors instanceof Array) {
          const errorMessages = error.properties.errors.map(err => {
            return `${err.name}: ${err.message} at ${err.properties.part}`
          }).join('; ')
          throw new Error(`Template rendering failed: ${errorMessages}`)
        }
        throw new Error(`Template rendering failed: ${error.message}`)
      }

      // Generate the document buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 4
        }
      })

      logger.info({
        message: 'DOCX generated successfully',
        dataKeys: Object.keys(data),
        bufferSize: buffer.length
      })

      return buffer
    } catch (error) {
      logger.error({
        message: 'Error generating DOCX from buffer',
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * List available templates
   * @returns {Array} List of template files
   */
  listTemplates() {
    try {
      const files = fs.readdirSync(this.templatesDir)
      return files.filter(file => file.endsWith('.docx')).map(file => ({
        name: file,
        path: path.join(this.templatesDir, file),
        size: fs.statSync(path.join(this.templatesDir, file)).size,
        modified: fs.statSync(path.join(this.templatesDir, file)).mtime
      }))
    } catch (error) {
      logger.error({
        message: 'Error listing templates',
        error: error.message
      })
      return []
    }
  }

  /**
   * Save uploaded template
   * @param {Buffer} buffer - Template file buffer
   * @param {string} filename - Template filename
   * @returns {string} Saved template path
   */
  async saveTemplate(buffer, filename) {
    try {
      const templatePath = path.join(this.templatesDir, filename)
      fs.writeFileSync(templatePath, buffer)
      
      logger.info({
        message: 'Template saved successfully',
        filename,
        path: templatePath,
        size: buffer.length
      })
      
      return templatePath
    } catch (error) {
      logger.error({
        message: 'Error saving template',
        filename,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Validate template data against template structure
   * @param {string} templateName - Template name
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  async validateTemplateData(templateName, data) {
    try {
      const templatePath = path.join(this.templatesDir, templateName)
      
      if (!fs.existsSync(templatePath)) {
        return {
          valid: false,
          errors: [`Template not found: ${templateName}`]
        }
      }

      if (!data || typeof data !== 'object') {
        return {
          valid: false,
          errors: ['Data must be a valid object']
        }
      }

      return {
        valid: true,
        errors: []
      }
    } catch (error) {
      logger.error({
        message: 'Error validating template data',
        templateName,
        error: error.message
      })
      
      return {
        valid: false,
        errors: [error.message]
      }
    }
  }
}

module.exports = new DocxService()
