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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-sm text-gray-600">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to={dashboardLink}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
              >
                Dashboard
              </Link>
              <Link
                to="/my-courses"
                className="text-primary-600 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition duration-150 border-b-2 border-primary-600"
              >
                My Courses
              </Link>
              <Link
                to="/live-classes"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Live Classes
              </Link>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-1"
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
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-150 flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-1"
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
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-600 mt-2">
            {user.role === "Teacher"
              ? "Manage and view your courses"
              : "View your enrolled courses"}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : courses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="h-24 w-24 mx-auto text-gray-300 mb-4"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No courses yet
            </h3>
            <p className="text-gray-600 mb-6">
              {user.role === "Teacher"
                ? "You haven't created any courses yet. Start by creating your first course!"
                : "You haven't enrolled in any courses yet. Browse available courses to get started!"}
            </p>
            {user.role === "Teacher" ? (
              <Link
                to="/create-course"
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition duration-150 shadow-sm"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Your First Course
              </Link>
            ) : (
              <Link
                to="/courses"
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition duration-150 shadow-sm"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Browse Courses
              </Link>
            )}
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((item) => {
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
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  {/* Course Header */}
                  <div className="h-32 bg-gradient-to-br from-primary-500 to-secondary-500 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="h-16 w-16 text-white opacity-30"
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
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description || "No description available"}
                    </p>

                    {/* Course Meta Info */}
                    <div className="space-y-2 mb-4">
                      {user.role === "Teacher" &&
                        enrollmentCounts[course._id] !== undefined && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg
                              className="h-4 w-4 mr-2"
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
                            <span>
                              {enrollmentCounts[course._id]} student
                              {enrollmentCounts[course._id] !== 1
                                ? "s"
                                : ""}{" "}
                              enrolled
                            </span>
                          </div>
                        )}
                      {course.teacher && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="h-4 w-4 mr-2"
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
                          <span>Instructor: {course.teacher.name}</span>
                        </div>
                      )}
                      {course.duration && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="h-4 w-4 mr-2"
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
                          <span>Duration: {course.duration}</span>
                        </div>
                      )}
                      {enrolledDate && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="h-4 w-4 mr-2"
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
                          <span>
                            Enrolled:{" "}
                            {new Date(enrolledDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {course.createdAt && user.role === "Teacher" && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="h-4 w-4 mr-2"
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
                          <span>
                            Created:{" "}
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {user.role === "Teacher" ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManageStudents(course)}
                          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition duration-150 flex items-center justify-center"
                        >
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
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition duration-150"
                        >
                          {deleting[course._id] ? (
                            <span className="flex items-center justify-center">
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
                            </span>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/student-dashboard`)}
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition duration-150"
                      >
                        View Dashboard
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
