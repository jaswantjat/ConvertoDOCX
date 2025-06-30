const Joi = require('joi')
const docxService = require('../services/docxService')
const htmlService = require('../services/htmlService')
const exerciseTemplateEngine = require('../services/exerciseTemplateEngine')
const logger = require('../utils/logger')

// Validation schema for coding exercises
const generateExerciseSchema = Joi.object({
  topic: Joi.string().required().messages({
    'string.empty': 'Topic is required',
    'any.required': 'Topic is required'
  }),
  subtopic: Joi.string().required().messages({
    'string.empty': 'Subtopic is required',
    'any.required': 'Subtopic is required'
  }),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required().messages({
    'any.only': 'Difficulty must be Easy, Medium, or Hard',
    'any.required': 'Difficulty is required'
  }),
  questionNumber: Joi.number().integer().min(1).default(1),
  questionDescription: Joi.string().required().messages({
    'string.empty': 'Question description is required',
    'any.required': 'Question description is required'
  }),
  instructions: Joi.array().items(
    Joi.object({
      blankNumber: Joi.number().integer().min(1).required(),
      instruction: Joi.string().required()
    })
  ).min(1).required().messages({
    'array.min': 'At least one instruction is required',
    'any.required': 'Instructions are required'
  }),
  codeBlock: Joi.string().required().messages({
    'string.empty': 'Code block is required',
    'any.required': 'Code block is required'
  }),
  answers: Joi.array().items(
    Joi.object({
      answerNumber: Joi.number().integer().min(1).required(),
      answerCode: Joi.string().required()
    })
  ).min(1).required().messages({
    'array.min': 'At least one answer is required',
    'any.required': 'Answers are required'
  }),
  format: Joi.string().valid('docx', 'html').default('html').messages({
    'any.only': 'Format must be either "docx" or "html"'
  }),
  language: Joi.string().default('python').messages({
    'string.base': 'Language must be a string'
  }),
  options: Joi.object({
    syntaxHighlighting: Joi.boolean().default(true),
    includeLineNumbers: Joi.boolean().default(false),
    theme: Joi.string().default('github')
  }).default({})
}).unknown(true) // Allow additional fields from n8n workflows

const exerciseController = {
  /**
   * Generate coding exercise in specified format
   */
  async generateExercise(req, res, next) {
    try {
      // Validate request body
      const { error, value } = generateExerciseSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => detail.message)
          }
        })
      }

      const { format, language, options, ...exerciseData } = value

      logger.info({
        message: `Coding exercise generation request received`,
        topic: exerciseData.topic,
        subtopic: exerciseData.subtopic,
        difficulty: exerciseData.difficulty,
        format,
        language,
        ip: req.ip
      })

      if (format === 'html') {
        // Generate HTML exercise
        const htmlContent = await htmlService.generateCodingExercise(exerciseData, {
          language,
          ...options
        })

        // Set response headers for HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        
        logger.info({
          message: 'HTML coding exercise generated successfully',
          topic: exerciseData.topic,
          size: htmlContent.length,
          ip: req.ip
        })

        // Send the HTML content
        res.send(htmlContent)

      } else {
        // Generate DOCX exercise
        const templateName = 'coding-exercise-template.docx'

        // Process exercise data for DOCX generation (same as HTML processing)
        const processedExerciseData = exerciseTemplateEngine.processExerciseData(exerciseData, {
          language,
          ...options
        })

        // Validate template exists
        const validation = await docxService.validateTemplateData(templateName, processedExerciseData)
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Exercise data validation failed',
              details: validation.errors
            }
          })
        }

        // Generate DOCX
        const docxBuffer = await docxService.generateFromTemplate(templateName, processedExerciseData, options)

        // Set response headers for file download
        const filename = `${exerciseData.topic.replace(/\s+/g, '_')}_${exerciseData.subtopic.replace(/\s+/g, '_')}_${Date.now()}.docx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Length', docxBuffer.length)

        logger.info({
          message: 'DOCX coding exercise generated successfully',
          topic: exerciseData.topic,
          filename,
          size: docxBuffer.length,
          ip: req.ip
        })

        // Send the DOCX file
        res.send(docxBuffer)
      }

    } catch (error) {
      logger.error({
        message: 'Error in generateExercise controller',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Get exercise template structure for reference
   */
  async getExerciseTemplate(req, res, next) {
    try {
      const template = {
        topic: "string (required) - Main programming topic",
        subtopic: "string (required) - Specific subtopic",
        difficulty: "string (required) - Easy, Medium, or Hard",
        questionNumber: "number (optional) - Question number, defaults to 1",
        questionDescription: "string (required) - Detailed question description",
        instructions: [
          {
            blankNumber: "number (required) - Blank number (1, 2, 3...)",
            instruction: "string (required) - Instruction text"
          }
        ],
        codeBlock: "string (required) - Code with blanks marked as 'Blank X: Enter your code here'",
        answers: [
          {
            answerNumber: "number (required) - Answer number (1, 2, 3...)",
            answerCode: "string (required) - The actual code answer"
          }
        ],
        format: "string (optional) - 'html' or 'docx', defaults to 'html'",
        language: "string (optional) - Programming language for syntax highlighting, defaults to 'python'",
        options: {
          syntaxHighlighting: "boolean (optional) - Enable syntax highlighting, defaults to true",
          includeLineNumbers: "boolean (optional) - Include line numbers, defaults to false",
          theme: "string (optional) - Syntax highlighting theme, defaults to 'github'"
        }
      }

      const example = {
        topic: "Python",
        subtopic: "Conditional branching for element presence verification",
        difficulty: "Easy",
        questionNumber: 1,
        questionDescription: "Alex needs to perform several tasks involving web scraping using Python's Conditional branching for element presence verification. The code uses the requests library to fetch webpage content and BeautifulSoup to parse HTML.",
        instructions: [
          {
            blankNumber: 1,
            instruction: "Create a GET request to fetch the webpage content from the given url as a string."
          },
          {
            blankNumber: 2,
            instruction: "Parse the fetched webpage content with BeautifulSoup specifying the proper parser."
          }
        ],
        codeBlock: `import requests
