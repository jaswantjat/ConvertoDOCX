const hljs = require('highlight.js')
const fs = require('fs')
const path = require('path')
const logger = require('../utils/logger')

class ExerciseTemplateEngine {
  constructor() {
    this.supportedLanguages = [
      'python', 'javascript', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'swift',
      'typescript', 'kotlin', 'scala', 'perl', 'bash', 'sql', 'html', 'css', 'xml', 'json'
    ]
    
    this.difficultyLevels = ['Easy', 'Medium', 'Hard']
    
    this.themes = {
      github: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
      'github-dark': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
      'vs2015': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css',
      'atom-one-dark': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css',
      'atom-one-light': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css'
    }
  }

  /**
   * Process exercise data for template generation
   * @param {Object} exerciseData - Raw exercise data
   * @param {Object} options - Processing options
   * @returns {Object} Processed exercise data
   */
  processExerciseData(exerciseData, options = {}) {
    try {
      const processed = JSON.parse(JSON.stringify(exerciseData)) // Deep clone

      // Clean up language inconsistencies in question description
      if (processed.questionDescription && options.language) {
        processed.questionDescription = this.cleanLanguageReferences(processed.questionDescription, options.language)
      }

      // Process code block for syntax highlighting
      if (processed.codeBlock && options.language) {
        processed.highlightedCode = this.highlightCode(processed.codeBlock, options.language)
        processed.formattedCodeBlock = this.formatCodeWithBlanks(processed.codeBlock)
      }

      // Process answers for syntax highlighting with enhanced error handling
      if (processed.answers && Array.isArray(processed.answers)) {
        processed.answers = processed.answers.map((answer, index) => {
          // Ensure answer has required fields with fallbacks
          const safeAnswer = {
            answerNumber: answer.answerNumber || (index + 1),
            answerCode: answer.answerCode || answer.answer || `Answer ${index + 1}`,
            ...answer
          }

          return {
            ...safeAnswer,
            highlightedCode: options.language ?
              this.highlightCode(safeAnswer.answerCode, options.language) :
              safeAnswer.answerCode,
            formattedAnswer: this.formatAnswerCode(safeAnswer.answerCode)
          }
        }).filter(answer => answer.answerCode && answer.answerCode.trim() !== '') // Remove empty answers
      }

      // Process instructions with enhanced error handling
      if (processed.instructions && Array.isArray(processed.instructions)) {
        processed.instructions = processed.instructions.map((instruction, index) => {
          // Ensure instruction has required fields with fallbacks
          const safeInstruction = {
            blankNumber: instruction.blankNumber || (index + 1),
            instruction: instruction.instruction || instruction.text || `Complete blank ${index + 1}`,
            ...instruction
          }

          return {
            ...safeInstruction,
            formattedInstruction: this.formatInstruction(safeInstruction.instruction)
          }
        }).filter(inst => inst.instruction && inst.instruction.trim() !== '') // Remove empty instructions
      }

      // Add metadata
      processed.metadata = {
        generatedAt: new Date().toISOString(),
        language: options.language || 'text',
        theme: options.theme || 'github',
        syntaxHighlighting: options.syntaxHighlighting !== false
      }

      return processed
    } catch (error) {
      logger.error({
        message: 'Error processing exercise data',
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Highlight code using highlight.js
   * @param {string} code - Code to highlight
   * @param {string} language - Programming language
   * @returns {string} Highlighted HTML
   */
  highlightCode(code, language) {
    try {
      // Normalize language name
      const normalizedLang = this.normalizeLanguageName(language)
      
      if (hljs.getLanguage(normalizedLang)) {
        const result = hljs.highlight(code, { language: normalizedLang })
        return result.value
      } else {
        // Fallback to auto-detection
        const result = hljs.highlightAuto(code)
        return result.value
      }
    } catch (error) {
      logger.warn({
        message: 'Code highlighting failed, returning plain text',
        language,
        error: error.message
      })
      return this.escapeHtml(code)
    }
  }

  /**
   * Format code block with proper blank placeholders
   * @param {string} codeBlock - Raw code block
   * @returns {string} Formatted code block
   */
  formatCodeWithBlanks(codeBlock) {
    // Replace "Blank X: Enter your code here" with styled placeholders
    return codeBlock.replace(
      /Blank\s+(\d+):\s*Enter\s+your\s+code\s+here/gi,
      '<span class="code-blank">Blank $1: <em>Enter your code here</em></span>'
    )
  }

  /**
   * Format answer code for display
   * @param {string} answerCode - Raw answer code
   * @returns {string} Formatted answer code
   */
  formatAnswerCode(answerCode) {
    // Clean up and format answer code
    return answerCode.trim()
  }

  /**
   * Format instruction text
   * @param {string} instruction - Raw instruction text
   * @returns {string} Formatted instruction
   */
  formatInstruction(instruction) {
    // Add emphasis to important parts
    return instruction
      .replace(/\b(Create|Parse|Find|Form|Print)\b/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  }

  /**
   * Normalize language name for highlight.js
   * @param {string} language - Language name
   * @returns {string} Normalized language name
   */
  normalizeLanguageName(language) {
    const languageMap = {
      'javascript': 'javascript',
      'js': 'javascript',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'csharp': 'csharp',
      'c#': 'csharp',
      'php': 'php',
      'ruby': 'ruby',
      'rb': 'ruby',
      'go': 'go',
      'golang': 'go',
      'rust': 'rust',
      'swift': 'swift',
      'typescript': 'typescript',
      'ts': 'typescript',
      'kotlin': 'kotlin',
      'scala': 'scala',
      'perl': 'perl',
      'bash': 'bash',
      'shell': 'bash',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'xml': 'xml',
      'json': 'json'
    }

    return languageMap[language.toLowerCase()] || language.toLowerCase()
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  /**
   * Generate CSS for syntax highlighting theme
   * @param {string} theme - Theme name
   * @returns {string} CSS link tag
   */
  getThemeCSS(theme = 'github') {
    const themeUrl = this.themes[theme] || this.themes.github
    return `<link rel="stylesheet" href="${themeUrl}">`
  }

  /**
   * Generate custom CSS for exercise styling
   * @param {Object} options - Styling options
   * @returns {string} Custom CSS
   */
  getCustomCSS(options = {}) {
    return `
    <style>
      .exercise-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
        color: #333;
      }
      .exercise-header {
        border-bottom: 2px solid #e1e4e8;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .topic { 
        font-size: 24px; 
        font-weight: bold; 
        margin-bottom: 10px; 
        color: #0366d6;
      }
      .subtopic { 
        font-size: 20px; 
        font-weight: bold; 
        margin-bottom: 10px; 
        color: #586069;
      }
      .difficulty { 
        font-size: 20px; 
        font-weight: bold; 
        margin-bottom: 20px;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
      }
      .difficulty.Easy { background-color: #d4edda; color: #155724; }
      .difficulty.Medium { background-color: #fff3cd; color: #856404; }
      .difficulty.Hard { background-color: #f8d7da; color: #721c24; }
      .question-header { 
        font-size: 22px; 
        font-weight: bold; 
        margin: 30px 0 20px 0; 
        color: #24292e;
      }
      .question-text { 
        margin-bottom: 20px; 
        text-align: justify; 
        background: #f6f8fa;
        padding: 16px;
        border-left: 4px solid #0366d6;
        border-radius: 4px;
      }
      .instructions-header { 
        font-weight: bold; 
        margin: 20px 0 10px 0; 
        font-size: 18px;
      }
      .instruction { 
        margin: 8px 0; 
        padding-left: 20px; 
        position: relative;
      }
      .instruction::before {
        content: "•";
        color: #0366d6;
        font-weight: bold;
        position: absolute;
        left: 0;
      }
      .code-header { 
        font-weight: bold; 
        margin: 30px 0 10px 0; 
        font-size: 16px;
      }
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
      .code-blank {
        background-color: #fff5b4;
        padding: 2px 4px;
        border-radius: 3px;
        border: 1px dashed #d1b23a;
      }
      .answers-header { 
        font-size: 20px; 
        font-weight: bold; 
        margin: 40px 0 20px 0; 
        border-top: 1px solid #e1e4e8;
        padding-top: 20px;
        color: #0366d6;
      }
      .answer {
        margin: 12px 0;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        background: #f6f8fa;
        padding: 8px 12px;
        border-radius: 4px;
        border-left: 3px solid #28a745;
      }
      .answer-number { 
        font-weight: bold; 
        color: #0366d6;
      }
      pre { 
        margin: 0; 
        white-space: pre-wrap; 
        word-wrap: break-word;
      }
      code {
        background: #f3f4f6;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 85%;
      }
      .metadata {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e1e4e8;
        font-size: 12px;
        color: #586069;
      }
      @media (max-width: 768px) {
        .exercise-container {
          padding: 10px;
        }
        .code-block {
          font-size: 12px;
        }
      }
    </style>`
  }

  /**
   * Validate exercise data structure
   * @param {Object} exerciseData - Exercise data to validate
   * @returns {Object} Validation result
   */
  validateExerciseStructure(exerciseData) {
    const errors = []
    const warnings = []

    // Required fields
    const requiredFields = ['topic', 'subtopic', 'difficulty', 'questionDescription', 'instructions', 'codeBlock', 'answers']
    
    for (const field of requiredFields) {
      if (!exerciseData[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // Validate difficulty level
    if (exerciseData.difficulty && !this.difficultyLevels.includes(exerciseData.difficulty)) {
      errors.push(`Invalid difficulty level. Must be one of: ${this.difficultyLevels.join(', ')}`)
    }

    // Validate instructions structure
    if (exerciseData.instructions && Array.isArray(exerciseData.instructions)) {
      exerciseData.instructions.forEach((instruction, index) => {
        if (!instruction.blankNumber || !instruction.instruction) {
          errors.push(`Instruction ${index + 1} is missing blankNumber or instruction text`)
        }
      })
    }

    // Validate answers structure
    if (exerciseData.answers && Array.isArray(exerciseData.answers)) {
      exerciseData.answers.forEach((answer, index) => {
        if (!answer.answerNumber || !answer.answerCode) {
          errors.push(`Answer ${index + 1} is missing answerNumber or answerCode`)
        }
      })
    }

    // Check consistency between instructions and answers
    if (exerciseData.instructions && exerciseData.answers) {
      if (exerciseData.instructions.length !== exerciseData.answers.length) {
        warnings.push('Number of instructions does not match number of answers')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get supported languages list
   * @returns {Array} List of supported programming languages
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages]
  }

  /**
   * Get available themes list
   * @returns {Array} List of available themes
   */
  getAvailableThemes() {
    return Object.keys(this.themes)
  }

  /**
   * Clean up language inconsistencies in text
   * @param {string} text - Text to clean
   * @param {string} targetLanguage - Target programming language
   * @returns {string} Cleaned text
   */
  cleanLanguageReferences(text, targetLanguage) {
    if (!text || !targetLanguage) return text

    const languageMap = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'java': 'Java',
      'cpp': 'C++',
      'csharp': 'C#',
      'go': 'Go',
      'rust': 'Rust',
      'php': 'PHP',
      'ruby': 'Ruby',
      'swift': 'Swift'
    }

    const targetLangName = languageMap[targetLanguage.toLowerCase()] || targetLanguage

    // Remove contradictory language references
    let cleanedText = text

    // Replace "Java program using python" type inconsistencies
    const inconsistentPatterns = [
      /\b(Java|JavaScript|C\+\+|C#|Go|Rust|PHP|Ruby|Swift)\s+program\s+using\s+python\b/gi,
      /\b(Java|JavaScript|C\+\+|C#|Go|Rust|PHP|Ruby|Swift)\s+application\s+using\s+python\b/gi,
      /\bdeveloping\s+a\s+(Java|JavaScript|C\+\+|C#|Go|Rust|PHP|Ruby|Swift)\s+program\s+using\s+python\b/gi
    ]

    inconsistentPatterns.forEach(pattern => {
      cleanedText = cleanedText.replace(pattern, `${targetLangName} program`)
    })

    // Clean up Java-specific syntax in non-Java exercises
    if (targetLanguage.toLowerCase() !== 'java') {
      cleanedText = cleanedText.replace(/List<[^>]+>/g, 'list')
      cleanedText = cleanedText.replace(/ArrayList<[^>]+>/g, 'list')
      cleanedText = cleanedText.replace(/\bnew\s+ArrayList<[^>]*>\(\)/g, '[]')
    }

    return cleanedText
  }

  /**
   * Get difficulty levels
   * @returns {Array} List of difficulty levels
   */
  getDifficultyLevels() {
    return [...this.difficultyLevels]
  }
}

module.exports = new ExerciseTemplateEngine()
