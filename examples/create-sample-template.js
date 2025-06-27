#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

// Create a minimal DOCX template
function createSampleTemplate() {
  // This is a simplified DOCX structure
  // In a real scenario, you'd create this with Microsoft Word
  const templateContent = `
Hello {name}!

This is a sample invoice template.

Company: {company.name}
Address: {company.address}

Bill To:
{client.name}
{client.email}

Items:
{#items}
- {description}: ${amount}
{/items}

Total: ${total}

Thank you for your business!
  `.trim()

  // For demonstration, we'll create a simple text file
  // In production, you'd use a proper DOCX template created in Word
  const templatePath = path.join(process.cwd(), 'src', 'templates', 'sample-invoice.docx')
  
  // Create a basic ZIP structure (DOCX is essentially a ZIP file)
  const zip = new PizZip()
  
  // Add the main document content
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Hello {name}!</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Company: {company.name}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Address: {company.address}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Bill To: {client.name}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Email: {client.email}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Items:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{#items}- {description}: {amount}{/items}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Total: {total}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

  // Add required DOCX files
  zip.file('word/document.xml', documentXml)
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`)

  // Generate the DOCX file
  const buffer = zip.generate({ type: 'nodebuffer' })
  
  // Save to templates directory
  fs.writeFileSync(templatePath, buffer)
  
  console.log(`✅ Sample template created: ${templatePath}`)
  return templatePath
}

if (require.main === module) {
  try {
    createSampleTemplate()
  } catch (error) {
    console.error('❌ Error creating sample template:', error.message)
    process.exit(1)
  }
}

module.exports = { createSampleTemplate }
