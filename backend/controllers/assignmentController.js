const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const {
  sendAssignmentNotificationToStudents,
} = require("../utils/emailService");

exports.createAssignment = async (req, res) => {
  console.log("\n=== CREATE ASSIGNMENT ===");
  console.log("👤 Teacher:", req.user);
  console.log("📝 Assignment data:", req.body);

  try {
    const assignment = new Assignment(req.body);
    await assignment.save();
    console.log("✅ Assignment created:", assignment._id);

    // Get course details with teacher info
    const course = await Course.findById(assignment.course).populate(
      "teacher",
      "name email"
    );

    if (course) {
      // Get all enrolled students
      const enrollments = await Enrollment.find({
        course: assignment.course,
      }).populate("student", "name email");

      const students = enrollments.map((e) => e.student);
      console.log(`📧 Notifying ${students.length} enrolled students...`);

      // Send notifications to all enrolled students (asynchronously)
      if (students.length > 0) {
        sendAssignmentNotificationToStudents(
          students,
          assignment,
          course,
          req.user
        ).catch((error) => {
          console.error("⚠️ Failed to send assignment notifications:", error);
        });
      }
    }

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    console.error("❌ CREATE ASSIGNMENT ERROR:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("course", "title");
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      course: req.params.courseId,
    }).populate("course", "title");
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      "course",
      "title teacher"
    );
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    // Get assignments for courses the user is enrolled in or teaching
    const assignments = await Assignment.find().populate("course");
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    await assignment.deleteOne();
    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
