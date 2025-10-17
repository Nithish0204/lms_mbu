const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");

// Public route
router.get("/", courseController.getCourses);

// Protected routes - require authentication
router.post("/", protect, authorize("Teacher"), courseController.createCourse);
router.get("/my-courses", protect, courseController.getMyCourses);
router.get("/:id", courseController.getCourse);
router.put(
  "/:id",
  protect,
  authorize("Teacher"),
  courseController.updateCourse
);
router.delete(
  "/:id",
  protect,
  authorize("Teacher"),
  courseController.deleteCourse
);

module.exports = router;
