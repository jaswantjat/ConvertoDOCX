const Mustache = require('mustache')
const hljs = require('highlight.js')
const fs = require('fs')
const path = require('path')
const logger = require('../utils/logger')

class HtmlService {
  constructor() {
    this.templatesDir = path.join(process.cwd(), 'src', 'templates', 'html')
    this.ensureTemplatesDirectory()
  }

  ensureTemplatesDirectory() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true })
      logger.info(`Created HTML templates directory: ${this.templatesDir}`)
    }
  }

  /**
   * Generate HTML from template and data
   * @param {string} templateName - Name of the HTML template file
   * @param {Object} data - Data to inject into template
   * @param {Object} options - Generation options
   * @returns {string} Generated HTML content
   */
  async generateFromTemplate(templateName, data, options = {}) {
    try {
      const templatePath = path.join(this.templatesDir, templateName)
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        throw new Error(`HTML template not found: ${templateName}`)
      }

      // Read template file
      const templateContent = fs.readFileSync(templatePath, 'utf8')
      
      return this.generateFromString(templateContent, data, options)
    } catch (error) {
      logger.error({
        message: 'Error generating HTML from template',
        templateName,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Generate HTML from template string and data
   * @param {string} templateString - Template content as string
   * @param {Object} data - Data to inject into template
   * @param {Object} options - Generation options
   * @returns {string} Generated HTML content
   */
  async generateFromString(templateString, data, options = {}) {
    try {
      // Process code blocks for syntax highlighting
      const processedData = this.processDataForHtml(data, options)
      
      // Render the template
      const html = Mustache.render(templateString, processedData)

      logger.info({
        message: 'HTML generated successfully',
        dataKeys: Object.keys(data),
        htmlLength: html.length
      })

      return html
    } catch (error) {
      logger.error({
        message: 'Error generating HTML from string',
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Generate HTML for coding exercises
   * @param {Object} exerciseData - Exercise data structure
   * @param {Object} options - Generation options
   * @returns {string} Generated HTML content
   */
  async generateCodingExercise(exerciseData, options = {}) {
    try {
      const template = this.getCodingExerciseTemplate()
      const processedData = this.processCodingExerciseData(exerciseData, options)
      
      return this.generateFromString(template, processedData, options)
    } catch (error) {
      logger.error({
        message: 'Error generating coding exercise HTML',
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Process data for HTML generation, including syntax highlighting
   * @param {Object} data - Raw data
   * @param {Object} options - Processing options
   * @returns {Object} Processed data
   */
  processDataForHtml(data, options = {}) {
    const processed = JSON.parse(JSON.stringify(data)) // Deep clone

    // Process code blocks for syntax highlighting
    if (processed.codeBlock && options.language) {
      processed.highlightedCode = this.highlightCode(processed.codeBlock, options.language)
    }

    // Process answers for syntax highlighting
    if (processed.answers && Array.isArray(processed.answers)) {
      processed.answers = processed.answers.map(answer => ({
        ...answer,
        highlightedCode: options.language ? 
          this.highlightCode(answer.answerCode || answer.answer, options.language) : 
          (answer.answerCode || answer.answer)
      }))
    }

    return processed
  }

  /**
   * Process coding exercise data specifically
   * @param {Object} exerciseData - Exercise data
   * @param {Object} options - Processing options
   * @returns {Object} Processed exercise data
   */
  processCodingExerciseData(exerciseData, options = {}) {
    const processed = this.processDataForHtml(exerciseData, options)
    
    // Add additional processing for coding exercises
    if (processed.instructions && Array.isArray(processed.instructions)) {
      processed.instructions = processed.instructions.map((instruction, index) => ({
        ...instruction,
        blankNumber: instruction.blankNumber || (index + 1)
      }))
    }

    if (processed.answers && Array.isArray(processed.answers)) {
      processed.answers = processed.answers.map((answer, index) => ({
        ...answer,
        answerNumber: answer.answerNumber || (index + 1)
      }))
    }

    return processed
  }

  /**
   * Highlight code using highlight.js
   * @param {string} code - Code to highlight
   * @param {string} language - Programming language
   * @returns {string} Highlighted HTML
   */
  highlightCode(code, language) {
    try {
      if (hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value
      } else {
        return hljs.highlightAuto(code).value
      }
    } catch (error) {
      logger.warn({
        message: 'Code highlighting failed, returning plain text',
        language,
        error: error.message
      })
      return code
    }
  }

  /**
   * Get the default coding exercise HTML template
   * @returns {string} HTML template string
   */
  getCodingExerciseTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Exercise</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #e1e4e8;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .topic { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtopic { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
        .difficulty { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
        .question-header { font-size: 22px; font-weight: bold; margin: 30px 0 20px 0; }
        .question-text { margin-bottom: 20px; text-align: justify; }
        .instructions-header { font-weight: bold; margin: 20px 0 10px 0; }
        .instruction { margin: 8px 0; padding-left: 20px; }
        .code-header { font-weight: bold; margin: 30px 0 10px 0; }
        .code-block {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            overflow-x: auto;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 14px;
            line-height: 1.45;
        }
        .answers-header { 
            font-size: 20px; 
            font-weight: bold; 
            margin: 40px 0 20px 0; 
            border-top: 1px solid #e1e4e8;
            padding-top: 20px;
        }
        .answer {
            margin: 12px 0;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .answer-number { font-weight: bold; }
        pre { margin: 0; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <div class="topic">Topic: {{topic}}</div>
        <div class="subtopic">Subtopic: {{subtopic}}</div>
        <div class="difficulty">Difficulty level: {{difficulty}}</div>
    </div>

    <div class="question-header">Question {{questionNumber}}:</div>
    
    <div class="question-text">{{questionDescription}}</div>

    <div class="instructions-header">Complete the code using the instructions:</div>
    {{#instructions}}
    <div class="instruction">At Blank {{blankNumber}}: {{instruction}}</div>
    {{/instructions}}

    <div class="code-header">A few lines in the Sample Script are missing (Enter your code here). You need to complete the code as per the given instructions.</div>
    
    <div class="code-header">Sample Script:</div>
    <div class="code-block">
        {{#highlightedCode}}
        <pre><code>{{{highlightedCode}}}</code></pre>
        {{/highlightedCode}}
        {{^highlightedCode}}
        <pre><code>{{codeBlock}}</code></pre>
        {{/highlightedCode}}
    </div>

    <div class="answers-header">Answers:</div>
    {{#answers}}
    <div class="answer">
        <span class="answer-number">{{answerNumber}}.</span> 
        {{#highlightedCode}}
        <code>{{{highlightedCode}}}</code>
        {{/highlightedCode}}
        {{^highlightedCode}}
        <code>{{answerCode}}</code>
        {{/highlightedCode}}
    </div>
    {{/answers}}
</body>
</html>`
  }

  /**
   * Save HTML template to file
   * @param {string} templateName - Template filename
   * @param {string} templateContent - Template content
   * @returns {string} Saved template path
   */
  async saveTemplate(templateName, templateContent) {
    try {
      const templatePath = path.join(this.templatesDir, templateName)
      fs.writeFileSync(templatePath, templateContent, 'utf8')
      
      logger.info({
        message: 'HTML template saved successfully',
        templateName,
        path: templatePath
      })
      
      return templatePath
    } catch (error) {
      logger.error({
        message: 'Error saving HTML template',
        templateName,
        error: error.message
      })
      throw error
    }
  }

  /**
   * List available HTML templates
   * @returns {Array} List of template files
   */
  listTemplates() {
    try {
      const files = fs.readdirSync(this.templatesDir)
      return files.filter(file => file.endsWith('.html')).map(file => ({
        name: file,
        path: path.join(this.templatesDir, file),
        size: fs.statSync(path.join(this.templatesDir, file)).size,
        modified: fs.statSync(path.join(this.templatesDir, file)).mtime
      }))
    } catch (error) {
      logger.error({
        message: 'Error listing HTML templates',
        error: error.message
      })
      return []
    }
  }
}

module.exports = new HtmlService()
