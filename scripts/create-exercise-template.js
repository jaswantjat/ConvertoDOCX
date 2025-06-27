#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

/**
 * Creates a professional DOCX template for coding exercises
 */
function createCodingExerciseTemplate() {
  console.log('🎓 Creating coding exercise DOCX template...')
  
  const zip = new PizZip()
  
  // Main document content with proper Word XML structure
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- Topic Header -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>Topic: {topic}</w:t>
      </w:r>
    </w:p>
    
    <!-- Subtopic -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>Subtopic: {subtopic}</w:t>
      </w:r>
    </w:p>
    
    <!-- Difficulty Level -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="120" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>Difficulty level: {difficulty}</w:t>
      </w:r>
    </w:p>
    
    <!-- Question Header -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="360" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>Question {questionNumber}:</w:t>
      </w:r>
    </w:p>
    
    <!-- Question Description -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{questionDescription}</w:t>
      </w:r>
    </w:p>
    
    <!-- Instructions Header -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Complete the code using the instructions:</w:t>
      </w:r>
    </w:p>
    
    <!-- Instructions List -->
    {#instructions}
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="120"/>
        <w:ind w:left="360"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>At Blank {blankNumber}: {instruction}</w:t>
      </w:r>
    </w:p>
    {/instructions}
    
    <!-- Sample Script Header -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>A few lines in the Sample Script are missing (Enter your code here). You need to complete the code as per the given instructions.</w:t>
      </w:r>
    </w:p>
    
    <!-- Sample Script Subheader -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Sample Script:</w:t>
      </w:r>
    </w:p>
    
    <!-- Code Block -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Code"/>
        <w:spacing w:before="120" w:after="240"/>
        <w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/>
        <w:ind w:left="240" w:right="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
          <w:sz w:val="18"/>
        </w:rPr>
        <w:t xml:space="preserve">{codeBlock}</w:t>
      </w:r>
    </w:p>
    
    <!-- Answers Header -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="480" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
        </w:rPr>
        <w:t>Answers:</w:t>
      </w:r>
    </w:p>
    
    <!-- Answers List -->
    {#answers}
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>{answerNumber}. </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>{answerCode}</w:t>
      </w:r>
    </w:p>
    {/answers}
    
  </w:body>
</w:document>`

  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

  // Main relationships
  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  // Document relationships
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  // Styles for proper formatting
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="200" w:line="276" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="480" w:after="240"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="26"/>
      <w:szCs w:val="26"/>
    </w:rPr>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Code">
    <w:name w:val="Code"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="120" w:after="120"/>
      <w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/>
      <w:ind w:left="240" w:right="240"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
      <w:sz w:val="18"/>
      <w:szCs w:val="18"/>
    </w:rPr>
  </w:style>
</w:styles>`

  // Add all files to the ZIP
  zip.file('word/document.xml', documentXml)
  zip.file('[Content_Types].xml', contentTypes)
  zip.file('_rels/.rels', mainRels)
  zip.file('word/_rels/document.xml.rels', docRels)
  zip.file('word/styles.xml', styles)

  // Generate the DOCX file
  const buffer = zip.generate({ type: 'nodebuffer' })
  
  // Save to templates directory
  const templatePath = path.join(process.cwd(), 'src', 'templates', 'coding-exercise-template.docx')
  fs.writeFileSync(templatePath, buffer)
  
  console.log(`✅ Coding exercise template created: ${templatePath}`)
  return templatePath
}

if (require.main === module) {
  try {
    createCodingExerciseTemplate()
  } catch (error) {
    console.error('❌ Error creating coding exercise template:', error.message)
    process.exit(1)
  }
}

module.exports = { createCodingExerciseTemplate }
