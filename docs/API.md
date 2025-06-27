# DOCX Generator API Documentation

## Overview

The DOCX Generator API provides endpoints for generating Microsoft Word documents from templates using dynamic data. It's designed for integration with n8n workflows and other automation tools.

**Base URL:** `https://your-app.railway.app`

## Authentication

All API endpoints (except `/health`) require authentication using an API key.

### API Key Authentication

Include your API key in the request headers:

```http
X-API-Key: your-api-key-here
```

Or use Bearer token format:

```http
Authorization: Bearer your-api-key-here
```

## Rate Limiting

- **Window:** 15 minutes (configurable)
- **Limit:** 100 requests per IP per window (configurable)
- **Headers:** Rate limit information is included in response headers

## Endpoints

### Health Check

Check the API status and health.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### Generate DOCX Document

Generate a DOCX document from a template and data.

**Endpoint:** `POST /api/generate-docx`

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "template": "invoice-template.docx",
  "data": {
    "company": {
      "name": "Acme Corp",
      "address": "123 Business St"
    },
    "client": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "items": [
      {
        "description": "Web Development",
        "quantity": 40,
        "rate": 150.00,
        "amount": 6000.00
      }
    ],
    "total": 6000.00
  },
  "options": {
    "paragraphLoop": true,
    "linebreaks": true
  }
}
```

**Parameters:**
- `template` (string, required): Name of the template file
- `data` (object, required): Data to inject into the template
- `options` (object, optional): Generation options

**Response:**
- **Content-Type:** `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Content-Disposition:** `attachment; filename="generated-document.docx"`
- **Body:** Binary DOCX file

**Success Response:** `200 OK` with DOCX file

**Error Responses:**
```json
{
  "success": false,
  "error": {
    "message": "Template not found",
    "code": "TEMPLATE_NOT_FOUND",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### List Templates

Get a list of available templates.

**Endpoint:** `GET /api/templates`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "invoice-template.docx",
        "path": "/path/to/template",
        "size": 15360,
        "modified": "2024-01-15T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### Upload Template

Upload a new DOCX template.

**Endpoint:** `POST /api/templates`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Data:**
- `template` (file, required): DOCX template file
- `filename` (string, optional): Custom filename

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Template uploaded successfully",
    "filename": "new-template.docx",
    "size": 15360,
    "path": "/path/to/template"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_API_KEY` | 401 | API key not provided |
| `INVALID_API_KEY` | 401 | Invalid API key |
| `TEMPLATE_NOT_FOUND` | 404 | Template file not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `TEMPLATE_ERROR` | 400 | Template processing error |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | Invalid file type uploaded |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

## Request Examples

### cURL Examples

**Generate DOCX:**
```bash
curl -X POST https://your-app.railway.app/api/generate-docx \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "template": "invoice-template.docx",
    "data": {
      "company": {"name": "Acme Corp"},
      "total": 1000.00
    }
  }' \
  --output generated-invoice.docx
```

**List Templates:**
```bash
curl -X GET https://your-app.railway.app/api/templates \
  -H "X-API-Key: your-api-key"
```

**Upload Template:**
```bash
curl -X POST https://your-app.railway.app/api/templates \
  -H "X-API-Key: your-api-key" \
  -F "template=@/path/to/template.docx" \
  -F "filename=my-template.docx"
```

### JavaScript Examples

**Using Fetch API:**
```javascript
// Generate DOCX
const response = await fetch('https://your-app.railway.app/api/generate-docx', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    template: 'invoice-template.docx',
    data: {
      company: { name: 'Acme Corp' },
      total: 1000.00
    }
  })
});

if (response.ok) {
  const blob = await response.blob();
  // Handle the DOCX file blob
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

**Using Axios:**
```javascript
const axios = require('axios');

try {
  const response = await axios.post(
    'https://your-app.railway.app/api/generate-docx',
    {
      template: 'invoice-template.docx',
      data: { company: { name: 'Acme Corp' } }
    },
    {
      headers: { 'X-API-Key': 'your-api-key' },
      responseType: 'arraybuffer'
    }
  );
  
  // Save the DOCX file
  const fs = require('fs');
  fs.writeFileSync('generated.docx', response.data);
} catch (error) {
  console.error('Error:', error.response.data);
}
```

## Response Headers

### Successful DOCX Generation
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="document.docx"
Content-Length: 15360
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1642248600
```

### Error Response
```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1642248600
```

## Best Practices

1. **Always handle errors** - Check response status and handle error cases
2. **Respect rate limits** - Monitor rate limit headers and implement backoff
3. **Validate data** - Ensure your data structure matches template requirements
4. **Use appropriate timeouts** - Document generation can take time for large templates
5. **Secure API keys** - Never expose API keys in client-side code
6. **Test templates** - Validate templates with sample data before production use

## Security Considerations

- API keys should be kept secure and rotated regularly
- All requests are logged for security monitoring
- File uploads are validated for type and size
- Input data is sanitized to prevent injection attacks
- CORS is configured to restrict origins (configurable)

## Support

For technical support or questions about the API, please refer to:
- Template creation guide: `/docs/templates.md`
- n8n integration guide: `/docs/n8n-integration.md`
- Troubleshooting guide: `/docs/troubleshooting.md`
