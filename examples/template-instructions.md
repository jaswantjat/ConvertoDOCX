# DOCX Template Creation Guide

This guide explains how to create DOCX templates that work with the docxtemplater library.

## Template Syntax

Templates use mustache-style syntax with curly braces `{}` to define placeholders for dynamic content.

### Basic Variables
```
Hello {name}!
Your order total is ${total}.
```

### Nested Objects
```
Company: {company.name}
Address: {company.address}, {company.city}, {company.state} {company.zip}
```

### Arrays/Lists
Use `#` for loops and `/` to close loops:
```
{#items}
- {description}: ${amount}
{/items}
```

### Conditional Content
```
{#hasDiscount}
Discount Applied: {discount}%
{/hasDiscount}
```

## Sample Templates

### 1. Invoice Template (invoice-template.docx)

**Header Section:**
```
{company.name}
{company.address}
{company.city}, {company.state} {company.zip}
Phone: {company.phone} | Email: {company.email}

INVOICE

Invoice #: {invoice.number}
Date: {invoice.date}
Due Date: {invoice.dueDate}
```

**Bill To Section:**
```
Bill To:
{client.name}
{client.company}
{client.address}
{client.city}, {client.state} {client.zip}
```

**Items Table:**
```
Description | Qty | Rate | Amount
{#items}
{description} | {quantity} | ${rate} | ${amount}
{/items}

Subtotal: ${subtotal}
Tax: ${tax}
Total: ${total}
```

### 2. Business Letter Template (business-letter.docx)

```
{sender.company}
{sender.address}
{sender.city}, {sender.state} {sender.zip}

{date}

{recipient.name}
{recipient.title}
{recipient.company}
{recipient.address}
{recipient.city}, {recipient.state} {recipient.zip}

Subject: {subject}

Dear {recipient.name},

{body}

{closing},

{sender.name}
{sender.title}
```

### 3. Monthly Report Template (monthly-report.docx)

```
{report.title}
Period: {report.period}
Prepared by: {report.preparedBy}
Date: {report.date}

EXECUTIVE SUMMARY
Total Sales: ${summary.totalSales}
Total Orders: {summary.totalOrders}
Average Order Value: ${summary.averageOrderValue}
Growth Rate: {summary.growthRate}%

PERFORMANCE METRICS
{#metrics}
{category}: ${current} (Previous: ${previous}, Change: {change}%)
{/metrics}

TOP PRODUCTS
{#topProducts}
{name}: ${sales} ({units} units)
{/topProducts}

REGIONAL BREAKDOWN
{#regions}
{name}: ${sales} ({percentage}%)
{/regions}
```

### 4. Service Contract Template (service-contract.docx)

```
SERVICE AGREEMENT

Contract Number: {contract.number}
Date: {contract.date}
Effective Date: {contract.effectiveDate}
Expiration Date: {contract.expirationDate}

CLIENT INFORMATION
{client.name}
{client.address}
{client.city}, {client.state} {client.zip}
Representative: {client.representative}, {client.title}

SERVICE PROVIDER
{provider.name}
{provider.address}
{provider.city}, {provider.state} {provider.zip}
Representative: {provider.representative}, {provider.title}

SERVICES
{#services}
Service: {name}
Description: {description}
Rate: ${rate} per {frequency}
{/services}

TERMS AND CONDITIONS
Payment Terms: {terms.paymentTerms}
Cancellation Notice: {terms.cancellationNotice}
Renewal Terms: {terms.renewalTerms}
```

## Creating Templates in Microsoft Word

1. **Open Microsoft Word** and create a new document
2. **Design your layout** with proper formatting, fonts, and styles
3. **Insert placeholders** using the syntax above where you want dynamic content
4. **Test your template** by replacing placeholders with sample data
5. **Save as DOCX** format
6. **Upload to the API** using the `/api/templates` endpoint

## Best Practices

1. **Use descriptive placeholder names** that match your data structure
2. **Test with sample data** before deploying
3. **Keep templates simple** to avoid rendering issues
4. **Use consistent formatting** throughout the document
5. **Include fallback text** for optional fields when possible
6. **Validate your JSON data** structure matches template placeholders

## Common Issues

- **Missing placeholders**: Ensure all `{placeholders}` have corresponding data
- **Nested object access**: Use dot notation like `{company.name}`
- **Array rendering**: Don't forget closing tags like `{/items}`
- **Special characters**: Escape special characters in template text
- **File format**: Always save as .docx, not .doc or other formats

## Testing Your Templates

Use the provided sample data files to test your templates:
- `examples/sample-data.json` contains test data for all template types
- Send POST requests to `/api/generate-docx` with your template and data
- Check the generated DOCX file for proper formatting and content
