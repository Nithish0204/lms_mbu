const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Optional Cloudinary storage
let CloudinaryStorage, cloudinary;
try {
  ({ CloudinaryStorage } = require("multer-storage-cloudinary"));
  ({ v2: cloudinary } = require("cloudinary"));
} catch (_) {}
const { sendGradeNotificationEmail } = require("../utils/emailService");
const { createLogger } = require("../utils/logger");
const log = createLogger("submissionController");

// Configure multer for file uploads (cloud if configured, else local disk)
let storage;
const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  CloudinaryStorage &&
  cloudinary;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder: "lms/submissions",
      resource_type: "raw",
      public_id: `sub-${Date.now()}`,
    }),
  });
  log.info("storage:cloudinary:enabled", { scope: "submissions" });
} else {
  storage = multer.diskStorage({
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
  log.info("storage:local:enabled", { scope: "submissions" });
}

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

    const reqLog = log.child({ requestId: req.id, userId: req.user?._id });
    reqLog.info("submission:create:start", {
      student: req.user?.name,
      assignmentId: req.body.assignmentId,
      files: req.files?.length || 0,
    });

    try {
      const { assignmentId, textSubmission } = req.body;

      // Check if assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        reqLog.warn("submission:create:assignment:notFound", { assignmentId });
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
        reqLog.warn("submission:create:notEnrolled", {
          assignmentId,
          course: assignment.course,
        });
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
        reqLog.warn("submission:create:duplicate", {
          submissionId: existingSubmission._id,
        });
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
        reqLog.warn("submission:create:lateNotAllowed", {
          assignmentId,
          dueDate: assignment.dueDate,
        });
        return res.status(400).json({
          success: false,
          error: "Late submissions are not allowed for this assignment",
        });
      }

      // Prepare file data
      const usingCloud = !!(
        hasCloudinaryConfig &&
        req.files &&
        req.files.length &&
        (req.files[0].secure_url ||
          (req.files[0].path && req.files[0].path.startsWith("http")))
      );
      const files = req.files
        ? req.files.map((file) => ({
            filename: file.filename || file.public_id,
            originalName: file.originalname || file.original_filename,
            path: file.path || file.secure_url,
            url: file.secure_url || file.path,
            mimetype: file.mimetype,
            size: file.size,
            provider: usingCloud ? "cloudinary" : "local",
            publicId: file.public_id || undefined,
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

      reqLog.info("submission:create:success", {
        submissionId: submission._id,
        late: isLate,
      });

      res.status(201).json({
        success: true,
        submission,
        message: isLate
          ? "Late submission recorded"
          : "Assignment submitted successfully",
      });
    } catch (error) {
      log.error("submission:create:error", {
        requestId: req.id,
        error: error.message,
        stack: error.stack,
      });
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
      .select("assignment submittedAt isLate grade status feedback")
      .populate({
        path: "assignment",
        select: "title dueDate totalPoints course",
        populate: {
          path: "course",
          select: "title",
        },
      })
      .sort("-submittedAt")
      .limit(100)
      .lean();

    res.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    log.error("submission:listMine:error", {
      requestId: req.id,
      error: error.message,
    });
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
      log.warn("submission:listForAssignment:assignment:notFound", {
        requestId: req.id,
        assignmentId: req.params.assignmentId,
      });
      return res.status(404).json({
        success: false,
        error: "Assignment not found",
      });
    }

    // Check if teacher owns this assignment
    if (assignment.teacher.toString() !== req.user._id.toString()) {
      log.warn("submission:listForAssignment:forbidden", {
        requestId: req.id,
        teacherId: req.user._id,
      });
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
    log.error("submission:listForAssignment:error", {
      requestId: req.id,
      error: error.message,
    });
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
  const reqLog = log.child({
    requestId: req.id,
    userId: req.user?._id,
    submissionId: req.params.id,
  });
  reqLog.info("submission:grade:start", {
    teacher: req.user?.name,
    grade: req.body.grade,
  });

  try {
    const { grade, feedback } = req.body;

    let submission = await Submission.findById(req.params.id).populate(
      "assignment"
    );

    if (!submission) {
      reqLog.warn("submission:grade:notFound");
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check if teacher owns this assignment
    if (submission.assignment.teacher.toString() !== req.user._id.toString()) {
      reqLog.warn("submission:grade:forbidden", { teacherId: req.user._id });
      return res.status(403).json({
        success: false,
        error: "Not authorized to grade this submission",
      });
    }

    // Validate grade
    if (grade < 0 || grade > submission.assignment.totalPoints) {
      reqLog.warn("submission:grade:invalidGrade", {
        max: submission.assignment.totalPoints,
        received: grade,
      });
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
      reqLog.info("submission:grade:latePenalty", { daysLate, penalty });
    }

    submission.grade = finalGrade;
    submission.feedback = feedback;
    submission.status = "graded";
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    await submission.save();

    reqLog.info("submission:grade:success", {
      finalGrade,
      total: submission.assignment.totalPoints,
    });

    // Populate student and assignment details for email
    await submission.populate([
      { path: "student", select: "name email" },
      { path: "assignment", populate: { path: "course", select: "title" } },
    ]);

    // Send email notification to student
    try {
      reqLog.debug("submission:grade:email:start");
      await sendGradeNotificationEmail(
        submission.student,
        submission.assignment,
        submission,
        req.user
      );
      reqLog.debug("submission:grade:email:sent");
    } catch (emailError) {
      reqLog.warn("submission:grade:email:error", {
        error: emailError.message,
      });
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      submission,
      message: "Submission graded successfully",
    });
  } catch (error) {
    log.error("submission:grade:error", {
      requestId: req.id,
      error: error.message,
      stack: error.stack,
    });
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
    log.error("submission:get:error", {
      requestId: req.id,
      id: req.params.id,
      error: error.message,
    });
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
      log.warn("submission:delete:notFound", {
        requestId: req.id,
        id: req.params.id,
      });
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check if student owns this submission
    if (submission.student.toString() !== req.user._id.toString()) {
      log.warn("submission:delete:forbidden", {
        requestId: req.id,
        studentId: req.user._id,
      });
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this submission",
      });
    }

    // Don't allow deletion if already graded
    if (submission.status === "graded") {
      log.warn("submission:delete:alreadyGraded", { requestId: req.id });
      return res.status(400).json({
        success: false,
        error: "Cannot delete a graded submission",
      });
    }

    // Delete associated files (cloud or local)
    if (submission.files && submission.files.length > 0) {
      for (const file of submission.files) {
        const isCloud =
          file.provider === "cloudinary" ||
          (file.path && /^https?:\/\//.test(file.path));
        if (isCloud && cloudinary) {
          try {
            const publicId = file.publicId || file.filename;
            if (publicId) {
              await cloudinary.uploader.destroy(publicId, {
                resource_type: "auto",
              });
              log.debug("cloudinary:deleted", { publicId });
            }
          } catch (e) {
            log.warn("cloudinary:delete:error", {
              publicId: file.publicId || file.filename,
              error: e.message,
            });
          }
        } else if (file.path) {
          try {
            const abs = path.resolve(file.path);
            if (fs.existsSync(abs)) fs.unlinkSync(abs);
          } catch (e) {
            log.warn("localFile:delete:error", {
              path: file.path,
              error: e.message,
            });
          }
        }
      }
    }

    await submission.deleteOne();

    res.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    log.error("submission:delete:error", {
      requestId: req.id,
      id: req.params.id,
      error: error.message,
    });
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
      log.warn("submission:download:notFound", {
        requestId: req.id,
        id: req.params.id,
      });
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
      log.warn("submission:download:forbidden", {
        requestId: req.id,
        userId: req.user._id,
      });
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
      log.warn("submission:download:fileIndexInvalid", {
        requestId: req.id,
        fileIndex,
      });
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    const file = submission.files[fileIndex];
    const fileUrl = file.url || file.path;
    if (fileUrl && /^https?:\/\//.test(fileUrl)) {
      return res.redirect(fileUrl);
    }
    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      log.warn("submission:download:fileMissing", {
        requestId: req.id,
        path: filePath,
      });
      return res.status(404).json({
        success: false,
        error: "File not found on server",
      });
    }
    res.download(filePath, file.originalName);
  } catch (error) {
    log.error("submission:download:error", {
      requestId: req.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = exports;
