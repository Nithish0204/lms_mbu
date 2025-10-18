const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Submission = require("../models/Submission");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Optional Cloudinary storage (used if CLOUDINARY_* env vars are set)
let CloudinaryStorage, cloudinary;
try {
  ({ CloudinaryStorage } = require("multer-storage-cloudinary"));
  ({ v2: cloudinary } = require("cloudinary"));
} catch (e) {
  // Dependencies may not be installed; fallback to local storage
}
const {
  sendAssignmentNotificationToStudents,
} = require("../utils/emailService");
const { createLogger } = require("../utils/logger");
const log = createLogger("assignmentController");

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
    params: async (req, file) => ({
      folder: "lms/assignments",
      resource_type: "auto",
      public_id: `assign-${Date.now()}`,
    }),
  });
  log.info("storage:cloudinary:enabled", { scope: "assignments" });
} else {
  storage = multer.diskStorage({
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
  log.info("storage:local:enabled", { scope: "assignments" });
}

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

    const reqLog = log.child({ requestId: req.id, userId: req.user?._id });
    reqLog.info("assignment:create:start", {
      teacher: req.user?.name,
      course: req.body.course,
      title: req.body.title,
      files: req.files?.length || 0,
    });

    try {
      // Prepare file data
      const usingCloud = !!(
        hasCloudinaryConfig &&
        req.files &&
        req.files.length &&
        req.files[0].path &&
        req.files[0].path.startsWith("http")
      );
      const attachments = req.files
        ? req.files.map((file) => ({
            filename: file.filename || file.public_id,
            originalName: file.originalname || file.original_filename,
            path: file.path || file.secure_url, // keep 'path' for backwards compatibility
            url: file.secure_url || file.path, // prefer direct URL if available
            mimetype: file.mimetype,
            size: file.size,
            provider: usingCloud ? "cloudinary" : "local",
            publicId: file.public_id || undefined,
          }))
        : [];

      const assignmentData = {
        ...req.body,
        teacher: req.user._id,
        attachments,
      };

      const assignment = new Assignment(assignmentData);
      await assignment.save();
      reqLog.info("assignment:create:db:saved", { id: assignment._id });

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
        reqLog.info("assignment:create:notify", { students: students.length });

        // Send notifications to all enrolled students (asynchronously)
        if (students.length > 0) {
          sendAssignmentNotificationToStudents(
            students,
            assignment,
            course,
            req.user
          ).catch((error) => {
            reqLog.warn("assignment:create:notify:error", {
              error: error.message,
            });
          });
        }
      }

      res.status(201).json({ success: true, assignment });
    } catch (error) {
      log.error("assignment:create:error", {
        requestId: req.id,
        error: error.message,
        stack: error.stack,
      });
      res.status(400).json({ success: false, error: error.message });
    }
  });
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate("course", "title");
    res.json({ success: true, assignments });
  } catch (error) {
    log.error("assignments:list:error", {
      requestId: req.id,
      error: error.message,
    });
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
    log.error("assignments:byCourse:error", {
      requestId: req.id,
      courseId: req.params.courseId,
      error: error.message,
    });
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
    log.error("assignment:get:error", {
      requestId: req.id,
      id: req.params.id,
      error: error.message,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    // Get assignments for courses the user is enrolled in or teaching
    const assignments = await Assignment.find().populate("course");
    res.json({ success: true, assignments });
  } catch (error) {
    log.error("assignments:my:error", {
      requestId: req.id,
      userId: req.user?._id,
      error: error.message,
    });
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
    log.error("assignment:update:error", {
      requestId: req.id,
      id: req.params.id,
      error: error.message,
    });
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
              log.debug("submission:file:deleted", { path: fullPath });
            }
          }
        });
      }
    }

    // Delete all submissions from database
    await Submission.deleteMany({ assignment: req.params.id });
    log.info("assignment:submissions:deleted", {
      count: submissions.length,
      assignmentId: req.params.id,
    });

    // Delete assignment files (Cloudinary or local)
    if (assignment.attachments && assignment.attachments.length > 0) {
      for (const file of assignment.attachments) {
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
        } else {
          // Handle both string paths and object paths
          const filePath =
            typeof file === "string" ? file : file.path || file.filename;
          if (filePath) {
            const fullPath = path.join(__dirname, "..", filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              log.debug("assignment:file:deleted", { path: fullPath });
            }
          }
        }
      }
    }

    // Delete the assignment
    await assignment.deleteOne();
    log.info("assignment:deleted", {
      id: assignment._id,
      title: assignment.title,
    });

    res.json({
      success: true,
      message: "Assignment and all related submissions deleted successfully",
    });
  } catch (error) {
    log.error("assignment:delete:error", {
      requestId: req.id,
      id: req.params.id,
      error: error.message,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};
