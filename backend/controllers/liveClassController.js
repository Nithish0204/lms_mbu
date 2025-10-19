const LiveClass = require("../models/LiveClass");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const { sendLiveClassNotification } = require("../utils/emailService");

/**
 * Generate unique Agora channel name
 */
const generateChannelName = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `lms_${timestamp}_${random}`;
};

/**
 * Generate Agora RTC token for video call
 */
const generateAgoraToken = (channelName, uid = 0, role = RtcRole.PUBLISHER) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error(
      "Agora credentials not configured in environment variables"
    );
  }

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  console.log(`🎥 Generated Agora token for channel: ${channelName}`);
  return token;
};

/**
 * @desc    Create a new live class
 * @route   POST /api/live-classes
 * @access  Private (Teacher only)
 */
exports.createLiveClass = async (req, res) => {
  console.log("\n=== CREATE LIVE CLASS ===");
  console.log("👤 Teacher:", req.user.name, req.user.email);
  console.log("📝 Request body:", req.body);

  try {
    const { courseId, title, description, scheduledAt, duration } = req.body;

    // Validate required fields
    if (!courseId || !title || !scheduledAt || !duration) {
      return res.status(400).json({
        success: false,
        error: "Please provide courseId, title, scheduledAt, and duration",
      });
    }

    // Verify course exists and belongs to teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "You can only create live classes for your own courses",
      });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    console.log("📅 Scheduled time validation:");
    console.log("  Received:", scheduledAt);
    console.log("  Parsed as:", scheduledDate.toISOString());
    console.log("  Current time:", now.toISOString());
    console.log("  Is in future?", scheduledDate > now);

    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        error: "Scheduled time must be in the future",
      });
    }

    // Generate unique Agora channel name
    const agoraChannel = generateChannelName();

    // Create live class
    const liveClass = await LiveClass.create({
      course: courseId,
      teacher: req.user._id,
      title,
      description,
      scheduledAt: scheduledDate,
      duration,
      agoraChannel,
    });

    console.log("✅ Live class created:", liveClass._id);
    console.log("📺 Agora channel:", agoraChannel);

    // Populate course and teacher info for response
    await liveClass.populate("course", "title");
    await liveClass.populate("teacher", "name email");

    // Get all enrolled students for notifications
    // Note: Include enrollments without status (old data) OR with status "active"
    const enrollments = await Enrollment.find({
      course: courseId,
      $or: [
        { status: "active" },
        { status: { $exists: false } }, // Old enrollments without status field
      ],
    }).populate("student", "name email");

    console.log(
      `📧 Sending notifications to ${enrollments.length} enrolled students`
    );

    // Send email notifications to all enrolled students
    const emailPromises = enrollments.map((enrollment) =>
      sendLiveClassNotification(enrollment.student, liveClass, course, req.user)
        .then(() => {
          console.log(
            `✅ Email sent successfully to ${enrollment.student.email}`
          );
        })
        .catch((error) => {
          console.error(
            `⚠️ Failed to send notification to ${enrollment.student.email}:`,
            error.message
          );
        })
    );

    // Wait for all emails to complete
    await Promise.all(emailPromises);
    console.log(
      `📧 Email sending process completed for ${enrollments.length} students`
    );

    res.status(201).json({
      success: true,
      liveClass,
      message: `Live class scheduled successfully. Notifications sent to ${enrollments.length} students.`,
    });
  } catch (error) {
    console.error("❌ CREATE LIVE CLASS ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create live class",
      details: error.message,
    });
  }
};

/**
 * @desc    Get all live classes for a course
 * @route   GET /api/live-classes/course/:courseId
 * @access  Private
 */
exports.getCourseLiveClasses = async (req, res) => {
  console.log("\n=== GET COURSE LIVE CLASSES ===");
  console.log("📚 Course ID:", req.params.courseId);

  try {
    const { courseId } = req.params;

    const liveClasses = await LiveClass.find({ course: courseId })
      .populate("teacher", "name email")
      .sort({ scheduledAt: -1 });

    console.log(`✅ Found ${liveClasses.length} live classes`);

    res.status(200).json({
      success: true,
      count: liveClasses.length,
      liveClasses,
    });
  } catch (error) {
    console.error("❌ GET COURSE LIVE CLASSES ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch live classes",
    });
  }
};

/**
 * @desc    Get upcoming live classes for student
 * @route   GET /api/live-classes/my-classes
 * @access  Private (Student)
 */
