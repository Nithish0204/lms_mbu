const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "short-answer", "essay"],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ], // For multiple-choice and true-false
  correctAnswer: String, // For short-answer
  points: {
    type: Number,
    required: true,
    default: 1,
  },
  explanation: String, // Optional explanation for correct answer
});

const AssessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide an assessment title"],
  },
  description: {
    type: String,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["quiz", "test", "exam", "assignment"],
    required: true,
  },
  questions: [QuestionSchema],
  totalPoints: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  allowLateSubmission: {
    type: Boolean,
    default: false,
  },
  shuffleQuestions: {
    type: Boolean,
    default: false,
  },
  showAnswersAfterSubmission: {
    type: Boolean,
    default: true,
  },
  attemptsAllowed: {
    type: Number,
    default: 1,
  },
  passingScore: {
    type: Number,
    default: 60, // Percentage
  },
  instructions: String,
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total points before saving
AssessmentSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce(
      (sum, question) => sum + question.points,
      0
    );
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Assessment", AssessmentSchema);
