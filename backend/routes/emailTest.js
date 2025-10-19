const express = require("express");
const router = express.Router();
const {
  sendOtpEmail,
  sendWelcomeEmail,
  sendEnrollmentNotificationToTeacher,
  sendEnrollmentConfirmationToStudent,
  sendAssignmentNotificationToStudents,
  sendAssessmentNotificationToStudents,
  sendLiveClassNotificationToStudents,
  sendGradeNotificationEmail,
} = require("../utils/emailService");

/**
 * Test email sending for all types
 * Protected route - use with caution in production
 */

// Email delivery tracking
const emailDeliveryLog = [];

const logEmailAttempt = (type, recipient, success, error = null) => {
  const log = {
    timestamp: new Date().toISOString(),
    type,
    recipient,
    success,
    error: error ? error.message : null,
    provider: process.env.SENDGRID_API_KEY ? "sendgrid" : "smtp",
  };
  emailDeliveryLog.push(log);
  // Keep only last 100 logs
  if (emailDeliveryLog.length > 100) {
    emailDeliveryLog.shift();
  }
  return log;
};

/**
 * GET /api/email-test/status
 * Check email configuration status
 */
router.get("/status", async (req, res) => {
  const config = {
    sendgrid: {
      configured: !!process.env.SENDGRID_API_KEY,
      apiKey: process.env.SENDGRID_API_KEY
        ? `${process.env.SENDGRID_API_KEY.substring(0, 10)}...`
        : null,
      from: process.env.EMAIL_FROM,
      validationEnabled: process.env.SENDGRID_VALIDATION_ENABLE === "true",
    },
    smtp: {
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      enabled: process.env.EMAIL_SMTP_ENABLE !== "false",
    },
    frontend: process.env.FRONTEND_URL,
    recentDeliveries: emailDeliveryLog.slice(-10).reverse(),
    totalAttempts: emailDeliveryLog.length,
    successRate:
      emailDeliveryLog.length > 0
        ? (
            (emailDeliveryLog.filter((log) => log.success).length /
              emailDeliveryLog.length) *
            100
          ).toFixed(2) + "%"
        : "N/A",
  };

  res.json(config);
});

/**
 * GET /api/email-test/logs
 * Get detailed email delivery logs
 */
router.get("/logs", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const type = req.query.type; // Filter by email type

  let logs = [...emailDeliveryLog].reverse();

  if (type) {
    logs = logs.filter((log) => log.type === type);
  }

  res.json({
    total: emailDeliveryLog.length,
    filtered: logs.length,
    logs: logs.slice(0, limit),
    types: [
      "otp",
      "welcome",
      "enrollment_teacher",
      "enrollment_student",
      "assignment",
      "assessment",
      "live_class",
      "grade",
    ],
  });
});

/**
 * POST /api/email-test/send-otp
 * Test OTP email
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const testUser = {
      email,
      name: name || "Test User",
    };

    const testOtp = "123456";

    const result = await sendOtpEmail(testUser, testOtp);
    logEmailAttempt("otp", email, result.success);

    res.json({
      success: true,
      message: "OTP email sent",
      result,
      testOtp,
    });
  } catch (error) {
    logEmailAttempt("otp", req.body.email, false, error);
    res.status(500).json({
      error: "Failed to send OTP email",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-welcome
 * Test Welcome email
 */
