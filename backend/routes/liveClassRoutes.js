const express = require("express");
const router = express.Router();
const {
  createLiveClass,
  getCourseLiveClasses,
  getMyLiveClasses,
  getMyScheduledClasses,
  joinLiveClass,
  endLiveClass,
  deleteLiveClass,
} = require("../controllers/liveClassController");
const { protect, authorize } = require("../middleware/auth");

// Teacher routes
router.post("/", protect, authorize("Teacher"), createLiveClass);
router.get(
  "/my-scheduled",
  protect,
  authorize("Teacher"),
  getMyScheduledClasses
);
router.put("/:id/end", protect, authorize("Teacher"), endLiveClass);
router.delete("/:id", protect, authorize("Teacher"), deleteLiveClass);

// Student routes
router.get("/my-classes", protect, authorize("Student"), getMyLiveClasses);

// Both roles
router.get("/course/:courseId", protect, getCourseLiveClasses);
router.get("/:id/join", protect, joinLiveClass);

module.exports = router;
