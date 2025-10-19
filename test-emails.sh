#!/bin/bash
# Email Testing Checklist for LMS Platform
# Run this after deploying to verify all emails work

echo "======================================"
echo "LMS Email System Test Checklist"
echo "======================================"
echo ""

echo "Prerequisites:"
echo "✓ SENDGRID_API_KEY set in environment"
echo "✓ EMAIL_FROM matches verified SendGrid sender"
echo "✓ FRONTEND_URL set correctly"
echo ""

read -p "Press Enter to continue..."

echo ""
echo "Test 1: OTP Email"
echo "─────────────────"
echo "1. Register a new user"
echo "2. Check email for OTP code"
echo "Expected: Email with 6-digit OTP"
read -p "Did you receive OTP email? (y/n): " otp
echo ""

echo "Test 2: Welcome Email"
echo "─────────────────────"
echo "1. Verify OTP from previous test"
echo "2. Check email for welcome message"
echo "Expected: Welcome email with login button"
read -p "Did you receive welcome email? (y/n): " welcome
echo ""

echo "Test 3: Enrollment Emails"
echo "────────────────────────"
echo "1. Enroll student in a course"
echo "2. Check teacher's email for enrollment notification"
echo "3. Check student's email for confirmation"
echo "Expected: 2 emails (teacher notification + student confirmation)"
read -p "Did both receive emails? (y/n): " enroll
echo ""

echo "Test 4: Assignment Email"
echo "───────────────────────"
echo "1. Create new assignment as teacher"
echo "2. Check enrolled students' emails"
echo "Expected: Email with assignment details and due date"
read -p "Did students receive assignment email? (y/n): " assignment
echo ""

echo "Test 5: Assessment Email (NEWLY FIXED)"
echo "─────────────────────────────────────"
echo "1. Create new assessment as teacher"
echo "2. Check enrolled students' emails"
echo "Expected: Email with assessment details, duration, points"
read -p "Did students receive assessment email? (y/n): " assessment
echo ""

echo "Test 6: Live Class Email"
echo "───────────────────────"
echo "1. Schedule a live class"
echo "2. Check enrolled students' emails"
echo "Expected: Email with scheduled time and join link"
read -p "Did students receive live class email? (y/n): " liveclass
echo ""

echo "Test 7: Grade Notification"
echo "─────────────────────────"
echo "1. Grade a student's submission"
echo "2. Check student's email"
echo "Expected: Email with score, feedback, percentage"
read -p "Did student receive grade email? (y/n): " grade
echo ""

echo ""
echo "======================================"
echo "Test Results Summary"
echo "======================================"
echo "1. OTP Email:          $otp"
echo "2. Welcome Email:      $welcome"
echo "3. Enrollment Emails:  $enroll"
echo "4. Assignment Email:   $assignment"
echo "5. Assessment Email:   $assessment"
echo "6. Live Class Email:   $liveclass"
echo "7. Grade Email:        $grade"
echo ""

# Count successes
success=0
[[ "$otp" == "y" ]] && ((success++))
[[ "$welcome" == "y" ]] && ((success++))
[[ "$enroll" == "y" ]] && ((success++))
[[ "$assignment" == "y" ]] && ((success++))
[[ "$assessment" == "y" ]] && ((success++))
[[ "$liveclass" == "y" ]] && ((success++))
[[ "$grade" == "y" ]] && ((success++))

echo "Passed: $success/7"
echo ""

if [ $success -eq 7 ]; then
    echo "✅ All email tests passed!"
else
    echo "⚠️  Some emails failed. Check:"
    echo "   1. SendGrid Activity dashboard"
    echo "   2. Backend logs (Render/Vercel)"
    echo "   3. EMAIL_FROM matches verified sender"
    echo "   4. Check spam folder"
fi

echo ""
echo "Diagnostics:"
echo "  GET /api/health/email"
echo "  GET /api/health/email/deliveries"
echo ""
