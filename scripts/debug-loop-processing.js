const Docxtemplater = require('docxtemplater')
const PizZip = require('pizzip')
const fs = require('fs')
const path = require('path')

/**
 * Debug script to test docxtemplater loop processing specifically
 * Creates a minimal test case to isolate the loop issue
 */

async function debugLoopProcessing() {
  console.log('🔍 Testing docxtemplater loop processing...\n')

  // Create a minimal DOCX with just the answers loop
  const minimalDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Simple Test Document</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Topic: {topic}</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>Answers:</w:t>
      </w:r>
    </w:p>
    
    {#answers}
    <w:p>
      <w:r>
        <w:t>{answerNumber}. {answerCode}</w:t>
      </w:r>
    </w:p>
    {/answers}
    
  </w:body>
</w:document>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  try {
    // Create the minimal DOCX
    const zip = new PizZip()
    zip.file('word/document.xml', minimalDocumentXml)
    zip.file('[Content_Types].xml', contentTypes)
    zip.file('_rels/.rels', mainRels)
    
    const templateBuffer = zip.generate({ type: 'nodebuffer' })
    
    // Test data - exactly matching the user's structure
    const testData = {
      topic: "Python Test",
      answers: [
        { answerNumber: 1, answerCode: "BeautifulSoup(html_content, 'html.parser')" },
        { answerNumber: 2, answerCode: "soup.find(id=\"main-content\")" },
        { answerNumber: 3, answerCode: "main_content is not None" }
      ]
    }

    console.log('📋 Test Data:')
    console.log('- Topic:', testData.topic)
    console.log('- Answers count:', testData.answers.length)
    console.log('- Answers structure:')
    testData.answers.forEach((answer, index) => {
      console.log(`  ${index + 1}. answerNumber: ${answer.answerNumber}, answerCode: "${answer.answerCode}"`)
    })
    console.log()

    // Test with docxtemplater
    console.log('🔧 Testing with docxtemplater...')
    const docZip = new PizZip(templateBuffer)
    
    const doc = new Docxtemplater(docZip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: function(part) {
        console.log(`❌ nullGetter called for: ${part ? part.value : 'unknown'} (raw: ${part ? part.raw : 'unknown'})`)
        return ''
      },
      errorLogging: true
    })

    console.log('📊 Data being passed to docxtemplater:')
    console.log(JSON.stringify(testData, null, 2))
    console.log()

    // Render the document
    doc.render(testData)
    
    // Generate output
    const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' })
    const outputPath = path.join(__dirname, '..', 'debug-loop-test-output.docx')
    fs.writeFileSync(outputPath, outputBuffer)
    
    console.log('✅ Minimal loop test completed!')
    console.log('- Output saved to:', outputPath)
    console.log('- File size:', outputBuffer.length, 'bytes')
    
  } catch (error) {
    console.error('❌ Error during loop processing test:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the debug
debugLoopProcessing().catch(console.error)