exports.getMyLiveClasses = async (req, res) => {
  console.log("\n=== GET MY LIVE CLASSES ===");
  console.log("👤 Student:", req.user.name);
  console.log("👤 Student ID:", req.user._id.toString());

  try {
    // Debug: Check ALL enrollments for this student
    const allEnrollments = await Enrollment.find({
      student: req.user._id,
    }).populate("course");

    console.log(`🔍 Total enrollments for student: ${allEnrollments.length}`);
    if (allEnrollments.length > 0) {
      console.log(
        `🔍 All enrollments:`,
        allEnrollments.map((e) => ({
          id: e._id.toString(),
          status: e.status,
          course: e.course ? e.course.title : "NULL",
          courseId: e.course ? e.course._id.toString() : "NULL",
        }))
      );
    }

    // Get student's enrolled courses
    // Note: Include enrollments without status (old data) OR with status "active"
    const enrollments = await Enrollment.find({
      student: req.user._id,
      $or: [
        { status: "active" },
        { status: { $exists: false } }, // Old enrollments without status field
      ],
    })
      .populate("course")
      .select("course");

    // Filter out null courses (deleted courses) and get course IDs
    const courseIds = enrollments
      .filter((e) => e.course !== null)
      .map((e) => e.course._id);

    console.log(`📚 Student enrolled in ${courseIds.length} active courses`);
    console.log(
      `📋 Course IDs:`,
      courseIds.map((id) => id.toString())
    );

    if (courseIds.length === 0) {
      console.log(`⚠️ No active courses found for student`);
      return res.status(200).json({
        success: true,
        count: 0,
        liveClasses: [],
      });
    }

    // Get upcoming live classes for those courses
    const liveClasses = await LiveClass.find({
      course: { $in: courseIds },
      status: { $in: ["scheduled", "live"] },
    })
      .populate("course", "title")
      .populate("teacher", "name email")
      .sort({ scheduledAt: 1 });

    console.log(
      `✅ Found ${liveClasses.length} live classes (scheduled or ongoing)`
    );

    if (liveClasses.length > 0) {
      console.log(`📊 Classes by status:`, {
        scheduled: liveClasses.filter((c) => c.status === "scheduled").length,
        live: liveClasses.filter((c) => c.status === "live").length,
      });
      console.log(
        `📅 Live classes details:`,
        liveClasses.map((lc) => ({
          title: lc.title,
          course: lc.course?.title,
          courseId: lc.course?._id?.toString(),
          status: lc.status,
          scheduledAt: lc.scheduledAt,
        }))
      );
    } else {
      console.log(
        `⚠️ No live classes found for courses:`,
        courseIds.map((id) => id.toString())
      );

      // Debug: Check if ANY live classes exist
      const allLiveClasses = await LiveClass.find({}).select(
        "title course status scheduledAt"
      );
      console.log(`🔍 Total live classes in DB:`, allLiveClasses.length);
      if (allLiveClasses.length > 0) {
        console.log(
          `🔍 All live classes:`,
          allLiveClasses.map((lc) => ({
            title: lc.title,
            courseId: lc.course?.toString(),
            status: lc.status,
            scheduledAt: lc.scheduledAt,
          }))
        );
      }
    }

    res.status(200).json({
      success: true,
      count: liveClasses.length,
      liveClasses,
    });
  } catch (error) {
    console.error("❌ GET MY LIVE CLASSES ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch upcoming classes",
    });
  }
};

/**
 * @desc    Get all live classes created by teacher
 * @route   GET /api/live-classes/my-scheduled
 * @access  Private (Teacher)
 */
exports.getMyScheduledClasses = async (req, res) => {
  console.log("\n=== GET MY SCHEDULED CLASSES ===");
  console.log("👤 Teacher:", req.user.name);

  try {
    const liveClasses = await LiveClass.find({
      teacher: req.user._id,
    })
      .populate("course", "title")
      .sort({ scheduledAt: -1 });

    console.log(`✅ Found ${liveClasses.length} scheduled classes`);

    res.status(200).json({
      success: true,
      count: liveClasses.length,
      liveClasses,
    });
  } catch (error) {
    console.error("❌ GET MY SCHEDULED CLASSES ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch scheduled classes",
    });
  }
};

/**
 * @desc    Join a live class (get Agora token)
 * @route   GET /api/live-classes/:id/join
 * @access  Private
 */
