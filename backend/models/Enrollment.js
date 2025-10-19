const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "completed", "dropped"],
    default: "active",
  },
  enrolledAt: { type: Date, default: Date.now },
});

// Create unique compound index on correct field names
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ student: 1, status: 1 });
EnrollmentSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
