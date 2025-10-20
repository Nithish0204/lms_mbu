const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");
const {
  sendEnrollmentNotificationToTeacher,
  sendEnrollmentConfirmationToStudent,
} = require("../utils/emailService");

exports.createEnrollment = async (req, res) => {
  console.log("=== CREATE ENROLLMENT REQUEST ===");
  console.log("Student ID:", req.user._id);
  console.log("Course ID:", req.body.courseId);

  try {
    const { courseId } = req.body;

    // Check if already enrolled
    console.log("🔍 Checking for existing enrollment...");
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      console.log("❌ Already enrolled!");
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Get course and teacher details
    console.log("📚 Fetching course details...");
    const course = await Course.findById(courseId).populate(
      "teacher",
      "name email"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    console.log("✅ Not enrolled yet, creating enrollment...");
    const enrollment = new Enrollment({
      student: req.user._id,
      course: courseId,
    });
    await enrollment.save();
    console.log("✅ Enrollment created:", enrollment._id);

    // Send notification to teacher (asynchronously)
    console.log("📧 Sending enrollment notification to teacher...");
    sendEnrollmentNotificationToTeacher(req.user, course, course.teacher).catch(
      (error) => {
        console.error("⚠️ Failed to send teacher notification:", error);
      }
    );

    // Send confirmation to student (asynchronously)
    console.log("📧 Sending enrollment confirmation to student...");
    sendEnrollmentConfirmationToStudent(req.user, course, course.teacher).catch(
      (error) => {
        console.error("⚠️ Failed to send student confirmation:", error);
      }
    );

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    console.error("❌ CREATE ENROLLMENT ERROR:", error);
    res.status(400).json({ success: false, error: error.message });
  }
  console.log("=== END CREATE ENROLLMENT REQUEST ===\n");
};

exports.getEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("student", "name email")
      .populate("course", "title description")
      .lean();
    res.json({ success: true, enrollments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .select("course status enrolledAt")
      .populate("course", "title description teacher thumbnail")
      .populate({
        path: "course",
        populate: { path: "teacher", select: "name email" },
      })
      .lean();
    res.json({ success: true, enrollments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.checkEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
    }).lean();
    res.json({ success: true, enrolled: !!enrollment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.unenroll = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res
        .status(404)
        .json({ success: false, error: "Enrollment not found" });
    }

    // Check if user is the enrolled student
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to unenroll",
      });
    }

    await enrollment.deleteOne();
    res.json({ success: true, message: "Unenrolled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get enrollments for a specific course (for teachers)
exports.getCourseEnrollments = async (req, res) => {
  console.log("=== GET COURSE ENROLLMENTS REQUEST ===");
  console.log("Course ID:", req.params.courseId);
  console.log("Requesting user:", req.user._id);

  try {
    const courseId = req.params.courseId;

    // Verify the course exists and user is the teacher
    const course = await Course.findById(courseId);
    if (!course) {
      console.log("❌ Course not found");
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Check if user is the teacher of this course
    if (course.teacher.toString() !== req.user._id.toString()) {
      console.log("❌ User not authorized to view enrollments");
      return res.status(403).json({
        success: false,
        error: "Not authorized to view enrollments for this course",
      });
    }

    console.log("🔍 Fetching enrollments...");
    const enrollments = await Enrollment.find({
      course: courseId,
      $or: [
        { status: "active" },
        { status: { $exists: false } }, // legacy enrollments
      ],
    })
      .populate("student", "name email")
      .sort({ enrolledAt: -1 })
      .lean();

    console.log(`✅ Found ${enrollments.length} enrollments`);
    res.json({
      success: true,
      count: enrollments.length,
      enrollments: enrollments,
    });
  } catch (error) {
    console.error("❌ GET COURSE ENROLLMENTS ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  console.log("=== END GET COURSE ENROLLMENTS REQUEST ===\n");
};

// Remove a student from a course (for teachers)
exports.removeStudentFromCourse = async (req, res) => {
  console.log("=== REMOVE STUDENT FROM COURSE REQUEST ===");
  console.log("Enrollment ID:", req.params.enrollmentId);
  console.log("Requesting user:", req.user._id);

  try {
    const enrollmentId = req.params.enrollmentId;

    // Find the enrollment
    const enrollment = await Enrollment.findById(enrollmentId).populate(
      "course"
    );
    if (!enrollment) {
      console.log("❌ Enrollment not found");
      return res.status(404).json({
        success: false,
        error: "Enrollment not found",
      });
    }

    // Check if user is the teacher of this course
    if (enrollment.course.teacher.toString() !== req.user._id.toString()) {
      console.log("❌ User not authorized to remove students");
      return res.status(403).json({
        success: false,
        error: "Not authorized to remove students from this course",
      });
    }

    console.log(
      `🗑️ Removing student ${enrollment.student} from course ${enrollment.course._id}...`
    );
    await enrollment.deleteOne();

    console.log("✅ Student removed successfully");
    res.json({
      success: true,
      message: "Student removed from course successfully",
    });
  } catch (error) {
    console.error("❌ REMOVE STUDENT FROM COURSE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  console.log("=== END REMOVE STUDENT FROM COURSE REQUEST ===\n");
};
