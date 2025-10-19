/**
 * Send OTP email for verification
 */
exports.sendOtpEmail = async (user, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
    to: user.email,
    subject: "🔐 Verify Your Email - LMS Platform OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Verify Your Email</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Hello ${user.name}! 👋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering on LMS Platform.<br>
            Please verify your email address by entering the following OTP:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; text-align: center;">
            <span style="font-size: 2.5em; letter-spacing: 8px; color: #667eea; font-weight: bold;">${otp}</span>
          </div>
          <p style="color: #4b5563; font-size: 16px;">
            This OTP is valid for 10 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };
  return await sendEmail(mailOptions);
};
const nodemailer = require("nodemailer");
let sgMail;
try {
  sgMail = require("@sendgrid/mail");
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("📨 SendGrid initialized");
  }
} catch (e) {
  // SendGrid not installed or not configured
}

/**
 * Email Service for LMS Platform
 */

/**
 * Create email transporter
 */
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️  Email not configured - emails will be logged only");
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Debug connection
  transporter.verify(function (error, success) {
    if (error) {
      console.error("❌ SMTP connection failed:", error);
    } else {
      console.log("✅ SMTP server is ready to take our messages");
    }
  });

  return transporter;
};

/**
 * Send email with error handling and detailed logging
 */
const sendEmail = async (mailOptions) => {
  const startTime = Date.now();
  console.log(`\n📧 Attempting to send email:`);
  console.log(`   To: ${mailOptions.to}`);
  console.log(`   Subject: ${mailOptions.subject}`);
  console.log(
    `   Provider: ${
      sgMail && process.env.SENDGRID_API_KEY ? "SendGrid" : "SMTP"
    }`
  );

  // Prefer SendGrid if configured
  if (sgMail && process.env.SENDGRID_API_KEY) {
    try {
      const msg = {
        to: mailOptions.to,
        from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
      };

      console.log(`   From: ${msg.from}`);
      const [response] = await sgMail.send(msg);
      const duration = Date.now() - startTime;

      console.log(`✅ SendGrid SUCCESS (${duration}ms):`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   To: ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}\n`);

      return {
        success: true,
        provider: "sendgrid",
        status: response.statusCode,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ SendGrid FAILED (${duration}ms):`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error Message: ${error.message}`);

      if (error.response?.body) {
        console.error(
          `   Response Body:`,
          JSON.stringify(error.response.body, null, 2)
        );

        // Check for specific blocking reasons
        const errorBody = error.response.body;
        if (errorBody.errors) {
          errorBody.errors.forEach((err, index) => {
            console.error(`   Error ${index + 1}:`);
            console.error(`     Message: ${err.message}`);
            console.error(`     Field: ${err.field}`);
            console.error(`     Help: ${err.help}`);
          });
        }
      }

      // Check if email was blocked
      if (
        error.code === 403 ||
        error.message?.includes("forbidden") ||
        error.message?.includes("blocked")
      ) {
        console.error(
          `   ⚠️  EMAIL BLOCKED: Sender not verified or domain restrictions`
        );
      }
      if (error.message?.includes("does not contain a valid address")) {
        console.error(
          `   ⚠️  INVALID EMAIL: Recipient email format is invalid`
        );
      }
      if (error.message?.includes("Unauthorized")) {
        console.error(`   ⚠️  AUTHENTICATION FAILED: Check SENDGRID_API_KEY`);
      }

      console.error(`   Falling back to SMTP...\n`);
      // fall through to SMTP below
    }
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.log("📧 [DEMO MODE] Email would be sent:");
    console.log("   To:", mailOptions.to);
    console.log("   Subject:", mailOptions.subject);
    console.log("   Note: Configure SMTP or SendGrid to send real emails\n");
    return { success: true, demo: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;

    console.log(`✅ SMTP SUCCESS (${duration}ms):`);
    console.log(`   MessageId: ${info.messageId}`);
    console.log(`   To: ${mailOptions.to}`);
    console.log(`   Subject: ${mailOptions.subject}\n`);

    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`\n❌ SMTP FAILED (${duration}ms):`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   To: ${mailOptions.to}`);

    // Check for specific SMTP errors
    if (error.code === "EAUTH") {
      console.error(`   ⚠️  AUTHENTICATION FAILED: Check SMTP credentials`);
    }
    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error(`   ⚠️  CONNECTION FAILED: Check SMTP host and port`);
    }
    if (error.responseCode === 550) {
      console.error(
        `   ⚠️  EMAIL REJECTED: Recipient may not exist or blocked`
      );
    }
    console.error(`\n`);

    return {
      success: false,
      provider: "smtp",
      error: error.message,
      code: error.code,
      duration,
    };
  }
};

