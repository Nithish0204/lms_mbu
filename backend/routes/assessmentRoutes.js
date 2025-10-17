const express = require("express");
const router = express.Router();
const assessmentController = require("../controllers/assessmentController");
const { protect, authorize } = require("../middleware/auth");

// Teacher routes
router.post(
  "/",
  protect,
  authorize("Teacher"),
  assessmentController.createAssessment
);

router.put(
  "/:id",
  protect,
  authorize("Teacher"),
  assessmentController.updateAssessment
);

router.delete(
  "/:id",
  protect,
  authorize("Teacher"),
  assessmentController.deleteAssessment
);

router.get(
  "/:id/submissions",
  protect,
  authorize("Teacher"),
  assessmentController.getAssessmentSubmissions
);

router.get(
  "/:id/analytics",
  protect,
  authorize("Teacher"),
  assessmentController.getAssessmentAnalytics
);

router.put(
  "/submissions/:submissionId/grade",
  protect,
  authorize("Teacher"),
  assessmentController.gradeSubmission
);

// Student routes
router.post(
  "/:id/submit",
  protect,
  authorize("Student"),
  assessmentController.submitAssessment
);

router.get(
  "/my-submissions",
  protect,
  authorize("Student"),
  assessmentController.getMySubmissions
);

// Both roles
router.get(
  "/course/:courseId",
  protect,
  assessmentController.getAssessmentsByCourse
);
router.get("/:id", protect, assessmentController.getAssessment);

module.exports = router;
