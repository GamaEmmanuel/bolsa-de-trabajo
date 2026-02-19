#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * Run this before deployment to ensure all required environment variables are set.
 *
 * Usage:
 *   node scripts/validate-env.js
 */

const requiredVars = {
  // Firebase Client (Public)
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'Firebase API Key',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'Firebase Auth Domain',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'Firebase Project ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'Firebase Storage Bucket',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': 'Firebase Messaging Sender ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID': 'Firebase App ID',

  // Stripe (Secret)
  'STRIPE_SECRET_KEY': 'Stripe Secret Key',
  'STRIPE_WEBHOOK_SECRET': 'Stripe Webhook Secret',

  // Application
  'NEXT_PUBLIC_APP_URL': 'Application URL',
};

const optionalVars = {
  // EmailJS (can use Gmail API instead)
  'EMAILJS_SERVICE_ID': 'EmailJS Service ID',
  'EMAILJS_TEMPLATE_ID': 'EmailJS Template ID',
  'EMAILJS_PUBLIC_KEY': 'EmailJS Public Key',
  'EMAILJS_PRIVATE_KEY': 'EmailJS Private Key',

  // Gmail API (alternative to EmailJS)
  'GMAIL_CLIENT_ID': 'Gmail Client ID',
  'GMAIL_CLIENT_SECRET': 'Gmail Client Secret',
  'GMAIL_REFRESH_TOKEN': 'Gmail Refresh Token',
  'GMAIL_USER_EMAIL': 'Gmail User Email',

  // Firebase Admin
  'FIREBASE_SERVICE_ACCOUNT': 'Firebase Service Account JSON',

  // Cron & Sync
  'CRON_SECRET': 'Cron Job Secret',
  'SYNC_SECRET': 'Subscription Sync Secret',

  // Google Maps
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': 'Google Maps API Key',
};

console.log('🔍 Validating Environment Variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 Required Variables:');
for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key];
  if (!value) {
    console.log(`  ❌ ${key} - MISSING (${description})`);
    hasErrors = true;
  } else if (value.includes('your-') || value.includes('YOUR_')) {
    console.log(`  ⚠️  ${key} - PLACEHOLDER VALUE (${description})`);
    hasErrors = true;
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`  ✅ ${key} - Set (${preview})`);
  }
}

console.log('\n📋 Optional Variables (at least one email system required):');

// Check if at least one email system is configured
const hasEmailJS = process.env.EMAILJS_SERVICE_ID &&
                   process.env.EMAILJS_TEMPLATE_ID &&
                   process.env.EMAILJS_PUBLIC_KEY &&
                   process.env.EMAILJS_PRIVATE_KEY;

const hasGmail = process.env.GMAIL_CLIENT_ID &&
                 process.env.GMAIL_CLIENT_SECRET &&
                 process.env.GMAIL_REFRESH_TOKEN &&
                 process.env.GMAIL_USER_EMAIL;

if (!hasEmailJS && !hasGmail) {
  console.log('  ❌ No email system configured! Need either EmailJS or Gmail API');
  hasErrors = true;
} else {
  if (hasEmailJS) {
    console.log('  ✅ EmailJS configured');
  }
  if (hasGmail) {
    console.log('  ✅ Gmail API configured');
  }
}

// Check other optional variables
for (const [key, description] of Object.entries(optionalVars)) {
  const value = process.env[key];
  if (value && !value.includes('your-') && !value.includes('YOUR_')) {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`  ✅ ${key} - Set (${preview})`);
  }
}

// Check for common mistakes
console.log('\n🔍 Security Checks:');

// Check for hardcoded secrets in code
const fs = require('fs');
const path = require('path');

function checkFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const secrets = [];

    // Check for common secret patterns
    if (content.match(/['"]sk_test_[a-zA-Z0-9]+['"]/)) {
      secrets.push('Stripe test key');
    }
    if (content.match(/['"]sk_live_[a-zA-Z0-9]+['"]/)) {
      secrets.push('Stripe live key');
    }
    if (content.match(/['"]AIza[a-zA-Z0-9_-]{35}['"]/)) {
      secrets.push('Google API key');
    }
    if (content.match(/const\s+\w+_KEY\s*=\s*['"][^'"]+['"]/i) &&
        !content.includes('process.env')) {
      secrets.push('Hardcoded API key');
    }

    return secrets;
  } catch (error) {
    return [];
  }
}

function scanDirectory(dir, filePattern = /\.(ts|tsx|js|jsx)$/) {
  const files = [];

  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!item.startsWith('.') &&
              item !== 'node_modules' &&
              item !== 'out' &&
              item !== 'build') {
            scan(fullPath);
          }
        } else if (filePattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scan(dir);
  return files;
}

const srcDir = path.join(process.cwd(), 'src');
const files = scanDirectory(srcDir);

let foundSecrets = false;
for (const file of files) {
  const secrets = checkFileForSecrets(file);
  if (secrets.length > 0) {
    if (!foundSecrets) {
      console.log('  ⚠️  Potential hardcoded secrets found:');
      foundSecrets = true;
      hasWarnings = true;
    }
    console.log(`    - ${path.relative(process.cwd(), file)}: ${secrets.join(', ')}`);
  }
}

if (!foundSecrets) {
  console.log('  ✅ No hardcoded secrets detected');
}

// Check .env files are in .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignore.includes('.env')) {
    console.log('  ✅ .env files are in .gitignore');
  } else {
    console.log('  ⚠️  .env files may not be properly ignored by git');
    hasWarnings = true;
  }
}

// Final summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ VALIDATION FAILED - Fix the errors above before deploying');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings above');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED - Ready for deployment');
  process.exit(0);
}

