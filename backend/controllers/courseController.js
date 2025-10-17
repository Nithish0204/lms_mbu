const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

exports.createCourse = async (req, res) => {
  console.log("=== CREATE COURSE REQUEST ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Authenticated user ID:", req.user._id);
  console.log("Authenticated user role:", req.user.role);

  try {
    // Add the authenticated user as the teacher
    const courseData = {
      ...req.body,
      teacher: req.user._id,
    };

    console.log("Course data to save:", JSON.stringify(courseData, null, 2));

    const course = new Course(courseData);
    await course.save();

    console.log("✅ Course saved successfully to MongoDB!");
    console.log("Course ID:", course._id);
    console.log("Course details:", JSON.stringify(course, null, 2));

    res.status(201).json({ success: true, course });
    console.log("✅ Response sent to frontend");
  } catch (error) {
    console.error("❌ CREATE COURSE ERROR:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(400).json({ success: false, error: error.message });
  }
  console.log("=== END CREATE COURSE REQUEST ===\n");
};

exports.getCourses = async (req, res) => {
  console.log("=== GET ALL COURSES REQUEST ===");

  try {
    const courses = await Course.find().populate("teacher", "name email");
    console.log(`✅ Found ${courses.length} courses in database`);
    console.log("Courses:", JSON.stringify(courses, null, 2));

    res.json({ success: true, courses });
    console.log("✅ Courses list sent to frontend");
  } catch (error) {
    console.error("❌ GET COURSES ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  console.log("=== END GET ALL COURSES REQUEST ===\n");
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "teacher",
      "name email"
    );
    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyCourses = async (req, res) => {
  console.log("=== GET MY COURSES REQUEST ===");
  console.log("Teacher ID:", req.user._id);

  try {
    const courses = await Course.find({ teacher: req.user._id }).populate(
      "teacher",
      "name email"
    );
    console.log(
      `✅ Found ${courses.length} courses for teacher ${req.user._id}`
    );
    console.log("Teacher's courses:", JSON.stringify(courses, null, 2));

    res.json({ success: true, courses });
    console.log("✅ Teacher's courses sent to frontend");
  } catch (error) {
    console.error("❌ GET MY COURSES ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  console.log("=== END GET MY COURSES REQUEST ===\n");
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Check if user is the course teacher
    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this course",
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, course: updatedCourse });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  console.log("=== DELETE COURSE REQUEST ===");
  console.log("Course ID to delete:", req.params.id);
  console.log("User requesting deletion:", req.user._id);

  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      console.log("❌ Course not found");
      return res
        .status(404)
        .json({ success: false, error: "Course not found" });
    }

    // Check if user is the course teacher
    if (course.teacher.toString() !== req.user._id.toString()) {
      console.log("❌ User not authorized to delete this course");
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this course",
      });
    }

    console.log("🔄 Deleting all enrollments for this course...");
    // Delete all enrollments for this course
    const deletedEnrollments = await Enrollment.deleteMany({
      course: req.params.id,
    });
    console.log(`✅ Deleted ${deletedEnrollments.deletedCount} enrollments`);

    console.log("🔄 Deleting course...");
    await course.deleteOne();
    console.log("✅ Course deleted successfully");

    res.json({
      success: true,
      message: "Course and all enrollments deleted successfully",
      deletedEnrollments: deletedEnrollments.deletedCount,
    });
  } catch (error) {
    console.error("❌ DELETE COURSE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
  console.log("=== END DELETE COURSE REQUEST ===\n");
};
