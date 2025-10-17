const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide an assignment title"],
  },
  description: {
    type: String,
    required: [true, "Please provide assignment description"],
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
  instructions: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: [true, "Please provide a due date"],
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 100,
  },
  allowLateSubmission: {
    type: Boolean,
    default: false,
  },
  lateSubmissionPenalty: {
    type: Number,
    default: 10, // Percentage deduction per day
  },
  attachments: [
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
  status: {
    type: String,
    enum: ["draft", "published", "closed"],
    default: "draft",
  },
  submissionType: {
    type: String,
    enum: ["file", "text", "both"],
    default: "both",
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

// Update the updatedAt timestamp before saving
AssignmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