/**
 * Send welcome email to new user
 */
exports.sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
    to: user.email,
    subject: "🎉 Welcome to LMS Platform!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Welcome to LMS Platform! 🎓</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Hello ${user.name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for joining our Learning Management System. We're excited to have you on board!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 5px 0; color: #1f2937;"><strong>📧 Email:</strong> ${
              user.email
            }</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>👤 Role:</strong> ${
              user.role
            }</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>✅ Status:</strong> Active</p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px;">
            ${
              user.role === "Teacher"
                ? "You can now start creating courses and managing your students."
                : "You can now browse available courses and start learning!"
            }
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/login" 
               style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Login to Your Account
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send enrollment notification to teacher
 */
exports.sendEnrollmentNotificationToTeacher = async (
  student,
  course,
  teacher
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
    to: teacher.email,
    subject: `🎓 New Student Enrolled: ${student.name} → ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">New Student Enrollment! 🎉</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Hi ${teacher.name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Great news! A new student has enrolled in your course.
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #059669;">Course Details</h3>
            <p style="margin: 5px 0; color: #1f2937; font-size: 18px;"><strong>📚 ${
              course.title
            }</strong></p>
            <p style="margin: 5px 0; color: #6b7280;">${
              course.description || "No description"
            }</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; color: #059669;">Student Information</h3>
            <p style="margin: 5px 0; color: #1f2937;"><strong>👤 Name:</strong> ${
              student.name
            }</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>📧 Email:</strong> ${
              student.email
            }</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>📅 Enrolled:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/teacher-dashboard" 
               style="display: inline-block; padding: 15px 40px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View Your Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            💡 <strong>Tip:</strong> You can manage all your students from the course dashboard.
          </p>
        </div>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send enrollment confirmation to student
 */
exports.sendEnrollmentConfirmationToStudent = async (
  student,
  course,
  teacher
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
    to: student.email,
    subject: `✅ Enrolled Successfully: ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Enrollment Confirmed! 🎓</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Hi ${student.name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Congratulations! You have successfully enrolled in:
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #3b82f6;">
            <h3 style="margin: 0 0 15px 0; color: #2563eb; font-size: 24px;">${
              course.title
            }</h3>
            <p style="margin: 10px 0; color: #6b7280; line-height: 1.6;">${
              course.description || "No description available"
            }</p>
            
            ${
              course.duration
                ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #1f2937;">⏱️ <strong>Duration:</strong> ${course.duration}</p>
              </div>
            `
                : ""
            }
          </div>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">Instructor Information</h3>
            <p style="margin: 5px 0; color: #1f2937;"><strong>👨‍🏫 Instructor:</strong> ${
              teacher.name
            }</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>📧 Email:</strong> ${
              teacher.email
            }</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/my-courses" 
               style="display: inline-block; padding: 15px 40px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Start Learning
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            📚 You'll receive notifications when your instructor posts new assignments or schedules live classes.
          </p>
        </div>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send assignment notification to students
 */
exports.sendAssignmentNotificationToStudents = async (
  students,
  assignment,
  course,
  teacher
) => {
  const emailPromises = students.map((student) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
      to: student.email,
      subject: `📝 New Assignment: ${assignment.title} | ${course.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">New Assignment Posted! 📝</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">Hi ${student.name}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your instructor has posted a new assignment in <strong>${
                course.title
              }</strong>.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #f59e0b;">
              <h3 style="margin: 0 0 15px 0; color: #d97706; font-size: 20px;">${
                assignment.title
              }</h3>
              <p style="margin: 10px 0; color: #6b7280; line-height: 1.6;">${
                assignment.description || "No description provided"
              }</p>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #1f2937;">📅 <strong>Due Date:</strong> ${new Date(
                  assignment.dueDate
                ).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #1f2937;">👨‍🏫 <strong>Instructor:</strong> ${
                  teacher.name
                }</p>
              </div>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ <strong>Important:</strong> Make sure to submit your work before the deadline!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/assignments" 
                 style="display: inline-block; padding: 15px 40px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View Assignment
              </a>
            </div>
          </div>
        </div>
      `,
    };

    return sendEmail(mailOptions);
  });

  const results = await Promise.allSettled(emailPromises);

  const successCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  console.log(
    `✅ Assignment notifications sent: ${successCount}/${students.length}`
  );

  return { success: true, sent: successCount, total: students.length };
};

/**
 * Send assessment notification to students
 */
exports.sendAssessmentNotificationToStudents = async (
  students,
  assessment,
  course,
  teacher
) => {
  const emailPromises = students.map((student) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
      to: student.email,
      subject: `📊 New Assessment Available: ${assessment.title} | ${course.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">New Assessment Available! 📊</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">Hi ${student.name}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your instructor has created a new assessment in <strong>${
                course.title
              }</strong>.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #8b5cf6;">
              <h3 style="margin: 0 0 15px 0; color: #7c3aed; font-size: 20px;">${
                assessment.title
              }</h3>
              ${
                assessment.description
                  ? `<p style="margin: 10px 0; color: #6b7280; line-height: 1.6;">${assessment.description}</p>`
                  : ""
              }
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0; color: #1f2937;">📅 <strong>Due Date:</strong> ${new Date(
                  assessment.dueDate
                ).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #1f2937;">⏱️ <strong>Duration:</strong> ${
                  assessment.duration
                } minutes</p>
                <p style="margin: 5px 0; color: #1f2937;">📝 <strong>Total Points:</strong> ${
                  assessment.totalPoints
                }</p>
                <p style="margin: 5px 0; color: #1f2937;">👨‍🏫 <strong>Instructor:</strong> ${
                  teacher.name
                }</p>
              </div>
            </div>
            
            <div style="background: #ede9fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
              <p style="margin: 0; color: #5b21b6; font-size: 14px;">
                ⚠️ <strong>Important:</strong> Make sure to complete the assessment before the deadline. You have ${
                  assessment.duration
                } minutes once you start!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/assessments" 
                 style="display: inline-block; padding: 15px 40px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View Assessment
              </a>
            </div>
          </div>
        </div>
      `,
    };

    return sendEmail(mailOptions);
  });

  const results = await Promise.allSettled(emailPromises);

  const successCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  console.log(
    `✅ Assessment notifications sent: ${successCount}/${students.length}`
  );

  return { success: true, sent: successCount, total: students.length };
};

/**
 * Send live class notification to students
 */
/**
 * Send live class notification to a single student
 */
exports.sendLiveClassNotification = async (
  student,
  liveClass,
  course,
  teacher
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
    to: student.email,
    subject: `🎥 Live Class Scheduled: ${liveClass.title} | ${course.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">🔴 Live Class Scheduled!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Hi ${student.name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Don't miss it! Your instructor has scheduled a live class for <strong>${
              course.title
            }</strong>.
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #ef4444;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 20px;">${
              liveClass.title
            }</h3>
            ${
              liveClass.description
                ? `<p style="margin: 10px 0; color: #6b7280; line-height: 1.6;">${liveClass.description}</p>`
                : ""
            }
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 8px 0; color: #1f2937; font-size: 18px;">🕒 <strong>${new Date(
                liveClass.scheduledAt
              ).toLocaleString()}</strong></p>
              <p style="margin: 8px 0; color: #1f2937;">⏱️ <strong>Duration:</strong> ${
                liveClass.duration
              } minutes</p>
              <p style="margin: 8px 0; color: #1f2937;">👨‍🏫 <strong>Instructor:</strong> ${
                teacher.name
              }</p>
            </div>
          </div>
          
          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              📅 <strong>Mark your calendar!</strong> You'll receive a reminder before the class starts.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/live-classes" 
               style="display: inline-block; padding: 15px 40px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View Live Classes
            </a>
          </div>
        </div>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send live class notifications to multiple students
 */
