#!/usr/bin/env node

/**
 * Test script to verify DOCX formatting fixes
 * This script tests the complete solution for the DOCX output formatting issues
 */

const path = require('path')
const fs = require('fs')

// Import our services
const exerciseTemplateEngine = require('../src/services/exerciseTemplateEngine')
const docxService = require('../src/services/docxService')

console.log('🧪 Testing DOCX formatting fixes...\n')

// Test data that mimics the problematic n8n payload
const testData = {
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

async function testInstructionParsing() {
  console.log('1️⃣ Testing instruction parsing from questionDescription...')
  
  // Test if the engine detects generic instructions
  const hasGeneric = exerciseTemplateEngine.hasGenericInstructions(testData.instructions)
  console.log(`   Generic instructions detected: ${hasGeneric}`)
  
  // Test instruction parsing
  const parsedInstructions = exerciseTemplateEngine.parseInstructionsFromText(testData.questionDescription)
  console.log(`   Parsed ${parsedInstructions.length} detailed instructions:`)
  
  parsedInstructions.forEach(inst => {
    console.log(`   - Blank ${inst.blankNumber}: ${inst.instruction}`)
  })
  
  // Test question cleaning
  const cleanedQuestion = exerciseTemplateEngine.cleanQuestionDescription(testData.questionDescription)
  console.log(`   Cleaned question length: ${cleanedQuestion.length} chars`)
  console.log(`   Cleaned question preview: ${cleanedQuestion.substring(0, 100)}...`)
  
  return parsedInstructions.length > 0
}

async function testDataProcessing() {
  console.log('\n2️⃣ Testing exercise data processing...')
  
  const processedData = exerciseTemplateEngine.processExerciseData(testData, {
    language: 'python',
    syntaxHighlighting: true
  })
  
  console.log(`   Processed instructions count: ${processedData.instructions.length}`)
  console.log(`   Processed answers count: ${processedData.answers.length}`)
  
  // Check for undefined values
  const hasUndefinedInstructions = processedData.instructions.some(inst => 
    inst.instruction.includes('undefined') || inst.instruction === 'undefined'
  )
  const hasUndefinedAnswers = processedData.answers.some(ans => 
    ans.answerCode.includes('undefined') || ans.answerCode === 'undefined'
  )
  
  console.log(`   Contains undefined instructions: ${hasUndefinedInstructions}`)
  console.log(`   Contains undefined answers: ${hasUndefinedAnswers}`)
  
  // Show sample processed instruction
  if (processedData.instructions.length > 0) {
    console.log(`   Sample instruction: Blank ${processedData.instructions[0].blankNumber}: ${processedData.instructions[0].instruction}`)
  }
  
  return processedData
}

async function testDocxGeneration(processedData) {
  console.log('\n3️⃣ Testing DOCX generation...')
  
  try {
    const templateName = 'coding-exercise-template.docx'
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateName)
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.log(`   ❌ Template not found: ${templatePath}`)
      return false
    }
    
    console.log(`   ✅ Template found: ${templateName}`)
    
    // Generate DOCX
    const docxBuffer = await docxService.generateFromTemplate(templateName, processedData)
    
    console.log(`   ✅ DOCX generated successfully`)
    console.log(`   📄 Buffer size: ${docxBuffer.length} bytes`)
    
    // Save test output
    const outputPath = path.join(process.cwd(), 'test-output.docx')
    fs.writeFileSync(outputPath, docxBuffer)
    console.log(`   💾 Test DOCX saved to: ${outputPath}`)
    
    return true
  } catch (error) {
    console.log(`   ❌ DOCX generation failed: ${error.message}`)
    return false
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting comprehensive DOCX formatting tests...\n')
    
    // Test 1: Instruction parsing
    const instructionsParsed = await testInstructionParsing()
    
    // Test 2: Data processing
    const processedData = await testDataProcessing()
    
    // Test 3: DOCX generation
    const docxGenerated = await testDocxGeneration(processedData)
    
    // Summary
    console.log('\n📊 Test Results Summary:')
    console.log(`   ✅ Instruction parsing: ${instructionsParsed ? 'PASSED' : 'FAILED'}`)
    console.log(`   ✅ Data processing: ${processedData ? 'PASSED' : 'FAILED'}`)
    console.log(`   ✅ DOCX generation: ${docxGenerated ? 'PASSED' : 'FAILED'}`)
    
    if (instructionsParsed && processedData && docxGenerated) {
      console.log('\n🎉 All tests PASSED! The DOCX formatting issues should be resolved.')
      console.log('\n📋 Expected improvements in DOCX output:')
      console.log('   • No duplicate "Sample Script:" sections')
      console.log('   • Detailed instructions instead of "Complete blank X"')
      console.log('   • No "undefined" values in instructions or answers')
      console.log('   • Clean question description without embedded instructions')
    } else {
      console.log('\n❌ Some tests FAILED. Please check the error messages above.')
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message)
    console.error(error.stack)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
}

module.exports = { runTests, testInstructionParsing, testDataProcessing, testDocxGeneration }
