const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { protect, authorize } = require("../middleware/auth");

// Protected routes - require authentication
router.post(
  "/",
  protect,
  authorize("Student"),
  enrollmentController.createEnrollment
);
router.get("/", protect, enrollmentController.getEnrollments);
router.get("/my-enrollments", protect, enrollmentController.getMyEnrollments);
router.get("/check/:courseId", protect, enrollmentController.checkEnrollment);
router.get(
  "/course/:courseId",
  protect,
  authorize("Teacher"),
  enrollmentController.getCourseEnrollments
);
router.delete("/:id", protect, enrollmentController.unenroll);

module.exports = router;
