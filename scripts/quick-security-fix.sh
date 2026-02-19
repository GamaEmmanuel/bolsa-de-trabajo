#!/bin/bash

# Quick Security Fix Script
# Run this to apply immediate security fixes

echo "🔒 HR Portal - Quick Security Fixes"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

echo "📦 Step 1: Updating dependencies..."
echo "-----------------------------------"
npm update
echo ""

echo "🔍 Step 2: Running security audit..."
echo "------------------------------------"
npm audit fix
echo ""

echo "📋 Step 3: Checking for outdated packages..."
echo "--------------------------------------------"
npm outdated
echo ""

echo "🔐 Step 4: Validating environment variables..."
echo "----------------------------------------------"
node scripts/validate-env.js
ENV_CHECK=$?
echo ""

if [ $ENV_CHECK -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Environment validation failed or has warnings${NC}"
    echo "Please review the output above and fix any issues"
    echo ""
fi

echo "📝 Step 5: Checking for console.log statements..."
echo "-------------------------------------------------"
CONSOLE_LOGS=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -n "console.log" | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS console.log statements${NC}"
    echo "Consider removing or replacing with proper logging"
else
    echo -e "${GREEN}✅ No console.log statements found${NC}"
fi
echo ""

echo "🔍 Step 6: Checking for hardcoded secrets..."
echo "--------------------------------------------"
if grep -r "sk_test_\|sk_live_\|AIza" src/ 2>/dev/null; then
    echo -e "${RED}❌ Found potential hardcoded secrets!${NC}"
    echo "Please move these to environment variables"
else
    echo -e "${GREEN}✅ No obvious hardcoded secrets found${NC}"
fi
echo ""

echo "📋 Step 7: Checking TypeScript configuration..."
echo "-----------------------------------------------"
if grep -q "ignoreBuildErrors.*true" next.config.ts; then
    echo -e "${YELLOW}⚠️  TypeScript build errors are being ignored${NC}"
    echo "Consider fixing TypeScript errors and setting ignoreBuildErrors to false"
else
    echo -e "${GREEN}✅ TypeScript errors are not being ignored${NC}"
fi
echo ""

echo "🔍 Step 8: Checking .gitignore..."
echo "---------------------------------"
if grep -q ".env" .gitignore && grep -q "firebase-adminsdk" .gitignore; then
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
else
    echo -e "${RED}❌ .gitignore may be missing important entries${NC}"
fi
echo ""

echo "===================================="
echo "🎯 Summary of Actions Needed:"
echo "===================================="
echo ""
echo "1. ⚠️  CRITICAL: Rotate EmailJS keys if they were exposed"
echo "   - Log into https://dashboard.emailjs.com/"
echo "   - Generate new keys"
echo "   - Update .env.local"
echo ""
echo "2. 🔐 Update environment variables:"
echo "   - Copy .env.example to .env.local"
echo "   - Fill in all required values"
echo "   - Add to production environment"
echo ""
echo "3. 🚀 Deploy changes:"
echo "   - Test locally first: npm run dev"
echo "   - Deploy to production"
echo "   - Verify email sending works"
echo ""
echo "4. 📊 Set up monitoring:"
echo "   - Add Sentry or similar error tracking"
echo "   - Set up alerts for critical errors"
echo ""
echo "5. ✅ Review PRE_LAUNCH_CHECKLIST.md for complete list"
echo ""

if [ $ENV_CHECK -eq 0 ]; then
    echo -e "${GREEN}✅ Basic security checks passed!${NC}"
    echo "Review the checklist and deploy when ready."
else
    echo -e "${RED}❌ Some checks failed. Please fix before deploying.${NC}"
fi

echo ""
echo "For detailed instructions, see:"
echo "  - PRE_LAUNCH_CHECKLIST.md"
echo "  - SECURITY_FIXES_REQUIRED.md"
echo ""

