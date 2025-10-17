const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Submission = require("../models/Submission");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  sendAssignmentNotificationToStudents,
} = require("../utils/emailService");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/assignments";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|zip|rar/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR"
        )
      );
    }
  },
}).array("files", 5);

exports.createAssignment = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: `File upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    console.log("\n=== CREATE ASSIGNMENT ===");
    console.log("👤 Teacher:", req.user.name);
    console.log("📝 Assignment data:", req.body);
    console.log("📎 Files:", req.files?.length || 0);

    try {
      // Prepare file data
      const attachments = req.files
        ? req.files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
          }))
        : [];

      const assignmentData = {
        ...req.body,
        teacher: req.user._id,
        attachments,
      };

      const assignment = new Assignment(assignmentData);
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
          status: "active",
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
  });
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

    // Delete all submissions related to this assignment
    const submissions = await Submission.find({ assignment: req.params.id });

    // Delete submission files
    for (const submission of submissions) {
      if (submission.files && submission.files.length > 0) {
        submission.files.forEach((file) => {
          // Handle both string paths and object paths
          const filePath =
            typeof file === "string" ? file : file.path || file.filename;
          if (filePath) {
            const fullPath = path.join(__dirname, "..", filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`✅ Deleted submission file: ${fullPath}`);
            }
          }
        });
      }
    }

    // Delete all submissions from database
    await Submission.deleteMany({ assignment: req.params.id });
    console.log(
      `✅ Deleted ${submissions.length} submissions for assignment ${req.params.id}`
    );

    // Delete assignment files
    if (assignment.attachments && assignment.attachments.length > 0) {
      assignment.attachments.forEach((file) => {
        // Handle both string paths and object paths
        const filePath =
          typeof file === "string" ? file : file.path || file.filename;
        if (filePath) {
          const fullPath = path.join(__dirname, "..", filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted assignment file: ${fullPath}`);
          }
        }
      });
    }

    // Delete the assignment
    await assignment.deleteOne();
    console.log(`✅ Deleted assignment: ${assignment.title}`);

    res.json({
      success: true,
      message: "Assignment and all related submissions deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting assignment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
