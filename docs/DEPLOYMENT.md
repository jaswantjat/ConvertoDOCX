# Deployment Guide

This guide walks you through deploying the DOCX Generator API to Railway and integrating it with n8n workflows.

## 🚀 Railway Deployment

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code
- Basic understanding of environment variables

### Step 1: Connect Repository

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build**
   Railway will automatically detect the Node.js project and use the `railway.json` configuration.

### Step 2: Set Environment Variables

In the Railway dashboard, go to your project settings and add these environment variables:

```bash
# Required Variables
API_KEY=your-secure-api-key-here-make-it-long-and-random
NODE_ENV=production

# Optional Variables (with defaults)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=*
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
MAX_TEMPLATE_SIZE=5242880
```

**Important:** Generate a strong API key:
```bash
# Generate a secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Deploy

1. **Automatic Deployment**
   Railway will automatically deploy when you push to your main branch.

2. **Monitor Deployment**
   - Check the deployment logs in Railway dashboard
   - Wait for the build to complete
   - Note your app URL (e.g., `https://your-app.railway.app`)

3. **Verify Deployment**
   ```bash
   # Test health endpoint
   curl https://your-app.railway.app/health
   
   # Should return:
   # {"status":"healthy","timestamp":"...","uptime":...}
   ```

### Step 4: Upload Templates

Once deployed, upload your DOCX templates:

```bash
# Upload a template
curl -X POST https://your-app.railway.app/api/templates \
  -H "X-API-Key: your-api-key" \
  -F "template=@/path/to/your-template.docx"
```

## 📝 Creating DOCX Templates

### Using Microsoft Word

1. **Create Document**
   - Open Microsoft Word
   - Design your document layout
   - Add formatting, headers, footers, etc.

2. **Add Placeholders**
   Replace dynamic content with mustache syntax:
   ```
   Hello {name}!
   
   Company: {company.name}
   Address: {company.address}
   
   Items:
   {#items}
   - {description}: ${amount}
   {/items}
   
   Total: ${total}
   ```

3. **Save as DOCX**
   - Save the file as `.docx` format
   - Upload using the API or web interface

### Template Syntax Reference

| Syntax | Purpose | Example |
|--------|---------|---------|
| `{variable}` | Simple variable | `{name}` |
| `{object.property}` | Nested object | `{company.name}` |
| `{#array}...{/array}` | Loop through array | `{#items}{description}{/items}` |
| `{#condition}...{/condition}` | Conditional content | `{#hasDiscount}Discount: {discount}{/hasDiscount}` |

## 🔧 n8n Integration

### Basic Setup

1. **Add HTTP Request Node**
   - Method: `POST`
   - URL: `https://your-app.railway.app/api/generate-docx`

2. **Configure Headers**
   ```json
   {
     "Content-Type": "application/json",
     "X-API-Key": "your-api-key"
   }
   ```

3. **Set Request Body**
   ```json
   {
     "template": "invoice-template.docx",
     "data": {
       "name": "{{ $json.customerName }}",
       "company": {
         "name": "{{ $json.companyName }}",
         "address": "{{ $json.companyAddress }}"
       },
       "items": "{{ $json.orderItems }}",
       "total": "{{ $json.orderTotal }}"
     }
   }
   ```

4. **Configure Response**
   - Response Format: `File`
   - Output File Name: `invoice-{{ $json.invoiceNumber }}.docx`

### Example Workflows

#### Invoice Generation
```
Webhook → Process Data → Generate DOCX → Email/Save
```

#### Report Generation
```
Schedule → Database Query → Transform Data → Generate DOCX → Upload to Drive
```

#### Contract Creation
```
Form Submission → Validate Data → Generate DOCX → Send for Approval
```

## 🔒 Security Best Practices

### API Key Management

1. **Generate Strong Keys**
   ```bash
   # Use cryptographically secure random keys
   openssl rand -hex 32
   ```

2. **Rotate Keys Regularly**
   - Update API keys monthly
   - Use Railway's environment variable management
   - Update n8n workflows with new keys

3. **Restrict Access**
   - Use CORS to limit origins
   - Monitor API usage logs
   - Implement rate limiting

### Network Security

1. **HTTPS Only**
   - Railway provides HTTPS by default
   - Never use HTTP in production

2. **CORS Configuration**
   ```bash
   # Restrict to specific domains
   ALLOWED_ORIGINS=https://your-n8n-instance.com,https://your-app.com
   ```

## 📊 Monitoring & Maintenance

### Health Monitoring

1. **Health Check Endpoint**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Railway Metrics**
   - Monitor CPU and memory usage
   - Check response times
   - Review error logs

3. **Uptime Monitoring**
   Set up external monitoring (e.g., UptimeRobot, Pingdom)

### Log Management

1. **Application Logs**
   - View logs in Railway dashboard
   - Monitor error patterns
   - Track API usage

2. **Log Levels**
   ```bash
   # Development
   LOG_LEVEL=debug
   
   # Production
   LOG_LEVEL=info
   ```

### Backup & Recovery

1. **Template Backup**
   - Regularly backup template files
   - Version control templates
   - Document template changes

2. **Configuration Backup**
   - Export environment variables
   - Document deployment settings
   - Keep deployment scripts updated

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Fails**
   ```bash
   # Check build logs in Railway
   # Verify package.json scripts
   # Ensure all dependencies are listed
   ```

2. **API Returns 500 Errors**
   ```bash
   # Check environment variables
   # Verify API_KEY is set
   # Review application logs
   ```

3. **Template Not Found**
   ```bash
   # List available templates
   curl -H "X-API-Key: your-key" https://your-app.railway.app/api/templates
   
   # Upload missing template
   curl -X POST -H "X-API-Key: your-key" -F "template=@template.docx" \
     https://your-app.railway.app/api/templates
   ```

4. **n8n Integration Issues**
   - Verify API key in headers
   - Check response format is set to "File"
   - Validate JSON structure matches template

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

### Support Resources

- [Railway Documentation](https://docs.railway.app)
- [n8n Documentation](https://docs.n8n.io)
- [docxtemplater Documentation](https://docxtemplater.readthedocs.io)

## 📈 Scaling Considerations

### Performance Optimization

1. **Template Caching**
   - Cache frequently used templates
   - Optimize template file sizes
   - Use CDN for template distribution

2. **Resource Limits**
   - Monitor memory usage
   - Set appropriate file size limits
   - Implement request queuing

3. **Database Integration**
   - Consider adding database for template metadata
   - Implement user management
   - Add usage analytics

### High Availability

1. **Multiple Instances**
   - Deploy to multiple regions
   - Use load balancing
   - Implement health checks

2. **Error Handling**
   - Graceful degradation
   - Retry mechanisms
   - Circuit breakers

This completes the deployment guide. Your DOCX Generator API is now ready for production use with Railway and n8n integration!
