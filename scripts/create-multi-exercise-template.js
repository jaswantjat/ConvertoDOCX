#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

/**
 * Create a DOCX template for multiple exercises in one document
 */
function createMultiExerciseTemplate() {
  console.log('📚 Creating multi-exercise DOCX template...')
  
  // Template XML for multiple exercises
  const templateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    
    <!-- Document Title -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="480"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
        <w:t>Programming Exercises Collection</w:t>
      </w:r>
    </w:p>
    
    <!-- Document Metadata -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="0" w:after="360"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>Total Exercises: {totalExercises}</w:t>
      </w:r>
    </w:p>
    
    <!-- Page Break -->
    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>
    
    <!-- Exercises Loop Start -->
    <w:p>
      <w:r>
        <w:t>{#exercises}</w:t>
      </w:r>
    </w:p>
    
    <!-- Exercise Header -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="480" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>Exercise {exerciseNumber}</w:t>
      </w:r>
    </w:p>
    
    <!-- Topic and Subtopic -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Topic: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{topic}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>Subtopic: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>{subtopic}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>Difficulty: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>{difficulty}</w:t>
      </w:r>
    </w:p>
    
    <!-- Question Description -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Question {questionNumber}:</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
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
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>Instructions:</w:t>
      </w:r>
    </w:p>
    
    <!-- Instructions Loop -->
    <w:p>
      <w:r>
        <w:t>{#instructions}</w:t>
      </w:r>
    </w:p>
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
    <w:p>
      <w:r>
        <w:t>{/instructions}</w:t>
      </w:r>
    </w:p>
    
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
        <w:t>Sample Script:</w:t>
      </w:r>
    </w:p>
    
    <!-- Sample Script -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="240"/>
        <w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/>
        <w:ind w:left="240" w:right="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
          <w:sz w:val="18"/>
        </w:rPr>
        <w:t>{codeBlock}</w:t>
      </w:r>
    </w:p>
    
    <!-- Answers Header -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="360" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Answers:</w:t>
      </w:r>
    </w:p>
    
    <!-- Answers Loop -->
    <w:p>
      <w:r>
        <w:t>{#answers}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:before="120" w:after="120"/>
        <w:ind w:left="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
          <w:sz w:val="18"/>
          <w:b/>
        </w:rPr>
        <w:t>Answer {answerNumber}: </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
          <w:sz w:val="18"/>
        </w:rPr>
        <w:t>{answerCode}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{/answers}</w:t>
      </w:r>
    </w:p>
    
    <!-- Page Break Between Exercises (except last) -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="480" w:after="0"/>
      </w:pPr>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>
    
    <!-- Exercises Loop End -->
    <w:p>
      <w:r>
        <w:t>{/exercises}</w:t>
      </w:r>
    </w:p>
    
  </w:body>
</w:document>`

  // Create the DOCX structure
  const zip = new PizZip()
  
  // Add the main document
  zip.file('word/document.xml', templateXml)
  
  // Add required DOCX files
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`)

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/styles.xml"/>
</Relationships>`)

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)

  // Add basic styles
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`)

  // Generate the DOCX buffer
  const buffer = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 4
    }
  })

  // Save the template
  const outputPath = path.join(process.cwd(), 'src', 'templates', 'multi-exercise-template.docx')
  fs.writeFileSync(outputPath, buffer)
  
  console.log('✅ Multi-exercise template created:', outputPath)
  return outputPath
}

if (require.main === module) {
  createMultiExerciseTemplate()
}

module.exports = createMultiExerciseTemplate
