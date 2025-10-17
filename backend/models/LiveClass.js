const mongoose = require("mongoose");

const LiveClassSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: [true, "Please provide a title for the live class"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  scheduledAt: {
    type: Date,
    required: [true, "Please provide a scheduled time"],
  },
  duration: {
    type: Number, // in minutes
    required: [true, "Please provide duration in minutes"],
    min: [15, "Duration must be at least 15 minutes"],
    max: [240, "Duration cannot exceed 240 minutes (4 hours)"],
  },
  agoraChannel: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "live", "ended", "cancelled"],
    default: "scheduled",
  },
  recordingUrl: {
    type: String,
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      leftAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
LiveClassSchema.index({ course: 1, scheduledAt: -1 });
LiveClassSchema.index({ teacher: 1, scheduledAt: -1 });
LiveClassSchema.index({ status: 1, scheduledAt: 1 });

// Virtual for checking if class is upcoming
LiveClassSchema.virtual("isUpcoming").get(function () {
  return this.scheduledAt > new Date() && this.status === "scheduled";
});

// Virtual for checking if class is currently live
LiveClassSchema.virtual("isLive").get(function () {
  const now = new Date();
  const endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
  return this.scheduledAt <= now && now <= endTime && this.status === "live";
});

module.exports = mongoose.model("LiveClass", LiveClassSchema);
