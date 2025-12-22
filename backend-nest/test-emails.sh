#!/bin/bash

# Test Email Functionality
# Make sure the NestJS server is running on port 3001

API_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Email Functionality${NC}"
echo "================================"
echo ""

# Check if server is running
if ! curl -s "$API_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running on port 3001${NC}"
    echo "Please start the server with: npm run start:dev"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test 1: OTP Request
echo -e "${YELLOW}Test 1: Request OTP${NC}"
echo "-------------------"
read -p "Enter email address: " EMAIL

RESPONSE=$(curl -s -X POST "$API_URL/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "Response: $RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "one-time code"; then
    echo -e "${GREEN}✅ OTP request successful${NC}"
    echo -e "${YELLOW}📧 Check NestJS console for OTP code${NC}"
    echo -e "${YELLOW}   Look for: 'OTP for $EMAIL: XXXXXX'${NC}"
else
    echo -e "${RED}❌ OTP request failed${NC}"
fi

echo ""
echo ""

# Test 2: Forgot Password
echo -e "${YELLOW}Test 2: Forgot Password${NC}"
echo "-------------------"
read -p "Enter email address: " EMAIL2

RESPONSE2=$(curl -s -X POST "$API_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\"}")

echo "Response: $RESPONSE2"
echo ""

if echo "$RESPONSE2" | grep -q "password reset link"; then
    echo -e "${GREEN}✅ Password reset request successful${NC}"
    echo -e "${YELLOW}📧 Check NestJS console for reset link${NC}"
    echo -e "${YELLOW}   Look for: 'Password reset link for $EMAIL2: http://...'${NC}"
else
    echo -e "${RED}❌ Password reset request failed${NC}"
fi

echo ""
echo ""
echo -e "${YELLOW}Note:${NC} With MAIL_MAILER=log, emails are logged to console, not actually sent."
echo "Check the NestJS server console output for email details."

