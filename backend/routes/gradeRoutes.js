const express = require("express");
const router = express.Router();
const gradeController = require("../controllers/gradeController");
const { protect, authorize } = require("../middleware/auth");

// Protected routes
router.post(
  "/:submissionId",
  protect,
  authorize("Teacher"),
  gradeController.gradeSubmission
);
router.put(
  "/:submissionId",
  protect,
  authorize("Teacher"),
  gradeController.updateGrade
);
router.get("/", protect, gradeController.getGrades);
router.get(
  "/my-grades",
  protect,
  authorize("Student"),
  gradeController.getMyGrades
);

module.exports = router;
