#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Validating Railway Deployment Configuration...\n')

const errors = []
const warnings = []

// Check required files
const requiredFiles = [
  'package.json',
  'railway.json',
  'Procfile',
  'src/server.js',
  '.env.example'
]

console.log('📁 Checking required files...')
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    errors.push(`Missing required file: ${file}`)
    console.log(`❌ ${file}`)
  }
})

// Validate package.json
console.log('\n📦 Validating package.json...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  
  if (packageJson.scripts && packageJson.scripts.start) {
    console.log('✅ Start script defined')
  } else {
    errors.push('Missing start script in package.json')
    console.log('❌ Start script missing')
  }
  
  if (packageJson.engines && packageJson.engines.node) {
    console.log(`✅ Node.js version specified: ${packageJson.engines.node}`)
  } else {
    warnings.push('Node.js version not specified in engines')
    console.log('⚠️  Node.js version not specified')
  }
  
  // Check critical dependencies
  const criticalDeps = ['express', 'docxtemplater', 'pizzip', 'cors', 'helmet']
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} dependency found`)
    } else {
      errors.push(`Missing critical dependency: ${dep}`)
      console.log(`❌ ${dep} dependency missing`)
    }
  })
  
} catch (error) {
  errors.push('Invalid package.json format')
  console.log('❌ Invalid package.json format')
}

// Validate railway.json
console.log('\n🚂 Validating railway.json...')
try {
  const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'))
  
  if (railwayConfig.deploy && railwayConfig.deploy.startCommand) {
    console.log(`✅ Start command: ${railwayConfig.deploy.startCommand}`)
  } else {
    errors.push('Missing start command in railway.json')
    console.log('❌ Start command missing')
  }
  
  if (railwayConfig.deploy && railwayConfig.deploy.healthcheckPath) {
    console.log(`✅ Health check path: ${railwayConfig.deploy.healthcheckPath}`)
  } else {
    warnings.push('Health check path not configured')
    console.log('⚠️  Health check path not configured')
  }
  
} catch (error) {
  errors.push('Invalid railway.json format')
  console.log('❌ Invalid railway.json format')
}

// Check environment variables
console.log('\n🔐 Checking environment configuration...')
if (fs.existsSync('.env.example')) {
  const envExample = fs.readFileSync('.env.example', 'utf8')
  const requiredEnvVars = ['PORT', 'API_KEY', 'NODE_ENV']
  
  requiredEnvVars.forEach(envVar => {
    if (envExample.includes(envVar)) {
      console.log(`✅ ${envVar} documented in .env.example`)
    } else {
      warnings.push(`Environment variable ${envVar} not documented`)
      console.log(`⚠️  ${envVar} not documented`)
    }
  })
} else {
  warnings.push('.env.example file missing')
  console.log('⚠️  .env.example file missing')
}

// Validate server configuration
console.log('\n🖥️  Validating server configuration...')
try {
  const serverContent = fs.readFileSync('src/server.js', 'utf8')
  
  if (serverContent.includes('0.0.0.0')) {
    console.log('✅ Server binds to 0.0.0.0 (Railway compatible)')
  } else {
    errors.push('Server should bind to 0.0.0.0 for Railway deployment')
    console.log('❌ Server binding configuration issue')
  }
  
  if (serverContent.includes('process.env.PORT')) {
    console.log('✅ Uses PORT environment variable')
  } else {
    errors.push('Server should use PORT environment variable')
    console.log('❌ PORT environment variable not used')
  }
  
  if (serverContent.includes('/health')) {
    console.log('✅ Health check endpoint defined')
  } else {
    warnings.push('Health check endpoint not found')
    console.log('⚠️  Health check endpoint not found')
  }
  
} catch (error) {
  errors.push('Cannot read server.js file')
  console.log('❌ Cannot read server.js file')
}

// Check directory structure
console.log('\n📂 Validating directory structure...')
const requiredDirs = ['src', 'docs', 'examples']
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/ directory exists`)
  } else {
    warnings.push(`Directory ${dir}/ missing`)
    console.log(`⚠️  ${dir}/ directory missing`)
  }
})

// Test npm install (if node_modules doesn't exist)
console.log('\n📥 Checking dependencies...')
if (!fs.existsSync('node_modules')) {
  console.log('⚠️  node_modules not found, testing npm install...')
  try {
    execSync('npm install --dry-run', { stdio: 'pipe' })
    console.log('✅ Dependencies can be installed')
  } catch (error) {
    errors.push('npm install failed - check package.json dependencies')
    console.log('❌ npm install failed')
  }
} else {
  console.log('✅ node_modules directory exists')
}

// Summary
console.log('\n📊 Validation Summary')
console.log('='.repeat(50))

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All checks passed! Ready for Railway deployment.')
} else {
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s) found:`)
    errors.forEach(error => console.log(`   • ${error}`))
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):`)
    warnings.forEach(warning => console.log(`   • ${warning}`))
  }
  
  if (errors.length > 0) {
    console.log('\n🚨 Please fix the errors before deploying to Railway.')
    process.exit(1)
  } else {
    console.log('\n✅ No critical errors found. Warnings should be addressed but won\'t prevent deployment.')
  }
}

console.log('\n🔗 Next steps:')
console.log('1. Set environment variables in Railway dashboard')
console.log('2. Upload DOCX templates using the API')
console.log('3. Test the API endpoints')
console.log('4. Configure n8n workflows')

console.log('\n📚 Documentation:')
console.log('• API Documentation: docs/API.md')
console.log('• n8n Integration: docs/n8n-integration.md')
console.log('• Template Guide: examples/template-instructions.md')
