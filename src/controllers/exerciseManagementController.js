const Joi = require('joi')
const fs = require('fs')
const path = require('path')
const logger = require('../utils/logger')
const exerciseTemplateEngine = require('../services/exerciseTemplateEngine')

// In-memory storage for demo purposes (in production, use a database)
let exerciseCategories = [
  { id: 1, name: 'Web Development', description: 'Frontend and backend web technologies' },
  { id: 2, name: 'Data Structures', description: 'Arrays, lists, trees, graphs, etc.' },
  { id: 3, name: 'Algorithms', description: 'Sorting, searching, dynamic programming' },
  { id: 4, name: 'Object-Oriented Programming', description: 'Classes, inheritance, polymorphism' },
  { id: 5, name: 'Database Programming', description: 'SQL, NoSQL, database design' }
]

let exerciseTopics = [
  { id: 1, categoryId: 1, name: 'HTML/CSS', languages: ['html', 'css'] },
  { id: 2, categoryId: 1, name: 'JavaScript DOM', languages: ['javascript'] },
  { id: 3, categoryId: 1, name: 'React Components', languages: ['javascript', 'typescript'] },
  { id: 4, categoryId: 2, name: 'Array Operations', languages: ['python', 'javascript', 'java', 'cpp'] },
  { id: 5, categoryId: 2, name: 'Linked Lists', languages: ['python', 'java', 'cpp', 'csharp'] },
  { id: 6, categoryId: 3, name: 'Sorting Algorithms', languages: ['python', 'java', 'cpp'] },
  { id: 7, categoryId: 4, name: 'Class Design', languages: ['python', 'java', 'csharp', 'cpp'] },
  { id: 8, categoryId: 5, name: 'SQL Queries', languages: ['sql'] }
]

let exerciseTemplates = []

// Validation schemas
const categorySchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(500)
})

const topicSchema = Joi.object({
  categoryId: Joi.number().integer().required(),
  name: Joi.string().required().min(3).max(100),
  languages: Joi.array().items(Joi.string()).min(1).required()
})

