const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: String },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
CourseSchema.index({ teacher: 1, createdAt: -1 });
CourseSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Course", CourseSchema);
