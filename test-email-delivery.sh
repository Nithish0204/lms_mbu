#!/bin/bash

# Email Testing Script for LMS Platform
# Tests all email types and checks for blocking issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
read -p "Enter your backend URL (e.g., https://your-backend.onrender.com): " BACKEND_URL
read -p "Enter your test email address: " TEST_EMAIL

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   LMS Platform Email Delivery Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Remove trailing slash from URL
BACKEND_URL=${BACKEND_URL%/}

# Counter for results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test an endpoint
test_email() {
    local test_name=$1
    local endpoint=$2
    local data=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Testing: ${test_name}${NC}"
    
    response=$(curl -s -X POST "${BACKEND_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -d "${data}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ PASSED${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "Response: $response\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 1. Check Email Configuration
echo -e "${BLUE}━━━ Step 1: Checking Email Configuration ━━━${NC}\n"
config=$(curl -s "${BACKEND_URL}/api/health/email")
echo "$config" | grep -q '"ok":true'
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Email service is configured${NC}"
    echo "$config" | python3 -m json.tool 2>/dev/null || echo "$config"
else
    echo -e "${RED}❌ Email service not configured properly${NC}"
    echo "$config"
    exit 1
fi

# Check if SendGrid is configured
if echo "$config" | grep -q '"sendgrid".*"configured":true'; then
    echo -e "${GREEN}✅ SendGrid is configured${NC}\n"
else
    echo -e "${YELLOW}⚠️  SendGrid not configured, will use SMTP${NC}\n"
fi

read -p "Press Enter to continue with email tests..."

# 2. Test OTP Email
echo -e "\n${BLUE}━━━ Step 2: Testing OTP Email ━━━${NC}\n"
test_email "OTP Email" "/api/email-test/send-otp" "{\"email\":\"${TEST_EMAIL}\",\"name\":\"Test User\"}"

# 3. Test Welcome Email
echo -e "${BLUE}━━━ Step 3: Testing Welcome Email ━━━${NC}\n"
test_email "Welcome Email" "/api/email-test/send-welcome" "{\"email\":\"${TEST_EMAIL}\",\"name\":\"Test User\",\"role\":\"Student\"}"

# 4. Test Assessment Email
echo -e "${BLUE}━━━ Step 4: Testing Assessment Email ━━━${NC}\n"
test_email "Assessment Email" "/api/email-test/send-assessment" "{\"studentEmails\":[\"${TEST_EMAIL}\"],\"courseName\":\"Test Course\",\"assessmentTitle\":\"Test Assessment\"}"

# 5. Test Assignment Email
echo -e "${BLUE}━━━ Step 5: Testing Assignment Email ━━━${NC}\n"
test_email "Assignment Email" "/api/email-test/send-assignment" "{\"studentEmails\":[\"${TEST_EMAIL}\"],\"courseName\":\"Test Course\",\"assignmentTitle\":\"Test Assignment\"}"

# 6. Test Live Class Email
echo -e "${BLUE}━━━ Step 6: Testing Live Class Email ━━━${NC}\n"
test_email "Live Class Email" "/api/email-test/send-live-class" "{\"studentEmails\":[\"${TEST_EMAIL}\"],\"courseName\":\"Test Course\",\"classTitle\":\"Test Live Class\"}"

# 7. Test Grade Email
echo -e "${BLUE}━━━ Step 7: Testing Grade Email ━━━${NC}\n"
test_email "Grade Email" "/api/email-test/send-grade" "{\"email\":\"${TEST_EMAIL}\",\"studentName\":\"Test User\",\"assignmentTitle\":\"Test Assignment\",\"score\":85}"

# 8. Check Email Status
echo -e "\n${BLUE}━━━ Step 8: Checking Email Delivery Status ━━━${NC}\n"
status=$(curl -s "${BACKEND_URL}/api/email-test/status")
echo "$status" | python3 -m json.tool 2>/dev/null || echo "$status"

# 9. Check Email Logs
echo -e "\n${BLUE}━━━ Step 9: Checking Email Logs ━━━${NC}\n"
logs=$(curl -s "${BACKEND_URL}/api/email-test/logs?limit=10")
echo "$logs" | python3 -m json.tool 2>/dev/null || echo "$logs"

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "Total Tests:  ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All email tests passed!${NC}"
    echo -e "${GREEN}Check your inbox (${TEST_EMAIL}) for test emails${NC}\n"
    success_rate=100
else
    success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "\n${YELLOW}⚠️  Some tests failed (${success_rate}% success rate)${NC}\n"
fi

# Troubleshooting hints
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Check backend logs in Render/Vercel dashboard"
    echo "2. Verify EMAIL_FROM matches SendGrid verified sender"
    echo "3. Check SendGrid Activity: https://app.sendgrid.com/email_activity"
    echo "4. Check spam folder in your email"
    echo "5. View detailed logs: curl ${BACKEND_URL}/api/email-test/logs"
    echo ""
fi

# Check your email reminder
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Check your email inbox: ${TEST_EMAIL}"
echo "2. Check spam/junk folder"
echo "3. View SendGrid Activity dashboard"
echo "4. Review backend logs for detailed error messages"
echo ""

# Offer to check logs for failures
if [ $FAILED_TESTS -gt 0 ]; then
    read -p "View detailed error logs? (y/n): " view_logs
    if [ "$view_logs" = "y" ]; then
        echo -e "\n${BLUE}Recent Failed Deliveries:${NC}\n"
        curl -s "${BACKEND_URL}/api/email-test/logs" | \
            python3 -c "import sys, json; logs = json.load(sys.stdin)['logs']; failed = [l for l in logs if not l['success']]; print(json.dumps(failed[:5], indent=2))" 2>/dev/null
    fi
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}\n"
