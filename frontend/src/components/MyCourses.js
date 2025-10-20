import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { enrollmentAPI, courseAPI } from "../api";

const MyCourses = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [removingStudent, setRemovingStudent] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    console.log("=== [MyCourses] Component mounted ===");
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log("👤 [MyCourses] User:", parsedUser);
      setUser(parsedUser);
      fetchCourses(parsedUser.role);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchCourses = async (role) => {
    try {
      console.log(`📚 [MyCourses] Fetching courses for ${role}...`);
      if (role === "Student") {
        const response = await enrollmentAPI.getMyEnrollments();
        console.log("✅ [MyCourses] Enrolled courses:", response.data);
        setCourses(response.data.enrollments || []);
      } else if (role === "Teacher") {
        const response = await courseAPI.getMyCourses();
        console.log("✅ [MyCourses] Teacher courses:", response.data);
        const coursesData = response.data.courses || [];
        setCourses(coursesData);

        // Fetch enrollment counts for teacher
        fetchEnrollmentCounts(coursesData);
      }
    } catch (error) {
      console.error("❌ [MyCourses] Error fetching courses:", error);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentCounts = async (coursesData) => {
    console.log("=== [MyCourses] Fetching enrollment counts ===");
    const counts = {};

    for (const course of coursesData) {
      try {
        const response = await enrollmentAPI.getCourseEnrollments(course._id);
        counts[course._id] = response.data.count || 0;
      } catch (error) {
        console.error(
          `❌ Error fetching enrollments for course ${course._id}:`,
          error
        );
        counts[course._id] = 0;
      }
    }

    setEnrollmentCounts(counts);
    console.log("✅ [MyCourses] Enrollment counts loaded:", counts);
  };

  const handleManageStudents = async (course) => {
    console.log("🔍 [MyCourses] Managing students for course:", course.title);
    setSelectedCourse(course);
    setShowStudentsModal(true);
    setLoadingStudents(true);

    try {
      const response = await enrollmentAPI.getCourseEnrollments(course._id);
      console.log("✅ [MyCourses] Loaded enrolled students:", response.data);
      setEnrolledStudents(response.data.enrollments || []);
    } catch (error) {
      console.error("❌ [MyCourses] Error loading students:", error);
      setError("Failed to load enrolled students");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${studentName} from this course?`
      )
    ) {
      return;
    }

    console.log(
      `🗑️ [MyCourses] Removing student enrollment ${enrollmentId}...`
    );
    setRemovingStudent({ ...removingStudent, [enrollmentId]: true });

    try {
      await enrollmentAPI.removeStudentFromCourse(enrollmentId);
      console.log("✅ [MyCourses] Student removed successfully");

      // Update local state
      setEnrolledStudents(
        enrolledStudents.filter((enrollment) => enrollment._id !== enrollmentId)
      );

      // Update enrollment count
      if (selectedCourse) {
        setEnrollmentCounts({
          ...enrollmentCounts,
          [selectedCourse._id]: (enrollmentCounts[selectedCourse._id] || 1) - 1,
        });
      }

      setSuccessMessage(`${studentName} has been removed from the course`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ [MyCourses] Remove student error:", err);
      const errorMsg = err.response?.data?.error || "Failed to remove student";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setRemovingStudent({ ...removingStudent, [enrollmentId]: false });
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${courseTitle}"? This will also remove all student enrollments.`
      )
    ) {
      return;
    }

    console.log(`🗑️ [MyCourses] Deleting course ${courseId}...`);
    setDeleting({ ...deleting, [courseId]: true });
    setError("");
    setSuccessMessage("");

    try {
      await courseAPI.deleteCourse(courseId);
      console.log("✅ [MyCourses] Course deleted successfully");
      setSuccessMessage(`Course "${courseTitle}" deleted successfully!`);

      // Remove from local state
      setCourses(courses.filter((course) => course._id !== courseId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ [MyCourses] Delete error:", err);
      const errorMsg = err.response?.data?.error || "Failed to delete course";
      setError(errorMsg);

      // Clear error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      setDeleting({ ...deleting, [courseId]: false });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const dashboardLink =
    user.role === "Teacher" ? "/teacher-dashboard" : "/student-dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-md sticky top-0 z-50 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4">
          <div className="flex justify-between items-center">
            {/* Left section with back button and user info */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Back Button - Always visible */}
              <button
                onClick={() => navigate(dashboardLink)}
                className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                title="Back to Dashboard"
              >
                <svg
                  className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg flex items-center justify-center ring-2 ring-white">
                <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <span className="hidden md:inline">My Courses</span>
                  <span className="md:hidden">Courses</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">
                  {user.role === "Student"
                    ? "Enrolled Courses"
                    : "Your Created Courses"}
                </p>
              </div>
            </div>

            {/* Right section - Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 lg:space-x-2">
              <Link
                to="/browse-courses"
                className="flex items-center gap-1 text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all border border-transparent hover:border-primary-200"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Browse</span>
              </Link>
              {user.role === "Teacher" && (
                <Link
                  to="/create-course"
                  className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Create</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-2.5 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start shadow-md animate-fade-in">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900 text-xs sm:text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start shadow-md animate-fade-in">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-900 text-xs sm:text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            My Courses
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm flex items-center gap-2">
            <span className="inline-flex items-center bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-semibold">
              {courses.length} courses
            </span>
            <span className="hidden sm:inline">
              {user.role === "Student"
                ? "Your enrolled courses"
                : "Courses you've created"}
            </span>
            <span className="sm:hidden">
              {user.role === "Teacher"
                ? "Manage and view your courses"
                : "View your enrolled courses"}
            </span>
            <span className="sm:hidden">
              {user.role === "Teacher" ? "Manage courses" : "Enrolled courses"}
            </span>
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 animate-fade-in">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-primary-500 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 font-medium mt-4">
              Loading your courses...
            </p>
          </div>
        ) : courses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center animate-fade-in">
            <div className="h-28 w-28 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
              <svg
                className="h-16 w-16 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">
              No courses yet
            </h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              {user.role === "Teacher"
                ? "You haven't created any courses yet. Start by creating your first course!"
                : "You haven't enrolled in any courses yet. Browse available courses to get started!"}
            </p>
            {user.role === "Teacher" ? (
              <Link
                to="/create-course"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-lg"
              >
                <svg
                  className="h-6 w-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Your First Course
              </Link>
            ) : (
              <Link
                to="/courses"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-lg"
              >
                <svg
                  className="h-6 w-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Browse Courses
              </Link>
            )}
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {courses.map((item, idx) => {
              // For students: item is enrollment with course object
              // For teachers: item is the course itself
              const course = user.role === "Student" ? item.course : item;
              const enrolledDate =
                user.role === "Student" ? item.enrolledAt : null;

              // Skip if course is null (deleted course)
              if (!course) {
                return null;
              }

              return (
                <div
                  key={user.role === "Student" ? item._id : course._id}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 sm:hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Course Header */}
                  <div className="h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 relative overflow-hidden">
                    {user.role === "Student" && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="inline-flex items-center px-3 py-1.5 bg-success-500 text-white text-xs font-bold rounded-full shadow-lg">
                          <svg
                            className="h-3.5 w-3.5 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Enrolled
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="h-24 w-24 text-white opacity-20 group-hover:opacity-30 transition-opacity group-hover:scale-110 transform transition-transform duration-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  {/* Course Content */}
                  <div className="p-4 sm:p-5 lg:p-6">
                    <h3 className="text-base sm:text-lg lg:text-xl font-display font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {course.description || "No description available"}
                    </p>

                    {/* Course Meta Info */}
                    <div className="flex flex-col space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {user.role === "Teacher" &&
                        enrollmentCounts[course._id] !== undefined && (
                          <div className="flex items-center text-xs sm:text-sm">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-primary-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0">
                              <svg
                                className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 font-medium">
                              {enrollmentCounts[course._id]} student
                              {enrollmentCounts[course._id] !== 1
                                ? "s"
                                : ""}{" "}
                              enrolled
                            </span>
                          </div>
                        )}
                      {course.teacher && (
                        <div className="flex items-center text-sm">
                          <div className="h-8 w-8 bg-secondary-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                            <svg
                              className="h-4 w-4 text-secondary-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-medium">
                            {course.teacher.name}
                          </span>
                        </div>
                      )}
                      {course.duration && (
                        <div className="flex items-center text-sm">
                          <div className="h-8 w-8 bg-accent-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                            <svg
                              className="h-4 w-4 text-accent-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-medium">
                            {course.duration}
                          </span>
                        </div>
                      )}
                      {enrolledDate && (
                        <div className="flex items-center text-sm">
                          <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                            <svg
                              className="h-4 w-4 text-success-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-medium">
                            Enrolled{" "}
                            {new Date(enrolledDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {course.createdAt && user.role === "Teacher" && (
                        <div className="flex items-center text-sm">
                          <div className="h-8 w-8 bg-warning-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                            <svg
                              className="h-4 w-4 text-warning-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-medium">
                            Created{" "}
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {user.role === "Teacher" ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleManageStudents(course)}
                          className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center"
                        >
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          Manage
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteCourse(course._id, course.title)
                          }
                          disabled={deleting[course._id]}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {deleting[course._id] ? (
                            <svg
                              className="animate-spin h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/student-dashboard`)}
                        className="w-full inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        View Dashboard
                        <svg
                          className="h-5 w-5 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Students Management Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Enrolled Students - {selectedCourse?.title}
              </h2>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {loadingStudents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading students...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="h-16 w-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    No students enrolled yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Students will appear here once they enroll in this course
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                    <p className="text-primary-800 font-medium">
                      Total Enrolled: {enrolledStudents.length} student
                      {enrolledStudents.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {enrolledStudents.map((enrollment) => (
                    <div
                      key={enrollment._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Student Avatar */}
                        <div className="h-12 w-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {enrollment.student?.name
                              ?.charAt(0)
                              .toUpperCase() || "S"}
                          </span>
                        </div>
                        {/* Student Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {enrollment.student?.name || "Unknown Student"}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {enrollment.student?.email || "No email"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Enrolled on{" "}
                            {new Date(
                              enrollment.enrolledAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {/* Remove Button */}
                      <button
                        onClick={() =>
                          handleRemoveStudent(
                            enrollment._id,
                            enrollment.student?.name || "this student"
                          )
                        }
                        disabled={removingStudent[enrollment._id]}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
                      >
                        {removingStudent[enrollment._id] ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Removing...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowStudentsModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