exports.joinLiveClass = async (req, res) => {
  console.log("\n=== JOIN LIVE CLASS ===");
  console.log("👤 User:", req.user.name, `(${req.user.role})`);
  console.log("🆔 Live Class ID:", req.params.id);

  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate("course", "title")
      .populate("teacher", "name email");

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: "Live class not found",
      });
    }

    // Check if user is the teacher
    const isTeacher =
      liveClass.teacher._id.toString() === req.user._id.toString();

    // If not teacher, check if student is enrolled
    if (!isTeacher) {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: liveClass.course._id,
        $or: [
          { status: "active" },
          { status: { $exists: false } }, // Old enrollments without status field
        ],
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: "You must be enrolled in this course to join the live class",
        });
      }
    }

    // Generate Agora token
    const uid = 0; // Use 0 for dynamic user ID assignment
    const role = isTeacher ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    try {
      const token = generateAgoraToken(liveClass.agoraChannel, uid, role);

      // Update live class status to live if teacher is joining
      if (isTeacher && liveClass.status === "scheduled") {
        liveClass.status = "live";
        await liveClass.save();
        console.log("✅ Live class status updated to LIVE");
      }

      // Add participant to tracking
      liveClass.participants.push({
        user: req.user._id,
        joinedAt: new Date(),
      });
      await liveClass.save();

      console.log(`✅ ${req.user.role} joined live class`);
      console.log("🎥 Agora token generated successfully");

      res.status(200).json({
        success: true,
        liveClass: {
          id: liveClass._id,
          title: liveClass.title,
          description: liveClass.description,
          course: liveClass.course.title,
          teacher: liveClass.teacher.name,
          scheduledAt: liveClass.scheduledAt,
          duration: liveClass.duration,
          status: liveClass.status,
        },
        agora: {
          appId: process.env.AGORA_APP_ID,
          token,
          channel: liveClass.agoraChannel,
          uid,
          role: isTeacher ? "publisher" : "subscriber",
        },
      });
    } catch (agoraError) {
      console.error("❌ Agora token generation error:", agoraError);
      return res.status(500).json({
        success: false,
        error:
          "Failed to generate video call token. Please check Agora configuration.",
        details: agoraError.message,
      });
    }
  } catch (error) {
    console.error("❌ JOIN LIVE CLASS ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join live class",
      details: error.message,
    });
  }
};

/**
 * @desc    End a live class
 * @route   PUT /api/live-classes/:id/end
 * @access  Private (Teacher only)
 */
exports.endLiveClass = async (req, res) => {
  console.log("\n=== END LIVE CLASS ===");
  console.log("👤 Teacher:", req.user.name);
  console.log("🆔 Live Class ID:", req.params.id);

  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: "Live class not found",
      });
    }

    // Check if user is the teacher
    if (liveClass.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the teacher can end the live class",
      });
    }

    liveClass.status = "ended";
    await liveClass.save();

    console.log("✅ Live class ended successfully");

    res.status(200).json({
      success: true,
      message: "Live class ended successfully",
      liveClass,
    });
  } catch (error) {
    console.error("❌ END LIVE CLASS ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end live class",
    });
  }
};

/**
 * @desc    Get a live class by ID (status-only lightweight)
 * @route   GET /api/live-classes/:id
 * @access  Private (Teacher/Student)
 */
exports.getLiveClassById = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id).select(
      "status title course teacher scheduledAt"
    );

    if (!liveClass) {
      return res
        .status(404)
        .json({ success: false, error: "Live class not found" });
    }

    res.status(200).json({ success: true, liveClass });
  } catch (error) {
    console.error("❌ GET LIVE CLASS BY ID ERROR:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch live class" });
  }
};

/**
 * @desc    Delete a live class
 * @route   DELETE /api/live-classes/:id
 * @access  Private (Teacher only)
 */
exports.deleteLiveClass = async (req, res) => {
  console.log("\n=== DELETE LIVE CLASS ===");
  console.log("👤 Teacher:", req.user.name);
  console.log("🆔 Live Class ID:", req.params.id);

  try {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: "Live class not found",
      });
    }

    // Check if user is the teacher
    if (liveClass.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the teacher can delete the live class",
      });
    }

    await liveClass.deleteOne();

    console.log("✅ Live class deleted successfully");

    res.status(200).json({
      success: true,
      message: "Live class deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE LIVE CLASS ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete live class",
    });
  }
};

console.log("🎥 Live class controller loaded");
