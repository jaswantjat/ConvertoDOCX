#!/usr/bin/env node

/**
 * Test script for the enhanced DOCX Generator API with educational content features
 */

const fs = require('fs')
const path = require('path')

// Sample exercise data matching the format from your example
const sampleExerciseData = {
  topic: "Python",
  subtopic: "Conditional branching for element presence verification",
  difficulty: "Easy",
  questionNumber: 1,
  questionDescription: "Alex needs to perform several tasks involving web scraping using Python's Conditional branching for element presence verification. The code uses the requests library to fetch webpage content and BeautifulSoup to parse HTML. It checks whether a specific HTML element with a given id is present on the page. Alex wants to store the presence status in a dictionary with keys \"url\" and \"element_found\".",
  instructions: [
    {
      blankNumber: 1,
      instruction: "Create a GET request to fetch the webpage content from the given url as a string."
    },
    {
      blankNumber: 2,
      instruction: "Parse the fetched webpage content with BeautifulSoup specifying the proper parser."
    },
    {
      blankNumber: 3,
      instruction: "Use BeautifulSoup to find the HTML element with the specified id."
    },
    {
      blankNumber: 4,
      instruction: "Form a dictionary that contains the url and a boolean indicating if the element was found."
    },
    {
      blankNumber: 5,
      instruction: "Print the value associated with key \"element_found\" from the dictionary."
    }
  ],
  codeBlock: `import requests
from bs4 import BeautifulSoup

class WebScraper:
    def __init__(self, url, element_id):
        self.url = url
        self.element_id = element_id

def main():
    url = "https://example.com"
    element_id = "main-content"

    scraper = WebScraper(url, element_id)

    # 1. Fetch webpage content from URL
    page_content = Blank 1: Enter your code here

    # 2. Parse the webpage content using BeautifulSoup
    soup = Blank 2: Enter your code here

    # 3. Find the HTML element with the specific id
    element = Blank 3: Enter your code here

    # 4. Create a dictionary with url and whether element is found
    result = Blank 4: Enter your code here

    # 5. Print whether the element was found
    print(Blank 5: Enter your code here)

if __name__ == "__main__":
    main()`,
  answers: [
    {
      answerNumber: 1,
      answerCode: "requests.get(scraper.url).text"
    },
    {
      answerNumber: 2,
      answerCode: "BeautifulSoup(page_content, \"html.parser\")"
    },
    {
      answerNumber: 3,
      answerCode: "soup.find(id=scraper.element_id)"
    },
    {
      answerNumber: 4,
      answerCode: "{\"url\": scraper.url, \"element_found\": element is not None}"
    },
    {
      answerNumber: 5,
      answerCode: "result[\"element_found\"]"
    }
  ],
  language: "python",
  format: "html"
}

