# ConvertoDOCX - Advanced Document Generation API

A comprehensive Node.js API for generating Microsoft Word documents and educational coding exercises, designed for seamless integration with n8n workflows and Railway deployment.

## 🚀 Features

### Core Document Generation
- **Template-based DOCX generation** using docxtemplater
- **HTML output support** with syntax highlighting
- **RESTful API** with comprehensive error handling
- **File upload** for template management
- **Multiple output formats** (DOCX, HTML)

### Educational Content Creation
- **Coding exercise generation** with professional formatting
- **20+ programming languages** supported (Python, JavaScript, Java, C++, etc.)
- **Syntax highlighting** with multiple themes
- **Fill-in-the-blank code templates**
- **Structured exercise validation**
- **Web interface** for live preview

### Integration & Deployment
- **n8n workflow integration** ready
- **Railway deployment** optimized
- **API key authentication** for security
- **Rate limiting** and CORS support
- **Comprehensive logging** and monitoring

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- Railway account (for deployment)
- n8n instance (for workflow integration)

## 🛠️ Quick Start

### Local Development

1. **Clone the repository:**
```bash
git clone git@github.com:jaswantjat/ConvertoDOCX.git
cd ConvertoDOCX
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the development server:**
```bash
npm start
```

The API will be available at `http://localhost:3000`

5. **Access the web interface:**
   Open `http://localhost:3000` in your browser to use the exercise preview interface.

### Railway Deployment

