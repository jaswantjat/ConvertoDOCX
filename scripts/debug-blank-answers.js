const exerciseTemplateEngine = require('../src/services/exerciseTemplateEngine')
const docxService = require('../src/services/docxService')
const logger = require('../src/utils/logger')
const fs = require('fs')
const path = require('path')

/**
 * Debug script to investigate blank answers issue
 * Tests the exact payload structure reported by the user
 */

async function debugBlankAnswers() {
  console.log('🔍 Starting blank answers debugging...\n')

  // Exact payload structure from user's report
  const testPayload = {
    "topic": "python",
    "subtopic": "Conditional element presence checking",
    "difficulty": "Easy",
    "questionDescription": "Alex needs to perform several tasks involving webscraping using python's Conditional element presence checking. The BeautifulSoup class has key properties for parsing HTML documents and methods to find and check HTML elements' presence. Alex wants to check if a specific HTML element with the id \"main-content\" exists before extracting its text.\n\nComplete the code using the instructions:  \nAt Blank 1: Create a BeautifulSoup object from the given HTML content string  \nAt Blank 2: Use the appropriate method to find the element with id \"main-content\"  \nAt Blank 3: Check if the element found is not None and assign the condition to a variable  \nAt Blank 4: Retrieve the text from the element only if it is present, otherwise assign a default message  \nAt Blank 5: Print the final extracted text or the default message  \n\nA few lines in the Sample Script are missing (Enter your code here). You need to complete the code as per the given instructions.",
    "codeBlock": "from bs4 import BeautifulSoup\n\nhtml_content = \"\"\"\n<html>\n<head><title>Sample Page</title></head>\n<body>\n<div id=\"main-content\">\n<p>Welcome to the sample page!</p>\n</div>\n</body>\n</html>\n\"\"\"\n\ndef main():\n    # 1. Create BeautifulSoup object from HTML content\n    soup = Blank 1  # Enter your code here\n    # 2. Find the element with id \"main-content\"\n    main_content = Blank 2  # Enter your code here\n    # 3. Check if the element exists\n    is_present = Blank 3  # Enter your code here\n    # 4. Retrieve text if present, else a default message\n    extracted_text = Blank 4  # Enter your code here\n    # 5. Print the extracted text or default message\n    print(Blank 5)  # Enter your code here\n\nif __name__ == \"__main__\":\n    main()",
    "answers": [
      {"answerNumber":1,"answerCode":"1. BeautifulSoup(html_content, 'html.parser')"},
      {"answerNumber":2,"answerCode":"2. soup.find(id=\"main-content\")"},
      {"answerNumber":3,"answerCode":"3. main_content is not None"},
      {"answerNumber":4,"answerCode":"4. main_content.get_text() if is_present else \"Element not found.\""},
      {"answerNumber":5,"answerCode":"5. extracted_text"}
    ],
    "format": "docx",
    "language": "python",
    "options": {
      "syntaxHighlighting": true,
      "includeLineNumbers": false,
      "theme": "github"
    }
  }

  console.log('📋 Test Payload:')
  console.log('- Topic:', testPayload.topic)
  console.log('- Subtopic:', testPayload.subtopic)
  console.log('- Answers count:', testPayload.answers.length)
  console.log('- Answers structure:')
  testPayload.answers.forEach((answer, index) => {
    console.log(`  ${index + 1}. answerNumber: ${answer.answerNumber}, answerCode: "${answer.answerCode.substring(0, 50)}..."`)
  })
  console.log()

  try {
    // Step 1: Test exerciseTemplateEngine processing
    console.log('🔧 Step 1: Testing exerciseTemplateEngine.processExerciseData()...')
    const processedData = exerciseTemplateEngine.processExerciseData(testPayload, {
      language: testPayload.language,
      ...testPayload.options
    })

    console.log('✅ Processed data structure:')
    console.log('- Topic:', processedData.topic)
    console.log('- Answers array exists:', !!processedData.answers)
    console.log('- Answers array length:', processedData.answers ? processedData.answers.length : 0)
    
    if (processedData.answers && processedData.answers.length > 0) {
      console.log('- Processed answers:')
      processedData.answers.forEach((answer, index) => {
        console.log(`  ${index + 1}. answerNumber: ${answer.answerNumber}, answerCode: "${answer.answerCode}"`)
      })
    } else {
      console.log('❌ No answers found in processed data!')
    }
    console.log()

    // Step 2: Test template validation
    console.log('🔧 Step 2: Testing template validation...')
    const templateName = 'coding-exercise-template.docx'
    const validation = await docxService.validateTemplateData(templateName, processedData)
    
    console.log('✅ Template validation result:')
    console.log('- Valid:', validation.valid)
    if (!validation.valid) {
      console.log('- Errors:', validation.errors)
    }
    console.log()

    // Step 3: Generate DOCX and save for inspection
    console.log('🔧 Step 3: Generating DOCX for inspection...')
    const docxBuffer = await docxService.generateFromTemplate(templateName, processedData, testPayload.options)
    
    const outputPath = path.join(__dirname, '..', 'debug-blank-answers-output.docx')
    fs.writeFileSync(outputPath, docxBuffer)
    
    console.log('✅ DOCX generated successfully:')
    console.log('- File size:', docxBuffer.length, 'bytes')
    console.log('- Saved to:', outputPath)
    console.log()

    // Step 4: Inspect the data that was actually passed to docxtemplater
    console.log('🔧 Step 4: Data structure analysis...')
    console.log('Raw data keys:', Object.keys(processedData))
    console.log('Answers data type:', typeof processedData.answers)
    console.log('Answers is array:', Array.isArray(processedData.answers))
    
    if (processedData.answers) {
      console.log('Answers JSON:', JSON.stringify(processedData.answers, null, 2))
    }

    console.log('\n✅ Debug completed successfully!')
    console.log('📄 Check the generated DOCX file to see if answers appear correctly.')

  } catch (error) {
    console.error('❌ Error during debugging:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run the debug
debugBlankAnswers().catch(console.error)