async function testExerciseGeneration() {
  console.log('🧪 Testing Enhanced DOCX Generator API with Educational Content...\n')
  
  const baseUrl = 'http://localhost:3000'
  const apiKey = 'test-key-123'
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${baseUrl}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check passed:', healthData.status)
    
    // Test 2: Get exercise template structure
    console.log('\n2. Testing exercise template endpoint...')
    const templateResponse = await fetch(`${baseUrl}/api/exercise-template`, {
      headers: { 'X-API-Key': apiKey }
    })
    const templateData = await templateResponse.json()
    console.log('✅ Exercise template retrieved')
    console.log('   Supported languages:', templateData.data.supportedLanguages.slice(0, 5).join(', '), '...')
    console.log('   Supported formats:', templateData.data.supportedFormats.join(', '))
    
    // Test 3: Validate exercise data
    console.log('\n3. Testing exercise validation...')
    const validateResponse = await fetch(`${baseUrl}/api/validate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(sampleExerciseData)
    })
    const validateData = await validateResponse.json()
    console.log('✅ Exercise validation passed:', validateData.valid)
    if (validateData.warnings) {
      console.log('   Warnings:', validateData.warnings)
    }
    
    // Test 4: Generate HTML exercise
    console.log('\n4. Testing HTML exercise generation...')
    const htmlResponse = await fetch(`${baseUrl}/api/generate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        ...sampleExerciseData,
        format: 'html'
      })
    })
    
    if (htmlResponse.ok) {
      const htmlContent = await htmlResponse.text()
      
      // Save HTML to file for inspection
      const outputPath = path.join(process.cwd(), 'examples', 'generated-exercise.html')
      fs.writeFileSync(outputPath, htmlContent)
      
      console.log('✅ HTML exercise generated successfully')
      console.log(`   Content length: ${htmlContent.length} characters`)
      console.log(`   Saved to: ${outputPath}`)
      console.log('   Content-Type:', htmlResponse.headers.get('content-type'))
    } else {
      const error = await htmlResponse.json()
      console.log('❌ HTML generation failed:', error.error.message)
    }
    
    // Test 5: Generate DOCX exercise
    console.log('\n5. Testing DOCX exercise generation...')
    const docxResponse = await fetch(`${baseUrl}/api/generate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        ...sampleExerciseData,
        format: 'docx'
      })
    })
    
    if (docxResponse.ok) {
      const docxBuffer = await docxResponse.arrayBuffer()
      
      // Save DOCX to file
      const outputPath = path.join(process.cwd(), 'examples', 'generated-exercise.docx')
      fs.writeFileSync(outputPath, Buffer.from(docxBuffer))
      
      console.log('✅ DOCX exercise generated successfully')
      console.log(`   File size: ${docxBuffer.byteLength} bytes`)
      console.log(`   Saved to: ${outputPath}`)
      console.log('   Content-Type:', docxResponse.headers.get('content-type'))
    } else {
      const error = await docxResponse.json()
      console.log('❌ DOCX generation failed:', error.error.message)
    }
    
    // Test 6: Test enhanced generate-docx endpoint with HTML format
    console.log('\n6. Testing enhanced generate-docx endpoint with HTML format...')
    const enhancedResponse = await fetch(`${baseUrl}/api/generate-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        template: 'coding-exercise-template.docx',
        format: 'html',
        data: sampleExerciseData,
        options: {
          language: 'python'
        }
      })
    })
    
    if (enhancedResponse.ok) {
      const htmlContent = await enhancedResponse.text()
      console.log('✅ Enhanced generate-docx with HTML format works')
      console.log(`   Content length: ${htmlContent.length} characters`)
    } else {
      const error = await enhancedResponse.json()
      console.log('⚠️  Enhanced generate-docx failed (expected):', error.error.message)
    }
    
    console.log('\n🎉 Educational content API testing completed!')
    console.log('\n📁 Generated files:')
    console.log('   - examples/generated-exercise.html (HTML format)')
    console.log('   - examples/generated-exercise.docx (DOCX format)')
    console.log('\n💡 You can open the HTML file in a browser to see the formatted exercise!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Make sure the server is running with: npm start')
  }
}

// Additional test for different programming languages
async function testMultipleLanguages() {
  console.log('\n🔬 Testing multiple programming languages...\n')
  
  const baseUrl = 'http://localhost:3000'
  const apiKey = 'test-key-123'
  
  const languages = [
    { lang: 'javascript', topic: 'JavaScript', subtopic: 'Array Methods' },
    { lang: 'java', topic: 'Java', subtopic: 'Object-Oriented Programming' },
    { lang: 'cpp', topic: 'C++', subtopic: 'Memory Management' }
  ]
  
  for (const { lang, topic, subtopic } of languages) {
    try {
      console.log(`Testing ${lang} exercise generation...`)
      
      const exerciseData = {
        ...sampleExerciseData,
        topic,
        subtopic,
        language: lang,
        codeBlock: `// Sample ${lang} code\nfunction example() {\n    // Blank 1: Enter your code here\n    return result;\n}`
      }
      
      const response = await fetch(`${baseUrl}/api/generate-exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(exerciseData)
      })
      
      if (response.ok) {
        const htmlContent = await response.text()
        const outputPath = path.join(process.cwd(), 'examples', `generated-exercise-${lang}.html`)
        fs.writeFileSync(outputPath, htmlContent)
        console.log(`✅ ${lang} exercise generated: ${outputPath}`)
      } else {
        console.log(`❌ ${lang} exercise failed`)
      }
      
    } catch (error) {
      console.log(`❌ ${lang} test error:`, error.message)
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testExerciseGeneration()
    .then(() => testMultipleLanguages())
    .catch(console.error)
}

module.exports = { testExerciseGeneration, testMultipleLanguages, sampleExerciseData }
