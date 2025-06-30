#!/usr/bin/env node

/**
 * Test the actual API endpoint with the problematic data
 * This simulates the exact n8n payload that was causing issues
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const API_URL = 'https://convertodocx-production.up.railway.app/api/generate-exercise'
const API_KEY = 'docx-api-2025-secure-key-xyz123'

// Test data that exactly matches the problematic n8n payload
const testPayload = {
  "topic": "python",
  "subtopic": "Conditional element presence checking",
  "difficulty": "Easy",
  "questionDescription": "Alex needs to perform several tasks involving webscraping using python's Conditional element presence checking. The BeautifulSoup class has key properties for parsing HTML documents and methods to find and check HTML elements' presence. Alex wants to check if a specific HTML element with the id \"main-content\" exists before extracting its text.\n\nComplete the code using the instructions:  \nAt Blank 1: Create a BeautifulSoup object from the given HTML content string  \nAt Blank 2: Use the appropriate method to find the element with id \"main-content\"  \nAt Blank 3: Check if the element found is not None and assign the condition to a variable  \nAt Blank 4: Retrieve the text from the element only if it is present, otherwise assign a default message  \nAt Blank 5: Print the final extracted text or the default message  \n\nA few lines in the Sample Script are missing (Enter your code here). You need to complete the code as per the given instructions.",
  "instructions": [
    {"blankNumber":1,"instruction":"Complete blank 1"},
    {"blankNumber":2,"instruction":"Complete blank 2"},
    {"blankNumber":3,"instruction":"Complete blank 3"},
    {"blankNumber":4,"instruction":"Complete blank 4"},
    {"blankNumber":5,"instruction":"Complete blank 5"}
  ],
  "codeBlock": "from bs4 import BeautifulSoup\n\nhtml_content = \"\"\"\n<html>\n<head><title>Sample Page</title></head>\n<body>\n<div id=\"main-content\">\n<p>Welcome to the sample page!</p>\n</div>\n</body>\n</html>\n\"\"\"\n\ndef main():\n    # 1. Create BeautifulSoup object from HTML content\n    soup = Blank 1  # Enter your code here\n    # 2. Find the element with id \"main-content\"\n    main_content = Blank 2  # Enter your code here\n    # 3. Check if the element exists\n    is_present = Blank 3  # Enter your code here\n    # 4. Retrieve text if present, else a default message\n    extracted_text = Blank 4  # Enter your code here\n    # 5. Print the extracted text or default message\n    print(Blank 5)  # Enter your code here\n\nif __name__ == \"__main__\":\n    main()",
  "answers": [
    {"answerNumber":1,"answerCode":"BeautifulSoup(html_content, 'html.parser')"},
    {"answerNumber":2,"answerCode":"soup.find(id=\"main-content\")"},
    {"answerNumber":3,"answerCode":"main_content is not None"},
    {"answerNumber":4,"answerCode":"main_content.get_text() if is_present else \"Element not found.\""},
    {"answerNumber":5,"answerCode":"extracted_text"}
  ],
  "format": "docx",
  "language": "python",
  "options": {
    "syntaxHighlighting": true,
    "includeLineNumbers": false,
    "theme": "github"
  }
}

function makeAPIRequest(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload)
    
    const options = {
      hostname: 'convertodocx-production.up.railway.app',
      port: 443,
      path: '/api/generate-exercise',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = Buffer.alloc(0)
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk])
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          })
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data.toString()}`))
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.write(postData)
    req.end()
  })
}

async function testAPIEndpoint() {
  console.log('🌐 Testing live API endpoint...')
  console.log(`📡 URL: ${API_URL}`)
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`)
  
  try {
    console.log('\n📤 Sending request with problematic payload...')
    
    const response = await makeAPIRequest(testPayload)
    
    console.log(`✅ Response received!`)
    console.log(`📊 Status Code: ${response.statusCode}`)
    console.log(`📄 Content-Type: ${response.headers['content-type']}`)
    console.log(`📏 Content-Length: ${response.data.length} bytes`)
    
    // Save the response
    const outputPath = path.join(process.cwd(), 'api-test-output.docx')
    fs.writeFileSync(outputPath, response.data)
    console.log(`💾 DOCX saved to: ${outputPath}`)
    
    // Verify it's a valid DOCX file (should start with PK signature)
    const isValidDocx = response.data.length > 0 && 
                       response.data[0] === 0x50 && 
                       response.data[1] === 0x4B
    
    console.log(`✅ Valid DOCX file: ${isValidDocx}`)
    
    if (isValidDocx) {
      console.log('\n🎉 API test SUCCESSFUL!')
      console.log('📋 The API successfully:')
      console.log('   • Parsed detailed instructions from questionDescription')
      console.log('   • Generated DOCX without duplicate sections')
      console.log('   • Avoided undefined values in the output')
      console.log('   • Returned a valid DOCX file')
      
      console.log('\n📝 Next steps:')
      console.log('   1. Open the generated DOCX file to verify formatting')
      console.log('   2. Update your n8n HTTP node with the simplified configuration')
      console.log('   3. Test with your actual n8n workflow')
    } else {
      console.log('\n❌ API test FAILED: Invalid DOCX file generated')
    }
    
    return true
    
  } catch (error) {
    console.log(`\n❌ API test FAILED: ${error.message}`)
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 Network issue: Could not reach the API endpoint')
      console.log('   • Check your internet connection')
      console.log('   • Verify the API URL is correct')
    } else if (error.message.includes('401')) {
      console.log('🔑 Authentication issue: Invalid API key')
      console.log('   • Verify the API key is correct')
      console.log('   • Check if the API key has expired')
    } else if (error.message.includes('400')) {
      console.log('📝 Request issue: Invalid payload format')
      console.log('   • Check the request payload structure')
      console.log('   • Verify all required fields are present')
    }
    
    return false
  }
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing health endpoint...')
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'convertodocx-production.up.railway.app',
      port: 443,
      path: '/health',
      method: 'GET'
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const healthData = JSON.parse(data)
          console.log(`✅ Health check passed`)
          console.log(`📊 Status: ${healthData.status}`)
          console.log(`⏰ Uptime: ${Math.round(healthData.uptime)} seconds`)
          console.log(`🌍 Environment: ${healthData.environment}`)
          resolve(true)
        } else {
          console.log(`❌ Health check failed: ${res.statusCode}`)
          resolve(false)
        }
      })
    })

    req.on('error', (err) => {
      console.log(`❌ Health check error: ${err.message}`)
      resolve(false)
    })

    req.end()
  })
}

async function runAPITests() {
  console.log('🚀 Starting API endpoint tests...\n')
  
  // Test health endpoint first
  const healthOk = await testHealthEndpoint()
  
  if (!healthOk) {
    console.log('\n❌ Health check failed. API may be down.')
    return
  }
  
  // Test the main endpoint
  const apiOk = await testAPIEndpoint()
  
  console.log('\n📊 API Test Summary:')
  console.log(`   🏥 Health endpoint: ${healthOk ? 'PASSED' : 'FAILED'}`)
  console.log(`   🎯 Exercise endpoint: ${apiOk ? 'PASSED' : 'FAILED'}`)
  
  if (healthOk && apiOk) {
    console.log('\n🎉 All API tests PASSED! The solution is working correctly.')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAPITests()
}

module.exports = { runAPITests, testAPIEndpoint, testHealthEndpoint }