from bs4 import BeautifulSoup

class WebScraper:
    def __init__(self, url, element_id):
        self.url = url
        self.element_id = element_id

def main():
    url = "https://example.com"
    element_id = "main-content"
    
    scraper = WebScraper(url, element_id)
    
    # 1. Fetch webpage content from URL
    page_content = Blank 1: Enter your code here
    
    # 2. Parse the webpage content using BeautifulSoup
    soup = Blank 2: Enter your code here`,
        answers: [
          {
            answerNumber: 1,
            answerCode: "requests.get(scraper.url).text"
          },
          {
            answerNumber: 2,
            answerCode: 'BeautifulSoup(page_content, "html.parser")'
          }
        ],
        format: "html",
        language: "python"
      }

      res.json({
        success: true,
        data: {
          template,
          example,
          supportedLanguages: [
            'python', 'javascript', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'swift'
          ],
          supportedFormats: ['html', 'docx'],
          supportedDifficulties: ['Easy', 'Medium', 'Hard']
        }
      })

    } catch (error) {
      logger.error({
        message: 'Error in getExerciseTemplate controller',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Validate exercise data without generating
   */
  async validateExercise(req, res, next) {
    try {
      const { error, value } = generateExerciseSchema.validate(req.body)
      
      if (error) {
        return res.status(400).json({
          success: false,
          valid: false,
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        })
      }

      // Additional validation logic
      const warnings = []
      
      // Check if instructions match answers count
      if (value.instructions.length !== value.answers.length) {
        warnings.push('Number of instructions does not match number of answers')
      }

      // Check if blank numbers are sequential
      const blankNumbers = value.instructions.map(i => i.blankNumber).sort((a, b) => a - b)
      const expectedNumbers = Array.from({length: blankNumbers.length}, (_, i) => i + 1)
      if (JSON.stringify(blankNumbers) !== JSON.stringify(expectedNumbers)) {
        warnings.push('Blank numbers should be sequential starting from 1')
      }

      res.json({
        success: true,
        valid: true,
        data: value,
        warnings: warnings.length > 0 ? warnings : undefined
      })

    } catch (error) {
      logger.error({
        message: 'Error in validateExercise controller',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  }
}

module.exports = exerciseController
