const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answer: mongoose.Schema.Types.Mixed, // Can be string, number, or array
  isCorrect: Boolean,
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  feedback: String, // Teacher's feedback for manual grading
});

const AssessmentSubmissionSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answers: [AnswerSchema],
  score: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  passed: {
    type: Boolean,
    default: false,
  },
  attemptNumber: {
    type: Number,
    default: 1,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
  },
  timeSpent: {
    type: Number, // Time spent in minutes
    default: 0,
  },
  status: {
    type: String,
    enum: ["in-progress", "submitted", "graded", "late"],
    default: "in-progress",
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  gradedAt: {
    type: Date,
  },
  teacherComments: String,
  // For file uploads (assignments)
  files: [
    {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Calculate score and percentage before saving
AssessmentSubmissionSchema.pre("save", function (next) {
  if (this.submittedAt) {
    // Calculate time spent
    const timeSpentMs = this.submittedAt - this.startedAt;
    this.timeSpent = Math.round(timeSpentMs / 60000); // Convert to minutes
  }
  next();
});

// Method to calculate score
AssessmentSubmissionSchema.methods.calculateScore = async function () {
  const assessment = await mongoose
    .model("Assessment")
    .findById(this.assessment);

  let totalPoints = 0;
  this.answers.forEach((answer) => {
    totalPoints += answer.pointsAwarded || 0;
  });

  this.score = totalPoints;
  this.percentage =
    assessment.totalPoints > 0
      ? Math.round((totalPoints / assessment.totalPoints) * 100)
      : 0;
  this.passed = this.percentage >= assessment.passingScore;

  return this.save();
};

module.exports = mongoose.model(
  "AssessmentSubmission",
  AssessmentSubmissionSchema
);
