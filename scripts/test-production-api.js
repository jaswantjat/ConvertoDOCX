#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')

// Production API configuration
const PRODUCTION_URL = 'https://convertodocx-production.up.railway.app'
const API_KEY = 'docx-api-2025-secure-key-xyz123'

// Sample data that should reproduce the undefined values issue
const sampleExerciseData = {
  topic: "Python Programming",
  subtopic: "Conditional Element Presence Checking",
  difficulty: "Medium",
  questionNumber: 1,
  questionDescription: `Write a Python function that checks if specific elements exist in a list and returns appropriate messages.

Complete the code using the instructions:

At Blank 1: Define the function with parameters 'items' and 'target_elements'
At Blank 2: Initialize an empty dictionary to store results
At Blank 3: Iterate through each target element
At Blank 4: Check if the element exists in the items list
At Blank 5: Store the result with appropriate message`,
  instructions: [
    { blankNumber: 1, instruction: "Complete blank 1" },
    { blankNumber: 2, instruction: "Complete blank 2" },
    { blankNumber: 3, instruction: "Complete blank 3" },
    { blankNumber: 4, instruction: "Complete blank 4" },
    { blankNumber: 5, instruction: "Complete blank 5" }
  ],
  codeBlock: `def check_element_presence(Blank 1: Enter your code here, Blank 2: Enter your code here):
    Blank 3: Enter your code here
    
    for element in Blank 4: Enter your code here:
        if Blank 5: Enter your code here:
            results[element] = f"'{element}' is present in the list"
        else:
            results[element] = f"'{element}' is not found in the list"
    
    return results

# Test the function
items = ['apple', 'banana', 'cherry', 'date']
targets = ['apple', 'grape', 'cherry']
result = check_element_presence(items, targets)
print(result)`,
  answers: [
    { answerNumber: 1, answerCode: "items, target_elements" },
    { answerNumber: 2, answerCode: "results = {}" },
    { answerNumber: 3, answerCode: "results = {}" },
    { answerNumber: 4, answerCode: "target_elements" },
    { answerNumber: 5, answerCode: "element in items" }
  ],
  format: "docx",
  language: "python"
}

/**
 * Make HTTPS request to production API
 */
function makeAPIRequest(endpoint, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, PRODUCTION_URL)
    const postData = method === 'POST' ? JSON.stringify(data) : null

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'User-Agent': 'DOCX-API-Test/1.0'
      }
    }

    // Add headers for POST requests
    if (method === 'POST') {
      options.headers['Content-Type'] = 'application/json'
      options.headers['Content-Length'] = Buffer.byteLength(postData)
      options.headers['X-API-Key'] = API_KEY
    }

    console.log(`🔗 Making request to: ${PRODUCTION_URL}${endpoint}`)
    console.log(`📝 Request data keys: ${Object.keys(data).join(', ')}`)
    
    const req = https.request(options, (res) => {
      let responseData = Buffer.alloc(0)
      
      res.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk])
      })
      
      res.on('end', () => {
        console.log(`📊 Response status: ${res.statusCode}`)
        console.log(`📏 Response size: ${responseData.length} bytes`)
        console.log(`🏷️ Content-Type: ${res.headers['content-type']}`)
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          })
        } else {
          // Try to parse error response
          try {
            const errorText = responseData.toString('utf8')
            console.log(`❌ Error response: ${errorText}`)
            reject(new Error(`API request failed with status ${res.statusCode}: ${errorText}`))
          } catch (e) {
            reject(new Error(`API request failed with status ${res.statusCode}`))
          }
        }
      })
    })

    req.on('error', (error) => {
      console.error(`🚨 Request error: ${error.message}`)
      reject(error)
    })

    if (method === 'POST' && postData) {
      req.write(postData)
    }
    req.end()
  })
}

/**
 * Test the health endpoint
 */
async function testHealthEndpoint() {
  console.log('\n🏥 Testing health endpoint...')

  try {
    const response = await makeAPIRequest('/health', {}, 'GET')
    console.log('✅ Health check passed')
    return true
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`)
    console.log('⚠️ Continuing with exercise generation test...')
    return false
  }
}

/**
 * Test the exercise generation endpoint
 */
async function testExerciseGeneration() {
  console.log('\n📚 Testing exercise generation endpoint...')
  
  try {
    const response = await makeAPIRequest('/api/generate-exercise', sampleExerciseData)
    
    // Save the response to a file for analysis
    const outputPath = path.join(process.cwd(), 'production-test-output.docx')
    fs.writeFileSync(outputPath, response.data)
    
    console.log('✅ Exercise generation successful')
    console.log(`💾 DOCX saved to: ${outputPath}`)
    console.log(`📏 File size: ${response.data.length} bytes`)
    
    return {
      success: true,
      filePath: outputPath,
      fileSize: response.data.length
    }
  } catch (error) {
    console.log(`❌ Exercise generation failed: ${error.message}`)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Main test function
 */
async function runProductionTests() {
  console.log('🚀 Starting Production API Tests')
  console.log('=' .repeat(50))
  
  // Test health endpoint first (but don't abort if it fails)
  const healthOk = await testHealthEndpoint()
  
  // Test exercise generation
  const exerciseResult = await testExerciseGeneration()
  
  console.log('\n📋 Test Summary:')
  console.log('=' .repeat(30))
  console.log(`Health Check: ${healthOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Exercise Generation: ${exerciseResult.success ? '✅ PASS' : '❌ FAIL'}`)
  
  if (exerciseResult.success) {
    console.log(`Generated File: ${exerciseResult.filePath}`)
    console.log(`File Size: ${exerciseResult.fileSize} bytes`)
    console.log('\n🔍 Next Steps:')
    console.log('1. Open the generated DOCX file to check for undefined values')
    console.log('2. Verify instruction parsing worked correctly')
    console.log('3. Check if answers are properly formatted')
  } else {
    console.log(`Error: ${exerciseResult.error}`)
  }
  
  console.log('\n🏁 Production tests completed')
}

// Run tests if this script is executed directly
if (require.main === module) {
  runProductionTests().catch(error => {
    console.error('🚨 Test execution failed:', error.message)
    process.exit(1)
  })
}

module.exports = {
  makeAPIRequest,
  testHealthEndpoint,
  testExerciseGeneration,
  sampleExerciseData
}
