const Assessment = require("../models/Assessment");
const AssessmentSubmission = require("../models/AssessmentSubmission");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const {
  sendAssessmentNotificationToStudents,
} = require("../utils/emailService");

/**
 * @desc    Create a new assessment
 * @route   POST /api/assessments
 * @access  Private (Teacher only)
 */
exports.createAssessment = async (req, res) => {
  console.log("\n=== CREATE ASSESSMENT ===");
  console.log("👤 Teacher:", req.user.name);
  console.log("📝 Assessment data:", req.body);

  try {
    const assessment = new Assessment({
      ...req.body,
      teacher: req.user._id,
    });

    await assessment.save();
    console.log("✅ Assessment created:", assessment._id);

    // Get course details with teacher info
    const course = await Course.findById(assessment.course).populate(
      "teacher",
      "name email"
    );

    if (course) {
      // Get all enrolled students
      const enrollments = await Enrollment.find({
        course: assessment.course,
        $or: [
          { status: "active" },
          { status: { $exists: false } }, // Old enrollments without status field
        ],
      }).populate("student", "name email");

      const students = enrollments.map((e) => e.student);
      console.log(
        `📧 Sending assessment notifications to ${students.length} enrolled students`
      );

      // Send notifications to all enrolled students (asynchronously)
      if (students.length > 0) {
        sendAssessmentNotificationToStudents(
          students,
          assessment,
          course,
          req.user
        ).catch((error) => {
          console.error(
            `⚠️ Failed to send assessment notifications:`,
            error.message
          );
        });
      }
    }

    res.status(201).json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("❌ CREATE ASSESSMENT ERROR:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Get all assessments for a course
 * @route   GET /api/assessments/course/:courseId
 * @access  Private
 */
exports.getAssessmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const assessments = await Assessment.find({
      course: courseId,
      status: { $ne: "draft" }, // Don't show drafts to students
    }).populate("teacher", "name email");

    // If teacher, show all including drafts
    if (req.user.role === "Teacher") {
      const allAssessments = await Assessment.find({
        course: courseId,
        teacher: req.user._id,
      }).populate("teacher", "name email");

      return res.json({
        success: true,
        assessments: allAssessments,
      });
    }

    res.json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error("❌ GET ASSESSMENTS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Get single assessment
 * @route   GET /api/assessments/:id
 * @access  Private
 */
exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("course", "title");

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found",
      });
    }

    // Check if student has already submitted
    if (req.user.role === "Student") {
      const submission = await AssessmentSubmission.findOne({
        assessment: req.params.id,
        student: req.user._id,
      });

      return res.json({
        success: true,
        assessment,
        submission,
        hasSubmitted: !!submission,
      });
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("❌ GET ASSESSMENT ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Update assessment
 * @route   PUT /api/assessments/:id
 * @access  Private (Teacher only)
 */
exports.updateAssessment = async (req, res) => {
  try {
    let assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found",
      });
    }

    // Check if teacher owns this assessment
    if (assessment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this assessment",
      });
    }

    assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("❌ UPDATE ASSESSMENT ERROR:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessments/:id
 * @access  Private (Teacher only)
 */
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found",
      });
    }

    // Check if teacher owns this assessment
    if (assessment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this assessment",
      });
    }

    // Delete all submissions for this assessment
    await AssessmentSubmission.deleteMany({ assessment: req.params.id });

    await assessment.deleteOne();

    res.json({
      success: true,
      message: "Assessment and all submissions deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE ASSESSMENT ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Submit assessment
 * @route   POST /api/assessments/:id/submit
 * @access  Private (Student only)
 */
exports.submitAssessment = async (req, res) => {
  console.log("\n=== SUBMIT ASSESSMENT ===");
  console.log("👤 Student:", req.user.name);
  console.log("📝 Answers:", req.body);

  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found",
      });
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assessment.course,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: "You are not enrolled in this course",
      });
    }

    // Check attempts
    const previousAttempts = await AssessmentSubmission.countDocuments({
      assessment: req.params.id,
      student: req.user._id,
    });

    if (previousAttempts >= assessment.attemptsAllowed) {
      return res.status(400).json({
        success: false,
        error: `Maximum attempts (${assessment.attemptsAllowed}) reached`,
      });
    }

    // Auto-grade objective questions
    const gradedAnswers = req.body.answers.map((answer) => {
      const question = assessment.questions.id(answer.questionId);

      if (!question) {
        return answer;
      }

      let isCorrect = false;
      let pointsAwarded = 0;

      // Auto-grade multiple choice and true-false
      if (
        question.type === "multiple-choice" ||
        question.type === "true-false"
      ) {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        isCorrect = correctOption && answer.answer === correctOption.text;
        pointsAwarded = isCorrect ? question.points : 0;
      }

      // Auto-grade short answer (exact match)
      if (question.type === "short-answer" && question.correctAnswer) {
        isCorrect =
          answer.answer.toLowerCase().trim() ===
          question.correctAnswer.toLowerCase().trim();
        pointsAwarded = isCorrect ? question.points : 0;
      }

      // Essay questions need manual grading
      if (question.type === "essay") {
        pointsAwarded = 0; // Will be graded manually
      }

      return {
        ...answer,
        isCorrect,
        pointsAwarded,
      };
    });

    // Create submission
    const submission = new AssessmentSubmission({
      assessment: req.params.id,
      student: req.user._id,
      answers: gradedAnswers,
      attemptNumber: previousAttempts + 1,
      submittedAt: new Date(),
      status: "submitted",
    });

    // Calculate score
    await submission.calculateScore();

    // If all questions are auto-graded, mark as graded
    const hasEssayQuestions = assessment.questions.some(
      (q) => q.type === "essay"
    );
    if (!hasEssayQuestions) {
      submission.status = "graded";
      submission.gradedAt = new Date();
    }

    await submission.save();

    console.log("✅ Assessment submitted");
    console.log(`📊 Score: ${submission.score}/${assessment.totalPoints}`);
    console.log(`📈 Percentage: ${submission.percentage}%`);

    res.status(201).json({
      success: true,
      submission,
      message: hasEssayQuestions
        ? "Assessment submitted! Awaiting teacher review for essay questions."
        : "Assessment submitted and graded!",
    });
  } catch (error) {
    console.error("❌ SUBMIT ASSESSMENT ERROR:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Get student submissions for an assessment
 * @route   GET /api/assessments/:id/submissions
 * @access  Private (Teacher only)
 */
exports.getAssessmentSubmissions = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found",
      });
    }

    // Check if teacher owns this assessment
    if (assessment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view these submissions",
      });
    }

    const submissions = await AssessmentSubmission.find({
      assessment: req.params.id,
    })
      .populate("student", "name email")
      .sort("-submittedAt");

    res.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error("❌ GET SUBMISSIONS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @desc    Grade a submission (manual grading)
 * @route   PUT /api/assessments/submissions/:submissionId/grade
 * @access  Private (Teacher only)
 */
exports.gradeSubmission = async (req, res) => {
  console.log("\n=== GRADE SUBMISSION ===");
  console.log("👤 Teacher:", req.user.name);
  console.log("📝 Grading data:", req.body);

  try {
    const submission = await AssessmentSubmission.findById(
      req.params.submissionId
    ).populate("assessment");

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Check if teacher owns this assessment
    if (submission.assessment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to grade this submission",
      });
    }

    // Update answers with manual grading
    if (req.body.answers) {
      submission.answers = req.body.answers;
    }

    // Add teacher comments
    if (req.body.teacherComments) {
      submission.teacherComments = req.body.teacherComments;
    }

    submission.status = "graded";
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    // Recalculate score
    await submission.calculateScore();

    console.log("✅ Submission graded");
    console.log(
      `📊 Final Score: ${submission.score}/${submission.assessment.totalPoints}`
    );

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
 * @desc    Get my assessment submissions (student)
 * @route   GET /api/assessments/my-submissions
 * @access  Private (Student only)
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await AssessmentSubmission.find({
      student: req.user._id,
    })
      .populate({
        path: "assessment",
        select: "title type dueDate totalPoints",
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
 * @desc    Get assessment analytics
 * @route   GET /api/assessments/:id/analytics
 * @access  Private (Teacher only)
 */
exports.getAssessmentAnalytics = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found",
      });
    }

    // Check if teacher owns this assessment
    if (assessment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view analytics",
      });
    }

    const submissions = await AssessmentSubmission.find({
      assessment: req.params.id,
      status: "graded",
    });

    const analytics = {
      totalSubmissions: submissions.length,
      averageScore:
        submissions.reduce((sum, sub) => sum + sub.percentage, 0) /
        (submissions.length || 1),
      highestScore: Math.max(...submissions.map((sub) => sub.percentage), 0),
      lowestScore: Math.min(...submissions.map((sub) => sub.percentage), 100),
      passRate:
        (submissions.filter((sub) => sub.passed).length /
          (submissions.length || 1)) *
        100,
      scoreDistribution: {
        "90-100": submissions.filter((sub) => sub.percentage >= 90).length,
        "80-89": submissions.filter(
          (sub) => sub.percentage >= 80 && sub.percentage < 90
        ).length,
        "70-79": submissions.filter(
          (sub) => sub.percentage >= 70 && sub.percentage < 80
        ).length,
        "60-69": submissions.filter(
          (sub) => sub.percentage >= 60 && sub.percentage < 70
        ).length,
        "0-59": submissions.filter((sub) => sub.percentage < 60).length,
      },
      averageTimeSpent:
        submissions.reduce((sum, sub) => sum + sub.timeSpent, 0) /
        (submissions.length || 1),
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("❌ GET ANALYTICS ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
