#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

/**
 * Creates a simple test DOCX template for compatibility testing
 */
function createTestTemplate() {
  console.log('📝 Creating test DOCX template...')
  
  const zip = new PizZip()
  
  // Simple document content
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Name: {name}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Date: {date}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Content: {content}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  // Main relationships
  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  // Add all files to the ZIP
  zip.file('word/document.xml', documentXml)
  zip.file('[Content_Types].xml', contentTypes)
  zip.file('_rels/.rels', mainRels)

  // Generate the DOCX file
  const buffer = zip.generate({ type: 'nodebuffer' })
  
  // Save to templates directory
  const templatePath = path.join(process.cwd(), 'src', 'templates', 'saved-template.docx')
  fs.writeFileSync(templatePath, buffer)
  
  console.log(`✅ Test template created: ${templatePath}`)
  return templatePath
}

if (require.main === module) {
  try {
    createTestTemplate()
  } catch (error) {
    console.error('❌ Error creating test template:', error.message)
    process.exit(1)
  }
}

module.exports = { createTestTemplate }
