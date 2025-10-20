import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  enrollmentAPI,
  courseAPI,
  liveClassAPI,
  assignmentAPI,
  submissionAPI,
} from "../api";

const StudentDashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("=== [StudentDashboard] Component mounted ===");
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    console.log(
      "📦 [StudentDashboard] Retrieved from localStorage:",
      userData ? "User data found" : "No user data"
    );

    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log(
        "👤 [StudentDashboard] Parsed user:",
        JSON.stringify(parsedUser, null, 2)
      );
      setUser(parsedUser);
      console.log("✅ [StudentDashboard] User state set");
      fetchDashboardData();
    } else {
      console.log("❌ [StudentDashboard] No user data, redirecting to login");
      navigate("/login");
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      console.log(
        "📚 [StudentDashboard] Fetching all dashboard data in parallel..."
      );
      const startTime = performance.now();

      // Fetch all data in parallel using Promise.allSettled to avoid waterfall
      const [
        enrollmentResult,
        coursesResult,
        liveClassResult,
        assignmentsResult,
        submissionsResult,
      ] = await Promise.allSettled([
        enrollmentAPI.getMyEnrollments(),
        courseAPI.getAllCourses(),
        liveClassAPI.getMyLiveClasses(),
        assignmentAPI.getMyAssignments(),
        submissionAPI.getMySubmissions(),
      ]);

      const endTime = performance.now();
      console.log(
        `⚡ [StudentDashboard] All data fetched in ${Math.round(
          endTime - startTime
        )}ms`
      );

      // Handle enrollment data
      if (enrollmentResult.status === "fulfilled") {
        const validEnrollments = (
          enrollmentResult.value.data.enrollments || []
        ).filter((enrollment) => enrollment.course !== null);
        setEnrolledCourses(validEnrollments);
        console.log("✅ Enrollments:", validEnrollments.length);
      } else {
        console.error("❌ Enrollments failed:", enrollmentResult.reason);
      }

      // Handle courses data
      if (coursesResult.status === "fulfilled") {
        setAvailableCourses(coursesResult.value.data.courses || []);
        console.log(
          "✅ Courses:",
          coursesResult.value.data.courses?.length || 0
        );
      } else {
        console.error("❌ Courses failed:", coursesResult.reason);
      }

      // Handle live classes data
      if (liveClassResult.status === "fulfilled") {
        setLiveClasses(liveClassResult.value.data.liveClasses || []);
        console.log(
          "✅ Live classes:",
          liveClassResult.value.data.liveClasses?.length || 0
        );
      } else {
        console.error("❌ Live classes failed:", liveClassResult.reason);
      }

      // Handle assignments data
      if (assignmentsResult.status === "fulfilled") {
        setAssignments(assignmentsResult.value.data.assignments || []);
        console.log(
          "✅ Assignments:",
          assignmentsResult.value.data.assignments?.length || 0
        );
      } else {
        console.error("❌ Assignments failed:", assignmentsResult.reason);
      }

      // Handle submissions data
      if (submissionsResult.status === "fulfilled") {
        setMySubmissions(submissionsResult.value.data.submissions || []);
        console.log(
          "✅ Submissions:",
          submissionsResult.value.data.submissions?.length || 0
        );
      } else {
        console.error("❌ Submissions failed:", submissionsResult.reason);
      }
    } catch (error) {
      console.error("❌ [StudentDashboard] Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("=== [StudentDashboard] Logout initiated ===");
    console.log("🗑️ [StudentDashboard] Clearing localStorage...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("✅ [StudentDashboard] localStorage cleared");
    console.log("🚀 [StudentDashboard] Navigating to login page");
    navigate("/login");
  };

  const isAssignmentSubmitted = (assignmentId) => {
    return mySubmissions.some(
      (submission) => submission.assignment._id === assignmentId
    );
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return mySubmissions.find(
      (submission) => submission.assignment._id === assignmentId
    );
  };

  const isAssignmentLate = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header - Compact & Responsive */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* User Avatar - Smaller on mobile */}
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* User Info - Truncated on mobile */}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl lg:text-2xl font-display font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  Welcome, {user.name.split(" ")[0]}! 👋
                </h1>
                <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-0.5">
                  <span className="flex items-center bg-primary-50 px-2 py-0.5 rounded-lg">
                    <svg
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-primary-600"
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
                    <span className="font-semibold text-primary-700">
                      Student
                    </span>
                  </span>
                  <span className="hidden lg:flex items-center text-gray-500 truncate max-w-xs">
                    <svg
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0"
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
                    <span className="truncate">{user.email}</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Right side - Navigation & Logout */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Toggle menu"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div
                className={`${
                  menuOpen ? "flex" : "hidden"
                } lg:flex flex-col lg:flex-row absolute lg:relative top-full left-0 right-0 lg:top-auto bg-white lg:bg-transparent shadow-lg lg:shadow-none border-b lg:border-0 gap-1 p-2 lg:p-0 lg:gap-2 z-50`}
              >
                <Link
                  to="/student-dashboard"
                  className="text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 text-center whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-courses"
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 text-center whitespace-nowrap"
                >
                  My Courses
                </Link>
                <Link
                  to="/live-classes"
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center whitespace-nowrap"
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
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Live Classes</span>
                  <span className="sm:hidden">Classes</span>
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center whitespace-nowrap"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center justify-center font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 text-xs sm:text-sm whitespace-nowrap"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Banner - Compact & Responsive */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white animate-fade-in-up overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-display font-bold mb-1 sm:mb-2">
              Ready to continue learning?
            </h2>
            <p className="text-primary-100 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
              Track your progress and stay on top of your assignments
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-primary-700 rounded-lg sm:rounded-xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
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
                Explore Courses
              </Link>
              <Link
                to="/my-assignments"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 border-2 border-white/30 text-sm sm:text-base"
              >
                View Assignments
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Enrolled Courses Card */}
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border border-gray-100"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white"
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
            <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1">
              <span className="hidden sm:inline">Enrolled Courses</span>
              <span className="sm:hidden">Courses</span>
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900">
              {enrolledCourses.length}
            </p>
            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-primary-600 font-medium">
              <Link
                to="/my-courses"
                className="hover:text-primary-700 flex items-center"
              >
                <span className="hidden sm:inline">View all</span>
                <span className="sm:hidden">View</span>
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
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
            </div>
          </div>

          {/* Pending Assignments Card */}
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border border-gray-100"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-secondary-500/30">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1">
              <span className="hidden sm:inline">Pending Work</span>
              <span className="sm:hidden">Pending</span>
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900">
              {
                assignments.filter(
                  (a) =>
                    a.status === "published" && !isAssignmentSubmitted(a._id)
                ).length
              }
            </p>
            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-secondary-600 font-medium">
              <Link
                to="/my-assignments"
                className="hover:text-secondary-700 flex items-center"
              >
                <span className="hidden sm:inline">View tasks</span>
                <span className="sm:hidden">View</span>
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
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
            </div>
          </div>

          {/* Graded Submissions Card */}
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border border-gray-100"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gradient-to-br from-success-500 to-success-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-success-500/30">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1">
              Graded
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900">
              {
                mySubmissions.filter(
                  (s) => s.grade !== null && s.grade !== undefined
                ).length
              }
              <span className="text-lg sm:text-xl lg:text-2xl text-gray-400">
                /{mySubmissions.length}
              </span>
            </p>
            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-success-600 font-medium">
              <Link
                to="/grades"
                className="hover:text-success-700 flex items-center"
              >
                <span className="hidden sm:inline">View grades</span>
                <span className="sm:hidden">View</span>
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
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
            </div>
          </div>

          {/* Live Classes Card */}
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border border-gray-100"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white"
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
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1">
              <span className="hidden sm:inline">Upcoming Classes</span>
              <span className="sm:hidden">Classes</span>
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900">
              {liveClasses.length}
            </p>
            <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-accent-600 font-medium">
              <Link
                to="/live-classes"
                className="hover:text-accent-700 flex items-center"
              >
                <span className="hidden sm:inline">Join now</span>
                <span className="sm:hidden">Join</span>
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 ml-1"
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
            </div>
          </div>
        </div>

        {/* Quick Actions - Compact & Responsive */}
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-gray-100 animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-gray-900">
              Quick Actions
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
              Navigate faster
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <Link
              to="/courses"
              className="group flex flex-col items-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-primary-200 hover:border-primary-400"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white"
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
              <p className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-center text-xs sm:text-sm lg:text-base">
                Browse Courses
              </p>
              <p className="text-xs text-gray-600 text-center hidden sm:block">
                Discover new learning
              </p>
            </Link>

            <Link
              to="/my-assignments"
              className="group flex flex-col items-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-secondary-50 to-secondary-100/50 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-secondary-200 hover:border-secondary-400"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-center text-xs sm:text-sm lg:text-base">
                Assignments
              </p>
              <p className="text-xs text-gray-600 text-center hidden sm:block">
                View pending work
              </p>
            </Link>

            <Link
              to="/live-classes"
              className="group flex flex-col items-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-accent-50 to-accent-100/50 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-accent-200 hover:border-accent-400"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white"
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
              </div>
              <p className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-center text-xs sm:text-sm lg:text-base">
                Live Classes
              </p>
              <p className="text-xs text-gray-600 text-center hidden sm:block">
                Join sessions
              </p>
            </Link>

            <Link
              to="/grades"
              className="group flex flex-col items-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-success-50 to-success-100/50 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-success-200 hover:border-success-400"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 bg-gradient-to-br from-success-500 to-success-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-center text-xs sm:text-sm lg:text-base">
                View Grades
              </p>
              <p className="text-xs text-gray-600 text-center hidden sm:block">
                Track performance
              </p>
            </Link>
          </div>
        </div>

        {/* Upcoming Assignments Section - Compact & Responsive */}
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-gray-100 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-gray-900 mb-1">
                Upcoming Assignments
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Stay on top of your deadlines
              </p>
            </div>
            <Link
              to="/my-assignments"
              className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-50 text-primary-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-100 transition-all duration-200 whitespace-nowrap"
            >
              View All
              <svg
                className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4"
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
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-10 w-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700">
                No assignments yet
              </p>
              <p className="text-sm mt-2">
                Assignments will appear here once your teachers create them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments
                .filter((assignment) => assignment.status === "published")
                .slice(0, 5)
                .map((assignment, idx) => {
                  const submitted = isAssignmentSubmitted(assignment._id);
                  const submission = getSubmissionForAssignment(assignment._id);
                  const isLate = isAssignmentLate(assignment.dueDate);

                  return (
                    <div
                      key={assignment._id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                      style={{ animationDelay: `${0.1 * idx}s` }}
                    >
                      <div className="flex-1 w-full sm:w-auto mb-4 sm:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                              submitted
                                ? "bg-success-100"
                                : isLate
                                ? "bg-accent-100"
                                : "bg-primary-100"
                            }`}
                          >
                            <svg
                              className={`h-5 w-5 ${
                                submitted
                                  ? "text-success-600"
                                  : isLate
                                  ? "text-accent-600"
                                  : "text-primary-600"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {assignment.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {assignment.course?.title || "Course"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 ml-13">
                          {submitted && (
                            <span className="inline-flex items-center px-3 py-1 bg-success-100 text-success-700 text-xs font-bold rounded-full">
                              <svg
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Submitted
                            </span>
                          )}
                          {!submitted && isLate && (
                            <span className="inline-flex items-center px-3 py-1 bg-accent-100 text-accent-700 text-xs font-bold rounded-full">
                              <svg
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Overdue
                            </span>
                          )}
                          {!submitted && !isLate && (
                            <span className="inline-flex items-center px-3 py-1 bg-warning-100 text-warning-700 text-xs font-bold rounded-full">
                              <svg
                                className="h-3.5 w-3.5 mr-1"
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
                              Pending
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            <span className="font-semibold">Due:</span>{" "}
                            {formatDate(assignment.dueDate)}
                          </span>
                          <span className="text-sm font-bold text-primary-600">
                            {assignment.totalPoints} points
                          </span>
                        </div>
                        {submitted && submission && (
                          <div className="mt-3 ml-13">
                            {submission.grade !== null &&
                            submission.grade !== undefined ? (
                              <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-success-50 to-success-100 rounded-lg">
                                <svg
                                  className="h-4 w-4 text-success-600 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                  />
                                </svg>
                                <span className="text-sm font-bold text-success-700">
                                  Grade: {submission.grade}/
                                  {assignment.totalPoints}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                Submitted on{" "}
                                {formatDate(submission.submittedAt)} • Awaiting
                                grade
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-0 sm:ml-6 w-full sm:w-auto">
                        {submitted ? (
                          <Link
                            to={`/my-assignments`}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200"
                          >
                            View Details
                            <svg
                              className="ml-2 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>
                        ) : (
                          <Link
                            to={`/submit-assignment/${assignment._id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl group-hover:scale-105"
                          >
                            Submit Now
                            <svg
                              className="ml-2 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              {assignments.filter((a) => a.status === "published").length >
                5 && (
                <div className="text-center pt-4">
                  <Link
                    to="/my-assignments"
                    className="inline-flex items-center px-6 py-3 bg-primary-50 text-primary-700 rounded-xl text-sm font-bold hover:bg-primary-100 transition-all duration-200"
                  >
                    View all{" "}
                    {assignments.filter((a) => a.status === "published").length}{" "}
                    assignments
                    <svg
                      className="ml-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recently Enrolled Courses
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p>No enrolled courses yet</p>
              <p className="text-sm mt-2">
                <Link
                  to="/courses"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Browse courses
                </Link>{" "}
                to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.slice(0, 5).map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-primary-600"
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
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {enrollment.course?.title || "Untitled Course"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Enrolled on{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/my-courses"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View →
                  </Link>
                </div>
              ))}
              {enrolledCourses.length > 5 && (
                <div className="text-center pt-2">
                  <Link
                    to="/my-courses"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all {enrolledCourses.length} courses →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Classes Section */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Live Classes</h2>
          {liveClasses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-gray-500">
              No live classes scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveClasses.map((lc) => (
                <div
                  key={lc._id}
                  className="bg-white rounded-lg shadow p-6 flex flex-col"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {lc.title}
                  </h3>
                  <p className="text-gray-600 mb-1">
                    Course: {lc.course?.title}
                  </p>
                  <p className="text-gray-600 mb-1">
                    Teacher: {lc.teacher?.name}
                  </p>
                  <p className="text-gray-500 text-sm mb-2">
                    Scheduled: {new Date(lc.scheduledAt).toLocaleString()}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                      lc.status === "live"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {lc.status === "live" ? "LIVE" : "Scheduled"}
                  </span>
                  <Link
                    to={`/video-call/${lc._id}`}
                    className="mt-auto bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 shadow-sm text-center"
                  >
                    Join Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