exports.sendLiveClassNotificationToStudents = async (
  students,
  liveClass,
  course,
  teacher
) => {
  const emailPromises = students.map((student) => {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
      to: student.email,
      subject: `🎥 Live Class Scheduled: ${liveClass.title} | ${course.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🔴 Live Class Scheduled!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">Hi ${student.name}! 👋</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Don't miss it! Your instructor has scheduled a live class for <strong>${
                course.title
              }</strong>.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #ef4444;">
              <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 20px;">${
                liveClass.title
              }</h3>
              ${
                liveClass.description
                  ? `<p style="margin: 10px 0; color: #6b7280; line-height: 1.6;">${liveClass.description}</p>`
                  : ""
              }
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 8px 0; color: #1f2937; font-size: 18px;">🕒 <strong>${new Date(
                  liveClass.scheduledAt
                ).toLocaleString()}</strong></p>
                <p style="margin: 8px 0; color: #1f2937;">⏱️ <strong>Duration:</strong> ${
                  liveClass.duration
                } minutes</p>
                <p style="margin: 8px 0; color: #1f2937;">👨‍🏫 <strong>Instructor:</strong> ${
                  teacher.name
                }</p>
              </div>
            </div>
            
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                📅 <strong>Mark your calendar!</strong> You'll receive a reminder before the class starts.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/live-classes" 
                 style="display: inline-block; padding: 15px 40px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View Live Classes
              </a>
            </div>
          </div>
        </div>
      `,
    };

    return sendEmail(mailOptions);
  });

  const results = await Promise.allSettled(emailPromises);

  const successCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  console.log(
    `✅ Live class notifications sent: ${successCount}/${students.length}`
  );

  return { success: true, sent: successCount, total: students.length };
};

