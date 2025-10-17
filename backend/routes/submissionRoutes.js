const express = require("express");
const router = express.Router();
const {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
  getSubmission,
  deleteSubmission,
  downloadFile,
} = require("../controllers/submissionController");
const { protect, authorize } = require("../middleware/auth");

// Student routes
router.post("/", protect, authorize("Student"), submitAssignment);
router.get("/my-submissions", protect, authorize("Student"), getMySubmissions);
router.delete("/:id", protect, authorize("Student"), deleteSubmission);

// Teacher routes
router.get(
  "/assignment/:assignmentId",
  protect,
  authorize("Teacher"),
  getAssignmentSubmissions
);
router.put("/:id/grade", protect, authorize("Teacher"), gradeSubmission);

// Shared routes (Teacher and Student)
router.get("/:id", protect, getSubmission);
router.get("/:id/download/:fileIndex", protect, downloadFile);

module.exports = router;
