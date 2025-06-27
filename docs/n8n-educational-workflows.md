# n8n Educational Content Workflows

This guide provides comprehensive n8n workflow examples for automated coding exercise generation using our enhanced DOCX Generator API.

## Overview

The enhanced API now supports:
- **Educational Content Endpoint**: `/api/generate-exercise`
- **HTML and DOCX Output**: Choose format in request
- **Syntax Highlighting**: Automatic code highlighting
- **Multiple Languages**: Python, JavaScript, Java, C++, and more
- **Structured Validation**: Built-in exercise validation

## Basic Exercise Generation Workflow

### 1. Simple Exercise Generation

**Trigger**: Manual/Webhook
**Nodes**: HTTP Request → File Save/Email

```json
{
  "name": "Generate Coding Exercise",
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "name": "Generate Exercise",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-exercise",
        "headers": {
          "Content-Type": "application/json",
          "X-API-Key": "your-api-key"
        },
        "body": {
          "topic": "Python",
          "subtopic": "Web Scraping with BeautifulSoup",
          "difficulty": "Easy",
          "questionDescription": "Create a web scraper to extract data from HTML",
          "instructions": [
            {
              "blankNumber": 1,
              "instruction": "Import the required libraries"
            },
            {
              "blankNumber": 2,
              "instruction": "Make a GET request to fetch the webpage"
            }
          ],
          "codeBlock": "# Blank 1: Enter your code here\\n\\nurl = 'https://example.com'\\n# Blank 2: Enter your code here",
          "answers": [
            {
              "answerNumber": 1,
              "answerCode": "import requests\\nfrom bs4 import BeautifulSoup"
            },
            {
              "answerNumber": 2,
              "answerCode": "response = requests.get(url)"
            }
          ],
          "format": "html",
          "language": "python"
        },
        "responseFormat": "file"
      }
    }
  ]
}
```

### 2. Database-Driven Exercise Generation

**Trigger**: Schedule
**Nodes**: Database Query → Process Data → Generate Exercise → Save to Drive

```json
{
  "name": "Database Exercise Generator",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "value": "0 9 * * 1"}]
        }
      }
    },
    {
      "name": "Get Exercise Data",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "query": "SELECT topic, subtopic, difficulty, question_text, code_template, instructions_json, answers_json FROM exercises WHERE status = 'pending' LIMIT 10"
      }
    },
    {
      "name": "Process Exercise Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const items = $input.all();\\n\\nreturn items.map(item => {\\n  const data = item.json;\\n  \\n  return {\\n    json: {\\n      topic: data.topic,\\n      subtopic: data.subtopic,\\n      difficulty: data.difficulty,\\n      questionDescription: data.question_text,\\n      instructions: JSON.parse(data.instructions_json),\\n      codeBlock: data.code_template,\\n      answers: JSON.parse(data.answers_json),\\n      format: 'html',\\n      language: 'python'\\n    }\\n  };\\n});"
      }
    },
    {
      "name": "Generate Exercise",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-exercise",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": "={{ $json }}",
        "responseFormat": "file"
      }
    },
    {
      "name": "Save to Google Drive",
      "type": "n8n-nodes-base.googleDrive",
      "parameters": {
        "operation": "upload",
        "name": "exercise_{{ $json.topic }}_{{ $json.subtopic }}_{{ new Date().toISOString().split('T')[0] }}.html",
        "parents": ["your-folder-id"],
        "binaryData": true
      }
    }
  ]
}
```

### 3. Form-Based Exercise Creation

**Trigger**: Form Submission
**Nodes**: Form → Validate → Generate → Email

```json
{
  "name": "Form Exercise Creator",
  "nodes": [
    {
      "name": "Form Trigger",
      "type": "n8n-nodes-base.formTrigger",
      "parameters": {
        "formTitle": "Create Coding Exercise",
        "formFields": {
          "values": [
            {"fieldLabel": "Topic", "fieldType": "text", "requiredField": true},
            {"fieldLabel": "Subtopic", "fieldType": "text", "requiredField": true},
            {"fieldLabel": "Difficulty", "fieldType": "select", "fieldOptions": {"values": [{"option": "Easy"}, {"option": "Medium"}, {"option": "Hard"}]}},
            {"fieldLabel": "Programming Language", "fieldType": "select", "fieldOptions": {"values": [{"option": "python"}, {"option": "javascript"}, {"option": "java"}]}},
            {"fieldLabel": "Question Description", "fieldType": "textarea", "requiredField": true},
            {"fieldLabel": "Code Template", "fieldType": "textarea", "requiredField": true}
          ]
        }
      }
    },
    {
      "name": "Validate Exercise",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/validate-exercise",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": {
          "topic": "{{ $json.topic }}",
          "subtopic": "{{ $json.subtopic }}",
          "difficulty": "{{ $json.difficulty }}",
          "questionDescription": "{{ $json.questionDescription }}",
          "instructions": [
            {"blankNumber": 1, "instruction": "Complete the implementation"},
            {"blankNumber": 2, "instruction": "Add error handling"}
          ],
          "codeBlock": "{{ $json.codeTemplate }}",
          "answers": [
            {"answerNumber": 1, "answerCode": "# Implementation here"},
            {"answerNumber": 2, "answerCode": "# Error handling here"}
          ],
          "language": "{{ $json.programmingLanguage }}"
        }
      }
    },
    {
      "name": "Generate Exercise",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-exercise",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": "={{ $node['Validate Exercise'].json.data }}",
        "responseFormat": "file"
      }
    }
  ]
}
```