const exerciseManagementController = {
  /**
   * Get all exercise categories
   */
  async getCategories(req, res, next) {
    try {
      logger.info({
        message: 'Exercise categories requested',
        ip: req.ip
      })

      res.json({
        success: true,
        data: {
          categories: exerciseCategories,
          count: exerciseCategories.length
        }
      })
    } catch (error) {
      logger.error({
        message: 'Error getting exercise categories',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Create new exercise category
   */
  async createCategory(req, res, next) {
    try {
      const { error, value } = categorySchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => detail.message)
          }
        })
      }

      const newCategory = {
        id: Math.max(...exerciseCategories.map(c => c.id), 0) + 1,
        ...value,
        createdAt: new Date().toISOString()
      }

      exerciseCategories.push(newCategory)

      logger.info({
        message: 'Exercise category created',
        categoryId: newCategory.id,
        name: newCategory.name,
        ip: req.ip
      })

      res.status(201).json({
        success: true,
        data: newCategory
      })
    } catch (error) {
      logger.error({
        message: 'Error creating exercise category',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Get all exercise topics
   */
  async getTopics(req, res, next) {
    try {
      const { categoryId, language } = req.query

      let filteredTopics = exerciseTopics

      if (categoryId) {
        filteredTopics = filteredTopics.filter(topic => topic.categoryId === parseInt(categoryId))
      }

      if (language) {
        filteredTopics = filteredTopics.filter(topic => topic.languages.includes(language.toLowerCase()))
      }

      // Enrich topics with category information
      const enrichedTopics = filteredTopics.map(topic => ({
        ...topic,
        category: exerciseCategories.find(cat => cat.id === topic.categoryId)
      }))

      logger.info({
        message: 'Exercise topics requested',
        filters: { categoryId, language },
        count: enrichedTopics.length,
        ip: req.ip
      })

      res.json({
        success: true,
        data: {
          topics: enrichedTopics,
          count: enrichedTopics.length,
          filters: { categoryId, language }
        }
      })
    } catch (error) {
      logger.error({
        message: 'Error getting exercise topics',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Create new exercise topic
   */
  async createTopic(req, res, next) {
    try {
      const { error, value } = topicSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => detail.message)
          }
        })
      }

      // Validate category exists
      const category = exerciseCategories.find(cat => cat.id === value.categoryId)
      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid category ID',
            details: ['Category does not exist']
          }
        })
      }

      const newTopic = {
        id: Math.max(...exerciseTopics.map(t => t.id), 0) + 1,
        ...value,
        createdAt: new Date().toISOString()
      }

      exerciseTopics.push(newTopic)

      logger.info({
        message: 'Exercise topic created',
        topicId: newTopic.id,
        name: newTopic.name,
        categoryId: newTopic.categoryId,
        ip: req.ip
      })

      res.status(201).json({
        success: true,
        data: {
          ...newTopic,
          category
        }
      })
    } catch (error) {
      logger.error({
        message: 'Error creating exercise topic',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Get supported programming languages
   */
  async getSupportedLanguages(req, res, next) {
    try {
      const languages = exerciseTemplateEngine.getSupportedLanguages()
      const themes = exerciseTemplateEngine.getAvailableThemes()
      const difficulties = exerciseTemplateEngine.getDifficultyLevels()

      res.json({
        success: true,
        data: {
          languages: languages.map(lang => ({
            code: lang,
            name: exerciseManagementController.getLanguageDisplayName(lang),
            extension: exerciseManagementController.getLanguageExtension(lang)
          })),
          themes: themes.map(theme => ({
            code: theme,
            name: exerciseManagementController.getThemeDisplayName(theme)
          })),
          difficulties: difficulties.map(diff => ({
            code: diff,
            name: diff,
            description: exerciseManagementController.getDifficultyDescription(diff)
          }))
        }
      })
    } catch (error) {
      logger.error({
        message: 'Error getting supported languages',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Get exercise statistics
   */
  async getExerciseStats(req, res, next) {
    try {
      const stats = {
        categories: {
          total: exerciseCategories.length,
          list: exerciseCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            topicCount: exerciseTopics.filter(topic => topic.categoryId === cat.id).length
          }))
        },
        topics: {
          total: exerciseTopics.length,
          byLanguage: exerciseManagementController.getTopicsByLanguage(),
          byDifficulty: exerciseManagementController.getTopicsByDifficulty()
        },
        languages: {
          supported: exerciseTemplateEngine.getSupportedLanguages().length,
          mostUsed: exerciseManagementController.getMostUsedLanguages()
        }
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error({
        message: 'Error getting exercise statistics',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  /**
   * Search exercises by criteria
   */
  async searchExercises(req, res, next) {
    try {
      const { q, category, language, difficulty } = req.query

      let results = exerciseTopics

      // Filter by search query
      if (q) {
        const query = q.toLowerCase()
        results = results.filter(topic => 
          topic.name.toLowerCase().includes(query) ||
          exerciseCategories.find(cat => cat.id === topic.categoryId)?.name.toLowerCase().includes(query)
        )
      }

      // Filter by category
      if (category) {
        results = results.filter(topic => topic.categoryId === parseInt(category))
      }

      // Filter by language
      if (language) {
        results = results.filter(topic => topic.languages.includes(language.toLowerCase()))
      }

      // Enrich with category information
      const enrichedResults = results.map(topic => ({
        ...topic,
        category: exerciseCategories.find(cat => cat.id === topic.categoryId)
      }))

      res.json({
        success: true,
        data: {
          results: enrichedResults,
          count: enrichedResults.length,
          query: { q, category, language, difficulty }
        }
      })
    } catch (error) {
      logger.error({
        message: 'Error searching exercises',
        error: error.message,
        stack: error.stack,
        ip: req.ip
      })
      next(error)
    }
  },

  // Helper methods
  getLanguageDisplayName(code) {
    const names = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'java': 'Java',
      'cpp': 'C++',
      'csharp': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'typescript': 'TypeScript',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'sql': 'SQL'
    }
    return names[code] || code.charAt(0).toUpperCase() + code.slice(1)
  },

  getLanguageExtension(code) {
    const extensions = {
      'python': '.py',
      'javascript': '.js',
      'java': '.java',
      'cpp': '.cpp',
      'csharp': '.cs',
      'php': '.php',
      'ruby': '.rb',
      'go': '.go',
      'rust': '.rs',
      'swift': '.swift',
      'typescript': '.ts',
      'kotlin': '.kt',
      'scala': '.scala',
      'sql': '.sql'
    }
    return extensions[code] || '.txt'
  },

  getThemeDisplayName(code) {
    const names = {
      'github': 'GitHub Light',
      'github-dark': 'GitHub Dark',
      'vs2015': 'Visual Studio 2015',
      'atom-one-dark': 'Atom One Dark',
      'atom-one-light': 'Atom One Light'
    }
    return names[code] || code.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  },

  getDifficultyDescription(difficulty) {
    const descriptions = {
      'Easy': 'Beginner level - Basic concepts and simple implementations',
      'Medium': 'Intermediate level - Moderate complexity with multiple concepts',
      'Hard': 'Advanced level - Complex problems requiring deep understanding'
    }
    return descriptions[difficulty] || 'No description available'
  },

  getTopicsByLanguage() {
    const languageCount = {}
    exerciseTopics.forEach(topic => {
      topic.languages.forEach(lang => {
        languageCount[lang] = (languageCount[lang] || 0) + 1
      })
    })
    return languageCount
  },

  getTopicsByDifficulty() {
    // This would be based on actual exercise data in a real implementation
    return {
      'Easy': Math.floor(exerciseTopics.length * 0.4),
      'Medium': Math.floor(exerciseTopics.length * 0.4),
      'Hard': Math.floor(exerciseTopics.length * 0.2)
    }
  },

  getMostUsedLanguages() {
    const languageCount = exerciseManagementController.getTopicsByLanguage()
    return Object.entries(languageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, count }))
  }
}

module.exports = exerciseManagementController
