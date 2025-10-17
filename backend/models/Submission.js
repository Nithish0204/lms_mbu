const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  textSubmission: {
    type: String,
  },
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
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isLate: {
    type: Boolean,
    default: false,
  },
  grade: {
    type: Number,
    min: 0,
  },
  feedback: {
    type: String,
  },
  status: {
    type: String,
    enum: ["submitted", "graded", "returned"],
    default: "submitted",
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  gradedAt: {
    type: Date,
  },
});

// Check if submission is late
SubmissionSchema.pre("save", async function (next) {
  if (this.isNew) {
    const assignment = await mongoose
      .model("Assignment")
      .findById(this.assignment);
    if (assignment && new Date() > new Date(assignment.dueDate)) {
      this.isLate = true;
    }
  }
  next();
});

module.exports = mongoose.model("Submission", SubmissionSchema);