## Advanced Workflows

### 4. Batch Exercise Processing

**Use Case**: Process multiple exercises from a spreadsheet

```json
{
  "name": "Batch Exercise Processor",
  "nodes": [
    {
      "name": "Read Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "your-sheet-id",
        "range": "A2:H100"
      }
    },
    {
      "name": "Split Into Batches",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 5
      }
    },
    {
      "name": "Process Each Exercise",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const items = $input.all();\\n\\nreturn items.map(item => {\\n  const [topic, subtopic, difficulty, description, code, lang] = item.json;\\n  \\n  return {\\n    json: {\\n      topic,\\n      subtopic,\\n      difficulty,\\n      questionDescription: description,\\n      codeBlock: code,\\n      language: lang,\\n      format: 'html',\\n      instructions: [\\n        {blankNumber: 1, instruction: 'Complete the implementation'}\\n      ],\\n      answers: [\\n        {answerNumber: 1, answerCode: '# Your solution here'}\\n      ]\\n    }\\n  };\\n});"
      }
    },
    {
      "name": "Generate Exercise",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-exercise",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": "={{ $json }}",
        "responseFormat": "file"
      }
    }
  ]
}
```

### 5. Multi-Format Exercise Generation

**Use Case**: Generate both HTML and DOCX versions

```json
{
  "name": "Multi-Format Generator",
  "nodes": [
    {
      "name": "Exercise Data",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "topic": "JavaScript",
          "subtopic": "Async/Await",
          "difficulty": "Medium"
        }
      }
    },
    {
      "name": "Generate HTML",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-exercise",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": {
          "format": "html",
          "topic": "{{ $json.topic }}",
          "subtopic": "{{ $json.subtopic }}",
          "difficulty": "{{ $json.difficulty }}"
        },
        "responseFormat": "file"
      }
    },
    {
      "name": "Generate DOCX",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-exercise",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": {
          "format": "docx",
          "topic": "{{ $json.topic }}",
          "subtopic": "{{ $json.subtopic }}",
          "difficulty": "{{ $json.difficulty }}"
        },
        "responseFormat": "file"
      }
    }
  ]
}
```

## Error Handling and Best Practices

### Error Handling Node

```json
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "if ($input.first().error) {\\n  // Log error\\n  console.error('Exercise generation failed:', $input.first().error);\\n  \\n  // Send notification\\n  return [{\\n    json: {\\n      error: true,\\n      message: $input.first().error.message,\\n      timestamp: new Date().toISOString()\\n    }\\n  }];\\n}\\n\\nreturn $input.all();"
  },
  "onError": "continueRegularOutput"
}
```

### Retry Logic

```json
{
  "name": "Generate with Retry",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://your-app.railway.app/api/generate-exercise",
    "headers": {
      "X-API-Key": "your-api-key"
    },
    "body": "={{ $json }}",
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3,
        "waitBetween": 1000
      }
    }
  }
}
```

## Data Mapping Examples

### Complex Exercise Structure

```javascript
// Function node to build complex exercise data
const exerciseData = {
  topic: $json.subject,
  subtopic: $json.chapter,
  difficulty: $json.level,
  questionNumber: $json.qNum || 1,
  questionDescription: $json.description,
  instructions: $json.steps.map((step, index) => ({
    blankNumber: index + 1,
    instruction: step.text
  })),
  codeBlock: $json.template.replace(/\{\{blank(\d+)\}\}/g, 'Blank $1: Enter your code here'),
  answers: $json.solutions.map((solution, index) => ({
    answerNumber: index + 1,
    answerCode: solution.code
  })),
  format: $json.outputFormat || 'html',
  language: $json.programmingLanguage || 'python',
  options: {
    syntaxHighlighting: true,
    theme: $json.theme || 'github'
  }
}

return [{ json: exerciseData }]
```

### Dynamic Language Detection

```javascript
// Auto-detect programming language from code
function detectLanguage(code) {
  if (code.includes('def ') || code.includes('import ')) return 'python'
  if (code.includes('function ') || code.includes('const ')) return 'javascript'
  if (code.includes('public class ') || code.includes('System.out')) return 'java'
  if (code.includes('#include') || code.includes('std::')) return 'cpp'
  return 'text'
}

const language = detectLanguage($json.codeTemplate)
return [{ json: { ...$json, language } }]
```

## Integration Tips

1. **API Key Management**: Store API keys securely in n8n credentials
2. **Rate Limiting**: Implement delays between requests for batch processing
3. **File Management**: Use consistent naming conventions for generated files
4. **Error Logging**: Always include error handling nodes
5. **Data Validation**: Validate exercise data before generation
6. **Format Selection**: Choose appropriate format based on use case (HTML for web, DOCX for documents)

## Monitoring and Analytics

### Track Exercise Generation

```json
{
  "name": "Log Generation Stats",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "const stats = {\\n  timestamp: new Date().toISOString(),\\n  topic: $json.topic,\\n  language: $json.language,\\n  format: $json.format,\\n  success: !$json.error\\n};\\n\\n// Send to analytics service\\nreturn [{ json: stats }];"
  }
}
```

This comprehensive guide provides everything needed to integrate educational content generation into your n8n workflows!
