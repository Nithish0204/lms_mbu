const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendGradeNotificationEmail } = require("../utils/emailService");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/submissions";
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
    // Allow common file types
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
}).array("files", 5); // Allow up to 5 files

/**
 * @desc    Submit an assignment
 * @route   POST /api/submissions
 * @access  Private (Student only)
 */
exports.submitAssignment = async (req, res) => {
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

    console.log("\n=== SUBMIT ASSIGNMENT ===");
    console.log("👤 Student:", req.user.name);
    console.log("📝 Assignment ID:", req.body.assignmentId);
    console.log("📎 Files:", req.files?.length || 0);

    try {
      const { assignmentId, textSubmission } = req.body;

      // Check if assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: "Assignment not found",
        });
      }

      // Check if student is enrolled in the course
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: assignment.course,
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: "You are not enrolled in this course",
        });
      }

      // Check if already submitted
      const existingSubmission = await Submission.findOne({
        assignment: assignmentId,
        student: req.user._id,
      });

      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          error: "You have already submitted this assignment",
        });
      }

      // Check if late submission is allowed
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isLate = now > dueDate;

      if (isLate && !assignment.allowLateSubmission) {
        return res.status(400).json({
          success: false,
          error: "Late submissions are not allowed for this assignment",
        });
      }

      // Prepare file data
      const files = req.files
        ? req.files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
          }))
        : [];

      // Create submission
      const submission = new Submission({
        assignment: assignmentId,
        student: req.user._id,
        textSubmission,
        files,
        isLate,
      });

      await submission.save();

      console.log("✅ Assignment submitted successfully");
      console.log(`⏰ ${isLate ? "LATE" : "ON TIME"} submission`);

      res.status(201).json({
        success: true,
        submission,
        message: isLate
          ? "Late submission recorded"
          : "Assignment submitted successfully",
      });
    } catch (error) {
      console.error("❌ SUBMIT ASSIGNMENT ERROR:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
};

/**
 * @desc    Get my submissions
 * @route   GET /api/submissions/my-submissions
 * @access  Private (Student only)
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.user._id,
    })
      .populate({
        path: "assignment",
        select: "title dueDate totalPoints course",
        populate: {
          path: "course",
          select: "title",
        },
      })
      .sort("-submittedAt");

    res.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error("❌ GET MY SUBMISSIONS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Get submissions for an assignment (Teacher)
 * @route   GET /api/submissions/assignment/:assignmentId
 * @access  Private (Teacher only)
 */
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
      });
    }

    // Check if teacher owns this assignment
    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view these submissions",
      });
    }

    const submissions = await Submission.find({
      assignment: req.params.assignmentId,
    })
      .populate("student", "name email")
      .sort("-submittedAt");

    res.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error("❌ GET ASSIGNMENT SUBMISSIONS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Grade a submission
 * @route   PUT /api/submissions/:id/grade
 * @access  Private (Teacher only)
 */
exports.gradeSubmission = async (req, res) => {
  console.log("\n=== GRADE SUBMISSION ===");
  console.log("👤 Teacher:", req.user.name);
  console.log("📝 Submission ID:", req.params.id);
  console.log("🎯 Grade:", req.body.grade);

  try {
    const { grade, feedback } = req.body;

    let submission = await Submission.findById(req.params.id).populate(
      "assignment"
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check if teacher owns this assignment
    if (submission.assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to grade this submission",
      });
    }

    // Validate grade
    if (grade < 0 || grade > submission.assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        error: `Grade must be between 0 and ${submission.assignment.totalPoints}`,
      });
    }

    // Apply late penalty if applicable
    let finalGrade = grade;
    if (submission.isLate && submission.assignment.lateSubmissionPenalty > 0) {
      const daysLate = Math.ceil(
        (submission.submittedAt - new Date(submission.assignment.dueDate)) /
          (1000 * 60 * 60 * 24)
      );
      const penalty =
        (submission.assignment.lateSubmissionPenalty / 100) * grade * daysLate;
      finalGrade = Math.max(0, grade - penalty);
      console.log(
        `⚠️ Late penalty applied: ${daysLate} days, ${penalty} points deducted`
      );
    }

    submission.grade = finalGrade;
    submission.feedback = feedback;
    submission.status = "graded";
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    await submission.save();

    console.log("✅ Submission graded successfully");
    console.log(
      `📊 Final grade: ${finalGrade}/${submission.assignment.totalPoints}`
    );

    // Populate student and assignment details for email
    await submission.populate([
      { path: "student", select: "name email" },
      { path: "assignment", populate: { path: "course", select: "title" } },
    ]);

    // Send email notification to student
    try {
      console.log("📧 Sending grade notification email...");
      await sendGradeNotificationEmail(
        submission.student,
        submission.assignment,
        submission,
        req.user
      );
      console.log("✅ Grade notification email sent");
    } catch (emailError) {
      console.error("❌ Error sending grade notification email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      submission,
      message: "Submission graded successfully",
    });
  } catch (error) {
    console.error("❌ GRADE SUBMISSION ERROR:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Get single submission
 * @route   GET /api/submissions/:id
 * @access  Private
 */
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("student", "name email")
      .populate({
        path: "assignment",
        populate: {
          path: "course",
          select: "title",
        },
      })
      .populate("gradedBy", "name");

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check authorization
    if (
      req.user.role === "Student" &&
      submission.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this submission",
      });
    }

    if (
      req.user.role === "Teacher" &&
      submission.assignment.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this submission",
      });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("❌ GET SUBMISSION ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Delete submission (Student only before grading)
 * @route   DELETE /api/submissions/:id
 * @access  Private (Student only)
 */
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check if student owns this submission
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this submission",
      });
    }

    // Don't allow deletion if already graded
    if (submission.status === "graded") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete a graded submission",
      });
    }

    // Delete associated files
    if (submission.files && submission.files.length > 0) {
      submission.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    await submission.deleteOne();

    res.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE SUBMISSION ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Download submission file
 * @route   GET /api/submissions/:id/download/:fileIndex
 * @access  Private
 */
exports.downloadFile = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      "assignment"
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check authorization
    const isStudent =
      req.user.role === "Student" &&
      submission.student.toString() === req.user._id.toString();
    const isTeacher =
      req.user.role === "Teacher" &&
      submission.assignment.teacher.toString() === req.user._id.toString();

    if (!isStudent && !isTeacher) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to download this file",
      });
    }

    const fileIndex = parseInt(req.params.fileIndex);
    if (
      isNaN(fileIndex) ||
      fileIndex < 0 ||
      fileIndex >= submission.files.length
    ) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    const file = submission.files[fileIndex];
    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found on server",
      });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error("❌ DOWNLOAD FILE ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = exports;
