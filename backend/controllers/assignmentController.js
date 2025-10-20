const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Submission = require("../models/Submission");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

let CloudinaryStorage, cloudinary;
// Capture require-time errors so we can log why Cloudinary isn't available
let requireCloudError = null;
try {
  ({ CloudinaryStorage } = require("multer-storage-cloudinary"));
  ({ v2: cloudinary } = require("cloudinary"));
} catch (e) {
  // store the error and continue — controller will fallback to local storage
  requireCloudError = e;
}
const {
  sendAssignmentNotificationToStudents,
} = require("../utils/emailService");
const { createLogger } = require("../utils/logger");
const log = createLogger("assignmentController");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
      resource_type: "raw",
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
  // Include a helpful reason in logs so deploy logs surface the root cause
  const reason = requireCloudError
    ? `require_error: ${requireCloudError.message}`
    : "missing CLOUDINARY_* env variables or Cloudinary packages not installed";
  log.info("storage:local:enabled", { scope: "assignments", reason });
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
      const attachments = req.files
        ? req.files.map((file) => {
            const isCloud =
              hasCloudinaryConfig &&
              ((file.secure_url && file.secure_url.startsWith("http")) ||
                (file.path && file.path.startsWith("http")));
            const provider = isCloud ? "cloudinary" : "local";
            log.info("assignment:file:stored", {
              filename: file.filename || file.public_id,
              provider,
              url: file.secure_url || file.path,
            });
            return {
              filename: file.filename || file.public_id,
              originalName: file.originalname || file.original_filename,
              path: file.path || file.secure_url,
              url: file.secure_url || file.path,
              mimetype: file.mimetype,
              size: file.size,
              provider,
              publicId: file.public_id || undefined,
            };
          })
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

// Generate a mock quiz using Gemini 2.5 Pro
// No persistence; returns 10 MCQs and answer key based on course/assignment context
exports.generateMockQuiz = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .select("title description course")
      .populate("course", "title")
      .lean();
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, error: "Assignment not found" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ success: false, error: "Gemini API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Structured prompt to ensure consistent JSON output
    const systemPrompt = `You are an assistant that generates concise multiple-choice quizzes.
Return STRICT JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "",
      "options": ["A", "B", "C", "D"],
      "answer": "A", // must be exactly one of options
      "explanation": "" // brief reasoning (1-2 lines)
    }
  ]
}
Rules:
- Exactly 10 questions.
- Each with 4 options (A-D) of similar length.
- Keep questions specific to the provided course and assignment.
- Keep explanations short and helpful.
- Do not include any text outside JSON.`;

    const userContext = {
      courseTitle: assignment.course?.title || "",
      assignmentTitle: assignment.title,
      assignmentDescription: assignment.description || "",
    };

    const content = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "user",
        parts: [
          {
            text: `Generate a mock quiz for this context:\n${JSON.stringify(
              userContext,
              null,
              2
            )}`,
          },
        ],
      },
    ];

    const response = await model.generateContent({ contents: content });
    const text =
      response.response?.text?.() ||
      response.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    // Attempt to parse JSON from model output
    let quiz;
    try {
      const jsonStr = text.trim().replace(/^```json\n?|```$/g, "");
      quiz = JSON.parse(jsonStr);
    } catch (e) {
      log.warn("gemini:quiz:parse:error", {
        error: e.message,
        raw: text.slice(0, 200),
      });
      return res
        .status(502)
        .json({ success: false, error: "Failed to parse quiz from Gemini" });
    }

    // Basic validation
    if (
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 10
    ) {
      return res
        .status(502)
        .json({ success: false, error: "Quiz format invalid" });
    }

    // Do NOT store anything; just return
    res.json({ success: true, quiz });
  } catch (error) {
    log.error("gemini:quiz:error", { error: error.message });
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
  const Enrollment = require("../models/Enrollment");

  try {
    let assignments;

    if (req.user.role === "Teacher") {
      // For teachers, return all assignments they created
      assignments = await Assignment.find({ teacher: req.user._id })
        .select("title description dueDate totalPoints status course createdAt")
        .populate("course", "title")
        .lean()
        .sort("-createdAt")
        .limit(100);
      log.info("assignments:my:teacher", {
        requestId: req.id,
        teacherId: req.user._id,
        count: assignments.length,
      });
    } else if (req.user.role === "Student") {
      // For students, only return assignments from courses they're enrolled in
      const enrollments = await Enrollment.find({
        student: req.user._id,
        status: "active",
      })
        .select("course")
        .lean();

      const enrolledCourseIds = enrollments.map((e) => e.course);

      assignments = await Assignment.find({
        course: { $in: enrolledCourseIds },
        status: "published", // Only show published assignments to students
      })
        .select(
          "title description dueDate totalPoints status course createdAt allowLateSubmission"
        )
        .populate("course", "title")
        .lean()
        .sort("-dueDate")
        .limit(50);

      log.info("assignments:my:student", {
        requestId: req.id,
        studentId: req.user._id,
        enrolledCourses: enrolledCourseIds.length,
        assignments: assignments.length,
      });
    } else {
      assignments = [];
    }

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