router.post("/send-welcome", async (req, res) => {
  try {
    const { email, name, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const testUser = {
      email,
      name: name || "Test User",
      role: role || "Student",
    };

    const result = await sendWelcomeEmail(testUser);
    logEmailAttempt("welcome", email, result.success);

    res.json({
      success: true,
      message: "Welcome email sent",
      result,
    });
  } catch (error) {
    logEmailAttempt("welcome", req.body.email, false, error);
    res.status(500).json({
      error: "Failed to send welcome email",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-assignment
 * Test Assignment notification
 */
router.post("/send-assignment", async (req, res) => {
  try {
    const { studentEmails, courseName, assignmentTitle } = req.body;

    if (!studentEmails || !Array.isArray(studentEmails)) {
      return res.status(400).json({ error: "studentEmails array is required" });
    }

    const testAssignment = {
      title: assignmentTitle || "Test Assignment",
      description: "This is a test assignment notification",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    const testCourse = {
      title: courseName || "Test Course",
    };

    const testStudents = studentEmails.map((email) => ({
      email,
      name: "Student",
    }));

    const result = await sendAssignmentNotificationToStudents(
      testStudents,
      testAssignment,
      testCourse
    );

    studentEmails.forEach((email) => {
      logEmailAttempt("assignment", email, true);
    });

    res.json({
      success: true,
      message: "Assignment notifications sent",
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send assignment notifications",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-assessment
 * Test Assessment notification
 */
router.post("/send-assessment", async (req, res) => {
  try {
    const { studentEmails, courseName, assessmentTitle } = req.body;

    if (!studentEmails || !Array.isArray(studentEmails)) {
      return res.status(400).json({ error: "studentEmails array is required" });
    }

    const testAssessment = {
      title: assessmentTitle || "Test Assessment",
      description: "This is a test assessment notification",
      duration: 60,
      totalPoints: 100,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    };

    const testCourse = {
      title: courseName || "Test Course",
    };

    const testStudents = studentEmails.map((email) => ({
      email,
      name: "Student",
    }));

    const result = await sendAssessmentNotificationToStudents(
      testStudents,
      testAssessment,
      testCourse
    );

    studentEmails.forEach((email) => {
      logEmailAttempt("assessment", email, true);
    });

    res.json({
      success: true,
      message: "Assessment notifications sent",
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send assessment notifications",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-live-class
 * Test Live Class notification
 */
router.post("/send-live-class", async (req, res) => {
  try {
    const { studentEmails, courseName, classTitle } = req.body;

    if (!studentEmails || !Array.isArray(studentEmails)) {
      return res.status(400).json({ error: "studentEmails array is required" });
    }

    const testLiveClass = {
      title: classTitle || "Test Live Class",
      description: "This is a test live class notification",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      meetingLink: "https://meet.google.com/test-link",
      duration: 60,
    };

    const testCourse = {
      title: courseName || "Test Course",
    };

    const testStudents = studentEmails.map((email) => ({
      email,
      name: "Student",
    }));

    const result = await sendLiveClassNotificationToStudents(
      testStudents,
      testLiveClass,
      testCourse
    );

    studentEmails.forEach((email) => {
      logEmailAttempt("live_class", email, true);
    });

    res.json({
      success: true,
      message: "Live class notifications sent",
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send live class notifications",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-grade
 * Test Grade notification
 */
router.post("/send-grade", async (req, res) => {
  try {
    const { email, studentName, assignmentTitle, score } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const testStudent = {
      email,
      name: studentName || "Test Student",
    };

    const testAssignment = {
      title: assignmentTitle || "Test Assignment",
      totalPoints: 100,
    };

    const testSubmission = {
      score: score || 85,
      feedback: "Great work! This is a test grade notification.",
    };

    const result = await sendGradeNotificationEmail(
      testStudent,
      testAssignment,
      testSubmission
    );

    logEmailAttempt("grade", email, result.success);

    res.json({
      success: true,
      message: "Grade notification sent",
      result,
    });
  } catch (error) {
    logEmailAttempt("grade", req.body.email, false, error);
    res.status(500).json({
      error: "Failed to send grade notification",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-enrollment
 * Test Enrollment notifications (both teacher and student)
 */
router.post("/send-enrollment", async (req, res) => {
  try {
    const { studentEmail, teacherEmail, courseName } = req.body;

    if (!studentEmail || !teacherEmail) {
      return res
        .status(400)
        .json({ error: "studentEmail and teacherEmail are required" });
    }

    const testStudent = {
      email: studentEmail,
      name: "Test Student",
    };

    const testTeacher = {
      email: teacherEmail,
      name: "Test Teacher",
    };

    const testCourse = {
      title: courseName || "Test Course",
      description: "This is a test course",
    };

    // Send to teacher
    const teacherResult = await sendEnrollmentNotificationToTeacher(
      testTeacher,
      testStudent,
      testCourse
    );
    logEmailAttempt("enrollment_teacher", teacherEmail, teacherResult.success);

    // Send to student
    const studentResult = await sendEnrollmentConfirmationToStudent(
      testStudent,
      testCourse
    );
    logEmailAttempt("enrollment_student", studentEmail, studentResult.success);

    res.json({
      success: true,
      message: "Enrollment notifications sent",
      results: {
        teacher: teacherResult,
        student: studentResult,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send enrollment notifications",
      details: error.message,
    });
  }
});

/**
 * POST /api/email-test/send-all
 * Test ALL email types at once
 */
router.post("/send-all", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const results = {};

    // 1. OTP Email
    try {
      results.otp = await sendOtpEmail(
        { email, name: name || "Test User" },
        "123456"
      );
      logEmailAttempt("otp", email, results.otp.success);
    } catch (error) {
      results.otp = { success: false, error: error.message };
      logEmailAttempt("otp", email, false, error);
    }

    // 2. Welcome Email
    try {
      results.welcome = await sendWelcomeEmail({
        email,
        name: name || "Test User",
        role: "Student",
      });
      logEmailAttempt("welcome", email, results.welcome.success);
    } catch (error) {
      results.welcome = { success: false, error: error.message };
      logEmailAttempt("welcome", email, false, error);
    }

    // 3. Grade Email
    try {
      results.grade = await sendGradeNotificationEmail(
        { email, name: name || "Test User" },
        { title: "Test Assignment", totalPoints: 100 },
        { score: 85, feedback: "Great work!" }
      );
      logEmailAttempt("grade", email, results.grade.success);
    } catch (error) {
      results.grade = { success: false, error: error.message };
      logEmailAttempt("grade", email, false, error);
    }

    const summary = {
      total: Object.keys(results).length,
      successful: Object.values(results).filter((r) => r.success).length,
      failed: Object.values(results).filter((r) => !r.success).length,
    };

    res.json({
      success: true,
      message: "All email tests completed",
      summary,
      results,
      note: "Check your email inbox and spam folder",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send test emails",
      details: error.message,
    });
  }
});

module.exports = router;
