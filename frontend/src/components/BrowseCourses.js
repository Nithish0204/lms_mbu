import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { courseAPI, enrollmentAPI } from "../api";

const BrowseCourses = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEnrolled, setFilterEnrolled] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("=== [BrowseCourses] Component mounted ===");
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log("👤 [BrowseCourses] User:", parsedUser);
      setUser(parsedUser);
      fetchCourses();
      fetchEnrolledCourses();
    } else {
      console.log("❌ [BrowseCourses] No user data, redirecting to login");
      navigate("/login");
    }
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      console.log("📚 [BrowseCourses] Fetching all courses...");
      const response = await courseAPI.getAllCourses();
      console.log("✅ [BrowseCourses] Courses fetched:", response.data);
      setCourses(response.data.courses || []);
    } catch (err) {
      console.error("❌ [BrowseCourses] Error fetching courses:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      console.log("📝 [BrowseCourses] Fetching enrolled courses...");
      const response = await enrollmentAPI.getMyEnrollments();
      console.log("✅ [BrowseCourses] Enrollments fetched:", response.data);
      const enrolledIds =
        response.data.enrollments?.map((e) => e.course._id) || [];
      console.log("📋 [BrowseCourses] Enrolled course IDs:", enrolledIds);
      setEnrolledCourseIds(enrolledIds);
    } catch (err) {
      console.error("❌ [BrowseCourses] Error fetching enrollments:", err);
    }
  };

  const handleEnroll = async (courseId, courseTitle) => {
    console.log(`=== [BrowseCourses] Enrolling in course ${courseId} ===`);
    setEnrolling((prev) => ({ ...prev, [courseId]: true }));
    setError("");
    setSuccessMessage("");

    try {
      const response = await enrollmentAPI.enroll(courseId);
      console.log("✅ [BrowseCourses] Enrollment successful:", response.data);
      setSuccessMessage(`Successfully enrolled in "${courseTitle}"!`);
      setEnrolledCourseIds((prev) => [...prev, courseId]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ [BrowseCourses] Enrollment error:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to enroll in course";
      setError(errorMsg);

      // Clear error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleLogout = () => {
    console.log("=== [BrowseCourses] Logout initiated ===");
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

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const isEnrolled = enrolledCourseIds.includes(course._id);

    if (filterEnrolled === "enrolled") return matchesSearch && isEnrolled;
    if (filterEnrolled === "available") return matchesSearch && !isEnrolled;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-md sticky top-0 z-50 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4">
          <div className="flex justify-between items-center">
            {/* Left section with back button and user info */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Back Button - Always visible */}
              <button
                onClick={() =>
                  navigate(
                    user.role === "Student"
                      ? "/student-dashboard"
                      : "/teacher-dashboard"
                  )
                }
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

              <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg flex items-center justify-center ring-2 ring-white">
                <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <span className="hidden md:inline">Browse Courses</span>
                  <span className="md:hidden">Courses</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">
                  Discover & Enroll
                </p>
              </div>
            </div>

            {/* Right section - Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 lg:space-x-2">
              <Link
                to="/my-courses"
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="hidden sm:inline">My Courses</span>
              </Link>
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
          <div className="mb-4 sm:mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center animate-fade-in shadow-md">
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
            <span className="font-semibold text-green-800 text-xs sm:text-sm">
              {successMessage}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center animate-fade-in shadow-md">
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
            <span className="font-semibold text-red-800 text-xs sm:text-sm">
              {error}
            </span>
          </div>
        )}

        {/* Page Header with Stats */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Discover Courses
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                <span className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                  {courses.length} courses
                </span>
                <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-semibold">
                  {enrolledCourseIds.length} enrolled
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => setFilterEnrolled("all")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                  filterEnrolled === "all"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterEnrolled("available")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                  filterEnrolled === "available"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setFilterEnrolled("enrolled")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                  filterEnrolled === "enrolled"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                Enrolled
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 lg:py-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
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
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : courses.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No courses available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for new courses!
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          /* No Results */
          <div className="text-center py-16 animate-fade-in">
            <div className="h-24 w-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-12 w-12 text-gray-400"
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
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Try adjusting your filters"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          /* Courses Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredCourses.map((course, idx) => {
              const isEnrolled = enrolledCourseIds.includes(course._id);
              const isEnrollingThisCourse = enrolling[course._id];

              return (
                <div
                  key={course._id}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 sm:hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Course Header with gradient */}
                  <div className="h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 relative overflow-hidden">
                    {isEnrolled && (
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                        <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-success-500 text-white text-xs font-bold rounded-full shadow-md sm:shadow-lg">
                          <svg
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="hidden sm:inline">Enrolled</span>
                          <span className="sm:hidden">✓</span>
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white opacity-20 group-hover:opacity-30 transition-opacity group-hover:scale-110 transform transition-transform duration-500"
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
                    <div className="flex flex-col space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                      {course.teacher && (
                        <div className="flex items-center text-xs sm:text-sm">
                          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-primary-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-medium truncate">
                            {course.teacher.name}
                          </span>
                        </div>
                      )}
                      {course.duration && (
                        <div className="flex items-center text-xs sm:text-sm">
                          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-secondary-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2">
                            <svg
                              className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-600"
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
                    </div>

                    {/* Enroll Button */}
                    {isEnrolled ? (
                      <Link
                        to="/my-courses"
                        className="w-full inline-flex items-center justify-center bg-success-50 text-success-700 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-success-100 transition-all group border-2 border-success-200"
                      >
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="hidden sm:inline">View Course</span>
                        <span className="sm:hidden">View</span>
                        <svg
                          className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform"
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
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course._id, course.title)}
                        disabled={isEnrollingThisCourse}
                        className="w-full inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all shadow-md sm:shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isEnrollingThisCourse ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
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
                            <span className="hidden sm:inline">
                              Enrolling...
                            </span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
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
                            <span className="hidden sm:inline">Enroll Now</span>
                            <span className="sm:hidden">Enroll</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseCourses;
