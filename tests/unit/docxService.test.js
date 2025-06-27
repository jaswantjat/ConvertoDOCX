const docxService = require('../../src/services/docxService')
const fs = require('fs')
const path = require('path')

// Mock logger to avoid file system operations during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}))

describe('DocxService', () => {
  const testTemplatesDir = path.join(process.cwd(), 'src', 'templates')
  const testTemplate = path.join(testTemplatesDir, 'test-template.docx')

  beforeAll(() => {
    // Create test templates directory
    if (!fs.existsSync(testTemplatesDir)) {
      fs.mkdirSync(testTemplatesDir, { recursive: true })
    }
  })

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testTemplatesDir)) {
      fs.rmSync(testTemplatesDir, { recursive: true, force: true })
    }
  })

  describe('listTemplates', () => {
    it('should return empty array when no templates exist', () => {
      const templates = docxService.listTemplates()
      expect(Array.isArray(templates)).toBe(true)
    })

    it('should return template information when templates exist', async () => {
      // Create a mock template file
      const mockTemplateContent = Buffer.from('mock docx content')
      fs.writeFileSync(testTemplate, mockTemplateContent)

      const templates = docxService.listTemplates()
      expect(templates.length).toBeGreaterThan(0)
      
      const template = templates.find(t => t.name === 'test-template.docx')
      expect(template).toBeDefined()
      expect(template.size).toBe(mockTemplateContent.length)
    })
  })

  describe('saveTemplate', () => {
    it('should save template buffer to file', async () => {
      const templateBuffer = Buffer.from('test template content')
      const filename = 'saved-template.docx'

      const savedPath = await docxService.saveTemplate(templateBuffer, filename)
      
      expect(savedPath).toContain(filename)
      expect(fs.existsSync(savedPath)).toBe(true)
      
      const savedContent = fs.readFileSync(savedPath)
      expect(savedContent.equals(templateBuffer)).toBe(true)
    })

    it('should throw error for invalid filename', async () => {
      const templateBuffer = Buffer.from('test content')
      const invalidFilename = '../../../etc/passwd'

      await expect(docxService.saveTemplate(templateBuffer, invalidFilename))
        .rejects.toThrow()
    })
  })

  describe('validateTemplateData', () => {
    it('should return valid for proper data object', async () => {
      const templateName = 'test-template.docx'
      const data = { name: 'John', age: 30 }

      // Create mock template
      fs.writeFileSync(path.join(testTemplatesDir, templateName), 'mock content')

      const result = await docxService.validateTemplateData(templateName, data)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for non-existent template', async () => {
      const result = await docxService.validateTemplateData('non-existent.docx', {})
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template not found: non-existent.docx')
    })

    it('should return invalid for non-object data', async () => {
      const templateName = 'test-template.docx'
      fs.writeFileSync(path.join(testTemplatesDir, templateName), 'mock content')

      const result = await docxService.validateTemplateData(templateName, 'invalid data')
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Data must be a valid object')
    })
  })

  describe('generateFromBuffer', () => {
    it('should handle empty template buffer gracefully', async () => {
      const emptyBuffer = Buffer.alloc(0)
      const data = { name: 'Test' }

      await expect(docxService.generateFromBuffer(emptyBuffer, data))
        .rejects.toThrow()
    })

    it('should handle invalid template data', async () => {
      // This would need a proper DOCX template buffer for full testing
      // For now, we test error handling
      const invalidBuffer = Buffer.from('not a docx file')
      const data = { name: 'Test' }

      await expect(docxService.generateFromBuffer(invalidBuffer, data))
        .rejects.toThrow()
    })
  })
})
