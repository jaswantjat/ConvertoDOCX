#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Create a simple test file to verify our API works
async function testAPI() {
  console.log('🧪 Testing DOCX Generator API...\n')
  
  // Test 1: Health check
  console.log('1. Testing health endpoint...')
  try {
    const response = await fetch('http://localhost:3000/health')
    const data = await response.json()
    console.log('✅ Health check passed:', data.status)
  } catch (error) {
    console.log('❌ Health check failed:', error.message)
    return
  }
  
  // Test 2: List templates
  console.log('\n2. Testing templates endpoint...')
  try {
    const response = await fetch('http://localhost:3000/api/templates', {
      headers: { 'X-API-Key': 'test-key-123' }
    })
    const data = await response.json()
    console.log('✅ Templates listed:', data.data.count, 'templates found')
  } catch (error) {
    console.log('❌ Templates listing failed:', error.message)
  }
  
  // Test 3: Try to generate a document (will fail without proper template, but tests the endpoint)
  console.log('\n3. Testing document generation endpoint...')
  try {
    const response = await fetch('http://localhost:3000/api/generate-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key-123'
      },
      body: JSON.stringify({
        template: 'sample-invoice.docx',
        data: {
          name: 'John Doe',
          company: { name: 'Test Corp', address: '123 Test St' },
          client: { name: 'Client Name', email: 'client@test.com' },
          items: [{ description: 'Test Item', amount: 100 }],
          total: 100
        }
      })
    })
    
    if (response.ok) {
      console.log('✅ Document generation endpoint works')
      console.log('   Content-Type:', response.headers.get('content-type'))
      console.log('   Content-Length:', response.headers.get('content-length'))
    } else {
      const error = await response.json()
      console.log('⚠️  Document generation failed (expected):', error.error.message)
    }
  } catch (error) {
    console.log('❌ Document generation test failed:', error.message)
  }
  
  console.log('\n🎉 API testing completed!')
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAPI().catch(console.error)
}

module.exports = { testAPI }
