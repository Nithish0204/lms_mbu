const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/auth");

// Protected routes
router.post(
  "/",
  protect,
  authorize("Teacher"),
  assignmentController.createAssignment
);
router.get("/", protect, assignmentController.getAssignments);
router.get("/my-assignments", protect, assignmentController.getMyAssignments);
// Mock quiz generation (Student-accessible; no storage)
router.post(
  "/:id/mock-quiz",
  protect,
  authorize("Student"),
  assignmentController.generateMockQuiz
);
router.get(
  "/course/:courseId",
  protect,
  assignmentController.getAssignmentsByCourse
);
router.get("/:id", protect, assignmentController.getAssignment);
router.put(
  "/:id",
  protect,
  authorize("Teacher"),
  assignmentController.updateAssignment
);
router.delete(
  "/:id",
  protect,
  authorize("Teacher"),
  assignmentController.deleteAssignment
);

module.exports = router;
