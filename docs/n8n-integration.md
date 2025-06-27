# n8n Integration Guide

This guide explains how to integrate the DOCX Generator API with n8n workflows for automated document generation.

## Prerequisites

1. **n8n instance** (cloud or self-hosted)
2. **DOCX Generator API** deployed on Railway
3. **API key** for authentication
4. **DOCX templates** uploaded to the API

## Basic HTTP Request Node Configuration

### 1. Add HTTP Request Node

1. In your n8n workflow, add an **HTTP Request** node
2. Configure the following settings:

**Basic Settings:**
- **Method:** `POST`
- **URL:** `https://your-app.railway.app/api/generate-docx`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "X-API-Key": "your-api-key-here"
}
```

**Body (JSON):**
```json
{
  "template": "invoice-template.docx",
  "data": {
    "company": {
      "name": "{{ $json.companyName }}",
      "address": "{{ $json.companyAddress }}"
    },
    "client": {
      "name": "{{ $json.clientName }}",
      "email": "{{ $json.clientEmail }}"
    },
    "total": "{{ $json.totalAmount }}"
  }
}
```

**Response Settings:**
- **Response Format:** `File`
- **Output File Name:** `generated-document-{{ $json.invoiceNumber }}.docx`

## Example Workflows

### 1. Invoice Generation Workflow

**Trigger:** Webhook or Schedule
**Nodes:** HTTP Request → Email/File Storage

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "generate-invoice",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Generate Invoice",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-docx",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": {
          "template": "invoice-template.docx",
          "data": {
            "invoice": {
              "number": "{{ $json.invoiceNumber }}",
              "date": "{{ $json.invoiceDate }}",
              "dueDate": "{{ $json.dueDate }}"
            },
            "client": {
              "name": "{{ $json.clientName }}",
              "email": "{{ $json.clientEmail }}",
              "address": "{{ $json.clientAddress }}"
            },
            "items": "{{ $json.items }}",
            "total": "{{ $json.total }}"
          }
        },
        "responseFormat": "file"
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "to": "{{ $node['Webhook'].json.clientEmail }}",
        "subject": "Invoice {{ $node['Webhook'].json.invoiceNumber }}",
        "text": "Please find your invoice attached.",
        "attachments": "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,{{ $node['Generate Invoice'].binary.data.data }}"
      }
    }
  ]
}
```

### 2. Report Generation from Database