1. **Connect your repository to Railway:**
   - Go to [Railway](https://railway.app)
   - Create a new project from GitHub repository
   - Select this repository

2. **Configure environment variables in Railway:**
   ```
   API_KEY=your-secure-api-key-here
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-n8n-instance.com
   ```

3. **Deploy:**
   Railway will automatically deploy using the `railway.json` configuration.

## 📖 API Documentation

### Authentication

All API endpoints (except `/health`) require authentication:

```bash
curl -H "X-API-Key: your-api-key" https://your-app.railway.app/api/generate-docx
```

### Core Endpoints

| Method | Endpoint | Description | Output |
|--------|----------|-------------|--------|
| GET | `/health` | Health check (no auth required) | JSON |
| POST | `/api/generate-docx` | Generate DOCX/HTML from template | DOCX/HTML |
| GET | `/api/templates` | List available templates | JSON |
| POST | `/api/templates` | Upload new template | JSON |

### Educational Content Endpoints

| Method | Endpoint | Description | Output |
|--------|----------|-------------|--------|
| POST | `/api/generate-exercise` | Generate coding exercises | HTML/DOCX |
| GET | `/api/exercise-template` | Get exercise template structure | JSON |
| POST | `/api/validate-exercise` | Validate exercise data | JSON |
| GET | `/api/exercise-categories` | List exercise categories | JSON |
| GET | `/api/exercise-topics` | List exercise topics | JSON |
| GET | `/api/supported-languages` | Get supported languages/themes | JSON |
| GET | `/api/exercise-stats` | Get usage statistics | JSON |
| GET | `/api/search-exercises` | Search exercises | JSON |

### Examples

#### Generate DOCX Document
```bash
curl -X POST https://your-app.railway.app/api/generate-docx \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "template": "invoice-template.docx",
    "format": "docx",
    "data": {
      "company": {"name": "Acme Corp"},
      "client": {"name": "John Doe"},
      "total": 1000.00
    }
  }' \
  --output generated-invoice.docx
```

#### Generate Coding Exercise (HTML)
```bash
curl -X POST https://your-app.railway.app/api/generate-exercise \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "topic": "Python",
    "subtopic": "Web Scraping",
    "difficulty": "Easy",
    "questionDescription": "Create a web scraper using BeautifulSoup",
    "instructions": [
      {"blankNumber": 1, "instruction": "Import required libraries"},
      {"blankNumber": 2, "instruction": "Make HTTP request"}
    ],
    "codeBlock": "# Blank 1: Enter your code here\nurl = \"https://example.com\"\n# Blank 2: Enter your code here",
    "answers": [
      {"answerNumber": 1, "answerCode": "import requests\nfrom bs4 import BeautifulSoup"},
      {"answerNumber": 2, "answerCode": "response = requests.get(url)"}
    ],
    "format": "html",
    "language": "python"
  }' \
  --output exercise.html
```

## 🔧 n8n Integration

### Document Generation Workflow

1. **Method:** POST
2. **URL:** `https://your-app.railway.app/api/generate-docx`
3. **Headers:**
   ```json
   {
     "Content-Type": "application/json",
     "X-API-Key": "your-api-key"
   }
   ```
4. **Body:**
   ```json
   {
     "template": "invoice-template.docx",
     "format": "docx",
     "data": {
       "company": {"name": "{{ $json.companyName }}"},
       "total": "{{ $json.totalAmount }}"
     }
   }
   ```
5. **Response Format:** File

### Educational Content Workflow

1. **Method:** POST
2. **URL:** `https://your-app.railway.app/api/generate-exercise`
3. **Headers:**
   ```json
   {
     "Content-Type": "application/json",
     "X-API-Key": "your-api-key"
   }
   ```
4. **Body:**
   ```json
   {
     "topic": "{{ $json.topic }}",
     "subtopic": "{{ $json.subtopic }}",
     "difficulty": "{{ $json.difficulty }}",
     "questionDescription": "{{ $json.description }}",
     "instructions": "{{ $json.instructions }}",
     "codeBlock": "{{ $json.code }}",
     "answers": "{{ $json.answers }}",
     "format": "html",
     "language": "{{ $json.language }}"
   }
   ```
5. **Response Format:** File (for DOCX) or String (for HTML)

### Example Workflows

See `docs/n8n-educational-workflows.md` for comprehensive workflow examples including:
- Database-driven exercise generation
- Form-based exercise creation
- Batch processing workflows
- Multi-format output workflows

## 📁 Project Structure

```
ConvertoDOCX/
├── src/
│   ├── controllers/           # API route handlers
│   │   ├── docxController.js         # Core DOCX generation
│   │   ├── exerciseController.js     # Educational content
│   │   └── exerciseManagementController.js  # Exercise management
│   ├── middleware/            # Authentication, validation
│   ├── services/              # Business logic
│   │   ├── docxService.js            # DOCX processing
│   │   ├── htmlService.js            # HTML generation
│   │   └── exerciseTemplateEngine.js # Exercise processing
│   ├── templates/             # DOCX templates
│   │   ├── html/                     # HTML templates
│   │   └── coding-exercise-template.docx
│   └── utils/                 # Utilities and helpers
├── public/                    # Static web interface
│   └── index.html            # Exercise preview interface
├── docs/                      # Documentation
│   ├── API.md                        # API documentation
│   ├── n8n-educational-workflows.md # n8n integration guide
│   └── EDUCATIONAL-CONTENT-FEATURES.md # Feature overview
├── examples/                  # Usage examples and tests
├── scripts/                   # Build and utility scripts
├── railway.json              # Railway deployment config
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 📝 Template Creation

### Template Syntax

Templates use mustache-style syntax:

```
Hello {name}!
Your order total is ${total}.

Items:
{#items}
- {description}: ${amount}
{/items}
```

### Sample Templates

The `examples/` directory contains:
- Sample data for testing
- Template creation instructions
- Common template patterns

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Validate Deployment

```bash
# Check Railway deployment readiness
node scripts/validate-deployment.js
```

## 📁 Project Structure

```
DOCXX/
├── src/
│   ├── controllers/     # API controllers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── utils/          # Utility functions
│   ├── templates/      # DOCX templates
│   └── server.js       # Main server file
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── setup.js        # Test configuration
├── docs/               # Documentation
├── examples/           # Sample data and templates
├── scripts/            # Utility scripts
├── railway.json        # Railway configuration
├── Procfile           # Process configuration
└── package.json       # Dependencies and scripts
```

## 🔒 Security

- **API Key Authentication:** All endpoints protected
- **Rate Limiting:** Configurable request limits
- **Input Validation:** Joi schema validation
- **File Upload Security:** Type and size validation
- **CORS Configuration:** Configurable origins
- **Security Headers:** Helmet.js integration

## 📊 Monitoring

### Health Check

```bash
curl https://your-app.railway.app/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### Logging

- **Winston** for structured logging
- **Log levels:** error, warn, info, debug
- **Log files:** `logs/error.log`, `logs/combined.log`
- **Console output** in development

## 🚨 Troubleshooting

### Common Issues

1. **Template Not Found (404)**
   - Verify template name matches uploaded file
   - Check template was uploaded successfully

2. **Authentication Errors (401)**
   - Verify API key is correct
   - Check X-API-Key header is set

3. **Validation Errors (400)**
   - Validate JSON structure matches template
   - Ensure all required fields are provided

4. **Rate Limiting (429)**
   - Implement retry logic with backoff
   - Check rate limit headers

### Debug Mode

Set environment variables for debugging:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## 🌟 Educational Content Features

This API includes comprehensive educational content generation capabilities:

### Supported Programming Languages
- **Web Technologies**: HTML, CSS, JavaScript, TypeScript
- **Backend Languages**: Python, Java, C++, C#, PHP, Ruby, Go, Rust
- **Mobile**: Swift, Kotlin
- **Data**: SQL, JSON, XML
- **Scripting**: Bash, Perl

### Exercise Features
- **Professional formatting** matching educational standards
- **Syntax highlighting** with multiple themes
- **Fill-in-the-blank templates** for interactive learning
- **Structured validation** for exercise data
- **Multiple difficulty levels** (Easy, Medium, Hard)
- **Category management** for organizing exercises

### Web Interface
Access the live preview interface at `http://localhost:3000` to:
- Create exercises interactively
- Preview HTML output in real-time
- Download DOCX files
- Test with sample data
- Switch between programming languages

## 📚 Documentation

- [API Documentation](docs/API.md)
- [n8n Educational Workflows](docs/n8n-educational-workflows.md)
- [Educational Features Overview](docs/EDUCATIONAL-CONTENT-FEATURES.md)
- [Template Creation Guide](examples/template-instructions.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the documentation in the `docs/` directory
- Review example templates in `examples/`
- Run the deployment validation script
- Check the troubleshooting section above