/**
 * Send grade notification email to student
 */
exports.sendGradeNotificationEmail = async (
  student,
  assignment,
  submission,
  teacher
) => {
  const percentage = (
    (submission.grade / assignment.totalPoints) *
    100
  ).toFixed(1);
  const gradeStatus =
    percentage >= 70
      ? "Great job!"
      : percentage >= 50
      ? "Good effort!"
      : "Keep practicing!";
  const statusColor =
    percentage >= 70 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444";

  const mailOptions = {
    from: process.env.EMAIL_FROM || "LMS Platform <noreply@lms.com>",
    to: student.email,
    subject: `📊 Your assignment "${assignment.title}" has been graded`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Assignment Graded! 📊</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Hello ${student.name}! 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your assignment has been graded by ${teacher.name}.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #1f2937; margin-top: 0;">Assignment Details</h3>
            <p style="color: #4b5563; margin: 5px 0;"><strong>Title:</strong> ${
              assignment.title
            }</p>
            <p style="color: #4b5563; margin: 5px 0;"><strong>Course:</strong> ${
              assignment.course?.title || "N/A"
            }</p>
            ${
              submission.isLate
                ? '<p style="color: #ef4444; margin: 5px 0;"><strong>⚠️ Status:</strong> Submitted Late</p>'
                : ""
            }
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; text-align: center;">
            <h3 style="color: #1f2937; margin-top: 0;">Your Grade</h3>
            <div style="font-size: 3em; font-weight: bold; color: ${statusColor}; margin: 10px 0;">
              ${submission.grade}/${assignment.totalPoints}
            </div>
            <div style="font-size: 1.5em; color: #6b7280;">
              ${percentage}%
            </div>
            <p style="color: ${statusColor}; font-weight: bold; margin-top: 10px;">
              ${gradeStatus}
            </p>
          </div>

          ${
            submission.feedback
              ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e; margin-top: 0;">Teacher's Feedback:</h4>
            <p style="color: #78350f; font-style: italic;">${submission.feedback}</p>
          </div>
          `
              : ""
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/grades" 
               style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              View All Grades
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Keep up the great work! 🎓</p>
          </div>
        </div>
      </div>
    `,
  };

  return sendEmail(mailOptions);
};

console.log("📧 Email service loaded");