**Trigger:** Schedule (daily/weekly/monthly)
**Nodes:** Database Query → Data Processing → HTTP Request → File Storage

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "value": "0 9 1 * *"}]
        }
      }
    },
    {
      "name": "Get Sales Data",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "query": "SELECT * FROM sales WHERE date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')"
      }
    },
    {
      "name": "Process Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const items = $input.all();\nconst totalSales = items.reduce((sum, item) => sum + item.json.amount, 0);\nconst topProducts = items.reduce((acc, item) => {\n  acc[item.json.product] = (acc[item.json.product] || 0) + item.json.amount;\n  return acc;\n}, {});\n\nreturn [{\n  json: {\n    report: {\n      title: 'Monthly Sales Report',\n      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),\n      totalSales,\n      totalOrders: items.length,\n      topProducts: Object.entries(topProducts).map(([name, sales]) => ({ name, sales }))\n    }\n  }\n}];"
      }
    },
    {
      "name": "Generate Report",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-docx",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": {
          "template": "monthly-report.docx",
          "data": "{{ $json.report }}"
        },
        "responseFormat": "file"
      }
    }
  ]
}
```

### 3. Contract Generation Workflow

**Trigger:** Form Submission
**Nodes:** Form Data → Validation → HTTP Request → Document Storage

```json
{
  "name": "Contract Generation",
  "nodes": [
    {
      "name": "Form Trigger",
      "type": "n8n-nodes-base.formTrigger",
      "parameters": {
        "formTitle": "Contract Request Form",
        "formFields": {
          "values": [
            {"fieldLabel": "Client Name", "fieldType": "text", "requiredField": true},
            {"fieldLabel": "Service Type", "fieldType": "select", "fieldOptions": {"values": [{"option": "Consulting"}, {"option": "Development"}]}},
            {"fieldLabel": "Contract Value", "fieldType": "number", "requiredField": true}
          ]
        }
      }
    },
    {
      "name": "Generate Contract",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-app.railway.app/api/generate-docx",
        "headers": {
          "X-API-Key": "your-api-key"
        },
        "body": {
          "template": "service-contract.docx",
          "data": {
            "contract": {
              "number": "SC-{{ new Date().getFullYear() }}-{{ String(Math.floor(Math.random() * 1000)).padStart(3, '0') }}",
              "date": "{{ new Date().toLocaleDateString() }}",
              "effectiveDate": "{{ new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString() }}"
            },
            "client": {
              "name": "{{ $json.clientName }}",
              "serviceType": "{{ $json.serviceType }}",
              "value": "{{ $json.contractValue }}"
            }
          }
        },
        "responseFormat": "file"
      }
    }
  ]
}
```

## Advanced Configuration

### 1. Error Handling

Add error handling to your workflows:

```json
{
  "name": "Generate Document with Error Handling",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://your-app.railway.app/api/generate-docx",
    "headers": {
      "X-API-Key": "your-api-key"
    },
    "body": "{{ $json }}",
    "responseFormat": "file",
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3
      }
    }
  },
  "onError": "continueErrorOutput"
}
```

### 2. Dynamic Template Selection

Use expressions to select templates dynamically:

```json
{
  "body": {
    "template": "{{ $json.documentType === 'invoice' ? 'invoice-template.docx' : 'quote-template.docx' }}",
    "data": "{{ $json }}"
  }
}
```

### 3. Batch Document Generation

Generate multiple documents in a loop:

```json
{
  "name": "Batch Generate",
  "type": "n8n-nodes-base.splitInBatches",
  "parameters": {
    "batchSize": 5
  }
}
```

## Data Mapping Examples

### 1. Simple Field Mapping

```json
{
  "data": {
    "customerName": "{{ $json.customer.firstName }} {{ $json.customer.lastName }}",
    "orderDate": "{{ $json.order.createdAt }}",
    "totalAmount": "{{ $json.order.total }}"
  }
}
```

### 2. Array Processing

```json
{
  "data": {
    "items": "{{ $json.orderItems.map(item => ({ description: item.name, quantity: item.qty, price: item.price, total: item.qty * item.price })) }}"
  }
}
```

### 3. Conditional Data

```json
{
  "data": {
    "discount": "{{ $json.discountPercent > 0 ? $json.discountPercent : null }}",
    "hasDiscount": "{{ $json.discountPercent > 0 }}"
  }
}
```

## File Handling

### 1. Save to Google Drive

```json
{
  "name": "Save to Drive",
  "type": "n8n-nodes-base.googleDrive",
  "parameters": {
    "operation": "upload",
    "name": "{{ $json.fileName }}.docx",
    "parents": ["folder-id"],
    "binaryData": true,
    "binaryPropertyName": "data"
  }
}
```

### 2. Send via Email

```json
{
  "name": "Email Document",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "to": "{{ $json.recipientEmail }}",
    "subject": "Your Document is Ready",
    "attachments": "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,{{ $binary.data.data }}"
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**
   - Check API key is correct
   - Ensure X-API-Key header is set
   - Verify API key has proper permissions

2. **Template Not Found (404)**
   - Verify template name matches uploaded file
   - Check template was uploaded successfully
   - Ensure file extension is .docx

3. **Validation Errors (400)**
   - Check JSON structure matches template requirements
   - Validate all required fields are provided
   - Ensure data types are correct

4. **Rate Limiting (429)**
   - Implement retry logic with exponential backoff
   - Monitor rate limit headers
   - Consider upgrading API limits if needed

### Debug Tips

1. **Use Function Node** to inspect data:
```javascript
console.log('Data being sent:', JSON.stringify($json, null, 2));
return $input.all();
```

2. **Test with Static Data** first before using dynamic expressions

3. **Check Response Headers** for rate limiting and error information

4. **Enable Detailed Logging** in n8n for troubleshooting

## Best Practices

1. **Template Management**
   - Use descriptive template names
   - Version your templates
   - Test templates with sample data

2. **Data Validation**
   - Validate required fields before API call
   - Handle missing or null values gracefully
   - Use default values where appropriate

3. **Error Handling**
   - Always include error handling nodes
   - Log errors for debugging
   - Provide fallback options

4. **Performance**
   - Use batch processing for multiple documents
   - Implement caching where possible
   - Monitor API response times

5. **Security**
   - Store API keys securely in n8n credentials
   - Use environment variables for sensitive data
   - Regularly rotate API keys
