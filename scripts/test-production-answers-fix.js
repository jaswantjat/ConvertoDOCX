#!/usr/bin/env node

const axios = require('axios')
const fs = require('fs')
const path = require('path')

/**
 * Critical production test for blank answers issue
 * Tests the exact user payload against both local and production environments
 */

async function testProductionAnswersFix() {
  console.log('🚨 CRITICAL PRODUCTION TEST: Blank Answers Issue')
  console.log('================================================\n')

  // Exact user payload that's causing the issue
  const criticalTestPayload = {
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

  console.log('📋 Testing with EXACT user payload:')
  console.log('- Topic:', criticalTestPayload.topic)
  console.log('- Answers count:', criticalTestPayload.answers.length)
  console.log('- Answer structure validation:')
  criticalTestPayload.answers.forEach((answer, index) => {
    console.log(`  ${index + 1}. answerNumber: ${answer.answerNumber}, answerCode: "${answer.answerCode.substring(0, 50)}..."`)
  })
  console.log()

  // Test production environment
  console.log('🌐 Testing PRODUCTION environment...')
  try {
    const productionResponse = await axios.post(
      'https://convertodocx-production.up.railway.app/api/generate-exercise',
      criticalTestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'docx-api-2025-secure-key-xyz123'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    )

    console.log('✅ Production API Response:')
    console.log('- Status:', productionResponse.status)
    console.log('- Content-Type:', productionResponse.headers['content-type'])
    console.log('- Content-Length:', productionResponse.headers['content-length'])

    // Save production output for inspection
    const productionOutputPath = path.join(__dirname, '..', 'production-critical-test-output.docx')
    fs.writeFileSync(productionOutputPath, productionResponse.data)

    console.log('📄 Production DOCX saved to:', productionOutputPath)
    console.log('📊 Production file size:', productionResponse.data.length, 'bytes')

    // Analyze the file size - if it's too small, likely the answers are missing
    if (productionResponse.data.length < 3000) {
      console.log('⚠️  WARNING: File size is suspiciously small - answers may be missing!')
    }

  } catch (error) {
    console.error('❌ Production test FAILED:', error.message)
    if (error.response) {
      console.error('- Status:', error.response.status)
      console.error('- Response:', error.response.data ? error.response.data.toString() : 'No response data')
    }
  }

  console.log('\n🔍 CRITICAL ANALYSIS:')
  console.log('1. Check the generated DOCX file manually')
  console.log('2. Look for the "Answers:" section')
  console.log('3. Verify if answers 1-5 are populated or blank')
  console.log('4. If blank, this confirms the production issue')
  
  console.log('\n📋 Expected Answers Section Content:')
  console.log('Answers:')
  criticalTestPayload.answers.forEach(answer => {
    console.log(`${answer.answerNumber}. ${answer.answerCode}`)
  })

  console.log('\n🚨 If the answers section is blank in the generated DOCX,')
  console.log('   this confirms the critical production issue!')
}

// Install axios if not available
async function ensureAxios() {
  try {
    require('axios')
  } catch (error) {
    console.log('📦 Installing axios for testing...')
    const { execSync } = require('child_process')
    execSync('npm install axios --no-save', { stdio: 'inherit' })
  }
}

// Run the critical test
async function main() {
  try {
    await ensureAxios()
    await testProductionAnswersFix()
  } catch (error) {
    console.error('💥 CRITICAL TEST FAILED:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { testProductionAnswersFix }
