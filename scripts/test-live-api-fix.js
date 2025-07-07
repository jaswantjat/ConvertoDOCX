const axios = require('axios')
const fs = require('fs')
const path = require('path')

/**
 * Test the live API with the exact user payload to verify the fix
 */

async function testLiveApiFix() {
  console.log('🚀 Testing live API with user payload...\n')

  // Start the server first
  console.log('📡 Starting local server...')
  const { spawn } = require('child_process')
  const server = spawn('node', ['src/server.js'], {
    env: { ...process.env, PORT: '3001', API_KEY: 'test-api-key-for-debugging' },
    stdio: 'pipe'
  })

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    // Exact payload from user's report
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
    console.log('- Answers count:', testPayload.answers.length)
    console.log()

    // Make API call
    console.log('🔧 Making API call to /api/generate-exercise...')
    const response = await axios.post('http://localhost:3001/api/generate-exercise', testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key-for-debugging'
      },
      responseType: 'arraybuffer'
    })

    console.log('✅ API Response:')
    console.log('- Status:', response.status)
    console.log('- Content-Type:', response.headers['content-type'])
    console.log('- Content-Length:', response.headers['content-length'])

    // Save the response
    const outputPath = path.join(__dirname, '..', 'live-api-test-output.docx')
    fs.writeFileSync(outputPath, response.data)

    console.log('📄 DOCX saved to:', outputPath)
    console.log('📊 File size:', response.data.length, 'bytes')

    console.log('\n✅ Live API test completed successfully!')
    console.log('🔍 Please open the generated DOCX file to verify that the answers section is populated correctly.')

  } catch (error) {
    console.error('❌ Error during live API test:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data.toString())
    }
  } finally {
    // Clean up server
    console.log('\n🛑 Stopping server...')
    server.kill()
  }
}

// Run the test
testLiveApiFix().catch(console.error)
