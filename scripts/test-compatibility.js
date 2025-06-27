#!/usr/bin/env node

/**
 * Compatibility test script to ensure all features work after dependency updates
 */

const fs = require('fs')
const path = require('path')

async function testCompatibility() {
  console.log('🧪 Testing compatibility after dependency updates...\n')
  
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000'
  const apiKey = process.env.API_KEY || 'test-key-123'
  
  const tests = []
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${baseUrl}/health`)
    const healthData = await healthResponse.json()
    
    if (healthData.status === 'healthy') {
      console.log('✅ Health check passed')
      tests.push({ name: 'Health Check', status: 'PASS' })
    } else {
      console.log('❌ Health check failed')
      tests.push({ name: 'Health Check', status: 'FAIL' })
    }
    
    // Test 2: Core DOCX generation
    console.log('\n2. Testing core DOCX generation...')
    const docxResponse = await fetch(`${baseUrl}/api/generate-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        template: 'saved-template.docx',
        format: 'docx',
        data: {
          name: 'Test User',
          date: new Date().toISOString().split('T')[0],
          content: 'This is a compatibility test'
        }
      })
    })
    
    if (docxResponse.ok) {
      console.log('✅ DOCX generation works')
      tests.push({ name: 'DOCX Generation', status: 'PASS' })
    } else {
      console.log('❌ DOCX generation failed:', await docxResponse.text())
      tests.push({ name: 'DOCX Generation', status: 'FAIL' })
    }
    
    // Test 3: HTML generation
    console.log('\n3. Testing HTML generation...')
    const htmlResponse = await fetch(`${baseUrl}/api/generate-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        template: 'saved-template.docx',
        format: 'html',
        data: {
          name: 'Test User',
          date: new Date().toISOString().split('T')[0],
          content: 'This is a compatibility test'
        }
      })
    })
    
    if (htmlResponse.ok) {
      console.log('✅ HTML generation works')
      tests.push({ name: 'HTML Generation', status: 'PASS' })
    } else {
      console.log('❌ HTML generation failed:', await htmlResponse.text())
      tests.push({ name: 'HTML Generation', status: 'FAIL' })
    }
    
    // Test 4: Educational content generation
    console.log('\n4. Testing educational content generation...')
    const exerciseResponse = await fetch(`${baseUrl}/api/generate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        topic: 'Python',
        subtopic: 'Compatibility Test',
        difficulty: 'Easy',
        questionDescription: 'Test exercise generation after dependency updates',
        instructions: [
          { blankNumber: 1, instruction: 'Print hello world' }
        ],
        codeBlock: '# Blank 1: Enter your code here',
        answers: [
          { answerNumber: 1, answerCode: 'print("Hello, World!")' }
        ],
        format: 'html',
        language: 'python'
      })
    })
    
    if (exerciseResponse.ok) {
      console.log('✅ Educational content generation works')
      tests.push({ name: 'Educational Content', status: 'PASS' })
    } else {
      console.log('❌ Educational content generation failed:', await exerciseResponse.text())
      tests.push({ name: 'Educational Content', status: 'FAIL' })
    }
    
    // Test 5: Supported languages endpoint
    console.log('\n5. Testing supported languages endpoint...')
    const languagesResponse = await fetch(`${baseUrl}/api/supported-languages`, {
      headers: { 'X-API-Key': apiKey }
    })
    
    if (languagesResponse.ok) {
      const languagesData = await languagesResponse.json()
      if (languagesData.success && languagesData.data.languages.length > 0) {
        console.log('✅ Supported languages endpoint works')
        tests.push({ name: 'Supported Languages', status: 'PASS' })
      } else {
        console.log('❌ Supported languages endpoint returned invalid data')
        tests.push({ name: 'Supported Languages', status: 'FAIL' })
      }
    } else {
      console.log('❌ Supported languages endpoint failed')
      tests.push({ name: 'Supported Languages', status: 'FAIL' })
    }
    
    // Test 6: Exercise validation
    console.log('\n6. Testing exercise validation...')
    const validationResponse = await fetch(`${baseUrl}/api/validate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        topic: 'Python',
        subtopic: 'Test',
        difficulty: 'Easy',
        questionDescription: 'Test validation',
        instructions: [{ blankNumber: 1, instruction: 'Test' }],
        codeBlock: 'test',
        answers: [{ answerNumber: 1, answerCode: 'test' }],
        language: 'python'
      })
    })
    
    if (validationResponse.ok) {
      const validationData = await validationResponse.json()
      if (validationData.success && validationData.valid) {
        console.log('✅ Exercise validation works')
        tests.push({ name: 'Exercise Validation', status: 'PASS' })
      } else {
        console.log('❌ Exercise validation returned invalid result')
        tests.push({ name: 'Exercise Validation', status: 'FAIL' })
      }
    } else {
      console.log('❌ Exercise validation failed')
      tests.push({ name: 'Exercise Validation', status: 'FAIL' })
    }
    
    // Test 7: Template listing
    console.log('\n7. Testing template listing...')
    const templatesResponse = await fetch(`${baseUrl}/api/templates`, {
      headers: { 'X-API-Key': apiKey }
    })
    
    if (templatesResponse.ok) {
      console.log('✅ Template listing works')
      tests.push({ name: 'Template Listing', status: 'PASS' })
    } else {
      console.log('❌ Template listing failed')
      tests.push({ name: 'Template Listing', status: 'FAIL' })
    }
    
    // Summary
    console.log('\n📊 Compatibility Test Results:')
    console.log('================================')
    
    const passed = tests.filter(t => t.status === 'PASS').length
    const failed = tests.filter(t => t.status === 'FAIL').length
    
    tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌'
      console.log(`${icon} ${test.name}: ${test.status}`)
    })
    
    console.log(`\nTotal: ${tests.length} tests`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    
    if (failed === 0) {
      console.log('\n🎉 All compatibility tests passed! The dependency updates are successful.')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some compatibility tests failed. Please review the issues above.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Compatibility test failed with error:', error.message)
    console.error('Make sure the server is running with: npm start')
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCompatibility()
}

module.exports = { testCompatibility }
