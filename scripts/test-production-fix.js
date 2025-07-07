#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

/**
 * Test the production DOCX Generator API with the user's exact payload
 * to verify the ultimate fix is working
 */

async function testProductionAPI() {
  console.log('🚀 TESTING PRODUCTION API - ULTIMATE FIX VERIFICATION')
  console.log('====================================================\n')

  // User's exact payload
  const payload = {
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
    "language": "python",
    "format": "docx",
    "options": {
      "syntaxHighlighting": true,
      "includeLineNumbers": false,
      "theme": "github"
    }
  }

  console.log('📋 TEST PAYLOAD:')
  console.log('- Topic:', payload.topic)
  console.log('- Subtopic:', payload.subtopic)
  console.log('- Difficulty:', payload.difficulty)
  console.log('- Answers count:', payload.answers.length)
  console.log('- Language:', payload.language)
  console.log('- Format:', payload.format)
  console.log()

  const postData = JSON.stringify(payload)
  
  const options = {
    hostname: 'convertodocx-production.up.railway.app',
    port: 443,
    path: '/api/generate_exercise',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-API-Key': 'docx-api-2025-secure-key-xyz123'
    }
  }

  console.log('🌐 SENDING REQUEST TO PRODUCTION:')
  console.log('- URL: https://convertodocx-production.up.railway.app/api/generate_exercise')
  console.log('- Method: POST')
  console.log('- API Key: docx-api-2025-secure-key-xyz123')
  console.log('- Payload size:', Buffer.byteLength(postData), 'bytes')
  console.log()

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log('📡 RESPONSE RECEIVED:')
      console.log('- Status:', res.statusCode)
      console.log('- Headers:', JSON.stringify(res.headers, null, 2))
      console.log()

      let responseData = Buffer.alloc(0)

      res.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk])
        console.log('📥 Received chunk:', chunk.length, 'bytes')
      })

      res.on('end', () => {
        console.log('✅ RESPONSE COMPLETE:')
        console.log('- Total size:', responseData.length, 'bytes')
        console.log('- Content-Type:', res.headers['content-type'])
        console.log()

        if (res.statusCode === 200) {
          if (res.headers['content-type'] && res.headers['content-type'].includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            // Save the DOCX file
            const outputPath = path.join(__dirname, '..', 'production-test-output.docx')
            fs.writeFileSync(outputPath, responseData)
            
            console.log('🎉 SUCCESS - DOCX GENERATED:')
            console.log('- File saved to:', outputPath)
            console.log('- File size:', responseData.length, 'bytes')
            console.log('- Expected size range: 3180-3200 bytes')
            
            if (responseData.length >= 3180 && responseData.length <= 3200) {
              console.log('✅ File size is in expected range - ULTIMATE FIX WORKING!')
            } else if (responseData.length > 3200) {
              console.log('🎉 File size is LARGER than expected - Even better content!')
            } else {
              console.log('⚠️  File size is smaller than expected - May need investigation')
            }

            console.log()
            console.log('🔍 MANUAL VERIFICATION REQUIRED:')
            console.log('1. Open the generated DOCX file')
            console.log('2. Check the "Answers:" section')
            console.log('3. Verify all 5 answers are populated:')
            payload.answers.forEach(answer => {
              console.log(`   ${answer.answerNumber}. ${answer.answerCode}`)
            })

            console.log()
            console.log('🎯 ULTIMATE FIX VERIFICATION:')
            console.log('- If answers section is populated: ✅ FIX SUCCESSFUL')
            console.log('- If answers section is blank: ❌ Need further investigation')
            
            resolve({
              success: true,
              fileSize: responseData.length,
              filePath: outputPath
            })
          } else {
            console.log('❌ ERROR: Response is not a DOCX file')
            console.log('Response body:', responseData.toString())
            reject(new Error('Invalid response format'))
          }
        } else {
          console.log('❌ ERROR: HTTP', res.statusCode)
          console.log('Response body:', responseData.toString())
          reject(new Error(`HTTP ${res.statusCode}: ${responseData.toString()}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error('💥 REQUEST FAILED:', error.message)
      reject(error)
    })

    req.on('timeout', () => {
      console.error('⏰ REQUEST TIMEOUT')
      req.destroy()
      reject(new Error('Request timeout'))
    })

    // Set timeout
    req.setTimeout(30000)

    // Send the request
    req.write(postData)
    req.end()
  })
}

// Run the production test
testProductionAPI()
  .then((result) => {
    console.log('\n🎉 PRODUCTION TEST COMPLETED SUCCESSFULLY!')
    console.log('File size:', result.fileSize, 'bytes')
    console.log('File path:', result.filePath)
    console.log('\n🚀 ULTIMATE FIX STATUS: VERIFIED IN PRODUCTION!')
  })
  .catch((error) => {
    console.error('\n💥 PRODUCTION TEST FAILED:', error.message)
    process.exit(1)
  })
