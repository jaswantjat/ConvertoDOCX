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
      
      // ULTIMATE FIX: Completely remove nullGetter to prevent interference with loop processing
      const cleanOptions = { ...options }
      delete cleanOptions.nullGetter  // Remove any nullGetter that might cause "undefined. undefined"

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        ...cleanOptions,
        // EXPLICITLY set nullGetter to undefined to override any defaults
        nullGetter: undefined
        // This ensures docxtemplater uses its natural, safe default behavior
      })

      // Clean the data to prevent undefined values in the output
      const cleanData = this.cleanDataForTemplate(data)

      try {

        // Add detailed logging to track undefined issues
        logger.info({
          message: 'Data cleaning completed',
          originalDataKeys: Object.keys(data),
          cleanedDataKeys: Object.keys(cleanData),
          originalAnswersCount: data.answers ? data.answers.length : 0,
          cleanedAnswersCount: cleanData.answers ? cleanData.answers.length : 0,
          firstAnswerOriginal: data.answers && data.answers[0] ? Object.keys(data.answers[0]) : [],
          firstAnswerCleaned: cleanData.answers && cleanData.answers[0] ? Object.keys(cleanData.answers[0]) : [],
          service: 'docx-generator-api'
        })

        // Check for any undefined values in cleaned data
        const undefinedCheck = this.checkForUndefinedValues(cleanData)
        if (undefinedCheck.hasUndefined) {
          logger.warn({
            message: 'Undefined values detected in cleaned data',
            undefinedFields: undefinedCheck.undefinedFields,
            service: 'docx-generator-api'
          })
        }

        // Log the exact data being passed to template render
        logger.info({
          message: 'Data being passed to doc.render()',
          answersData: cleanData.answers ? cleanData.answers.map(a => ({
            answerNumber: a.answerNumber,
            answerCode: a.answerCode,
            hasUndefined: Object.values(a).some(v => v === undefined || String(v).includes('undefined'))
          })) : [],
          service: 'docx-generator-api'
        })

        // Data is now pre-processed by exerciseTemplateEngine before reaching this service.
        doc.render(cleanData)
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
        dataKeys: Object.keys(cleanData),
        bufferSize: buffer.length,
        service: 'docx-generator-api'
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
   * Clean data to prevent undefined values in template output
   * @param {Object} data - Data to clean
   * @returns {Object} Cleaned data
   */
  cleanDataForTemplate(data) {
    const cleaned = JSON.parse(JSON.stringify(data)) // Deep clone

    // Clean answers array - format for template that expects {answerCode} with number included
    if (cleaned.answers && Array.isArray(cleaned.answers)) {
      cleaned.answers = cleaned.answers.map((answer, index) => {
        // Extract the clean answer code (remove any existing numbers if present)
        let cleanCode = String(answer.answerCode || '').replace(/undefined/g, '').trim()

        // Remove any leading number pattern (e.g., "1. " or "2. ") to avoid duplicates
        cleanCode = cleanCode.replace(/^\d+\.\s*/, '')

        // If no clean code remains, provide a fallback
        if (!cleanCode) {
          cleanCode = 'Answer not provided'
        }

        // Format the final answerCode with the number for the template
        const answerNumber = answer.answerNumber || (index + 1)
        const finalAnswerCode = `${answerNumber}. ${cleanCode}`

        return {
          answerCode: finalAnswerCode
        }
      }).filter(answer => !answer.answerCode.endsWith('Answer not provided'))
    }

    // Clean instructions array
    if (cleaned.instructions && Array.isArray(cleaned.instructions)) {
      cleaned.instructions = cleaned.instructions.map(instruction => ({
        blankNumber: instruction.blankNumber || 1,
        instruction: String(instruction.instruction || '').replace(/undefined/g, '').trim() || 'Complete this blank'
      })).filter(instruction => instruction.instruction !== 'Complete this blank')
    }

    // Clean top-level string fields
    const stringFields = ['topic', 'subtopic', 'difficulty', 'questionDescription', 'codeBlock']
    stringFields.forEach(field => {
      if (cleaned[field]) {
        cleaned[field] = String(cleaned[field]).replace(/undefined/g, '').trim()
      }
    })

    // Remove any fields that might cause issues
    delete cleaned.highlightedCode
    delete cleaned.formattedCodeBlock
    delete cleaned.formattedAnswer

    return cleaned
  }

  /**
   * Check for undefined values in data structure
   * @param {Object} data - Data to check
   * @returns {Object} Check results
   */
  checkForUndefinedValues(data) {
    const undefinedFields = []

    // Check top-level fields
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        undefinedFields.push(`root.${key}`)
      } else if (typeof data[key] === 'string' && data[key].includes('undefined')) {
        undefinedFields.push(`root.${key} (contains "undefined" text)`)
      }
    })

    // Check answers array
    if (data.answers && Array.isArray(data.answers)) {
      data.answers.forEach((answer, index) => {
        Object.keys(answer).forEach(key => {
          if (answer[key] === undefined) {
            undefinedFields.push(`answers[${index}].${key}`)
          } else if (typeof answer[key] === 'string' && answer[key].includes('undefined')) {
            undefinedFields.push(`answers[${index}].${key} (contains "undefined" text)`)
          }
        })
      })
    }

    // Check instructions array
    if (data.instructions && Array.isArray(data.instructions)) {
      data.instructions.forEach((instruction, index) => {
        Object.keys(instruction).forEach(key => {
          if (instruction[key] === undefined) {
            undefinedFields.push(`instructions[${index}].${key}`)
          } else if (typeof instruction[key] === 'string' && instruction[key].includes('undefined')) {
            undefinedFields.push(`instructions[${index}].${key} (contains "undefined" text)`)
          }
        })
      })
    }

    return {
      hasUndefined: undefinedFields.length > 0,
      undefinedFields
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
