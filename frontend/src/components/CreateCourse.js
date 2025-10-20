import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { courseAPI } from "../api";

const CreateCourse = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Check if user is a teacher
      if (parsedUser.role !== "Teacher") {
        navigate("/student-dashboard");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="h-10 sm:h-12 lg:h-14 w-10 sm:w-12 lg:w-14 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center group hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-base sm:text-lg lg:text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-xl lg:text-2xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                  {user.name}
                </h1>
                <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center font-medium">
                    <svg
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-secondary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Teacher
                  </span>
                  <span className="text-gray-400 hidden md:inline">•</span>
                  <span className="hidden md:flex items-center">
                    <svg
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400"
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
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Link
                to="/teacher-dashboard"
                className="text-gray-700 hover:text-primary-600 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all hover:bg-gray-100"
              >
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center font-medium text-xs sm:text-sm"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1"
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
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12 animate-fade-in border border-gray-100">
          {/* Header with Icon */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg animate-scale-in">
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white"
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
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Create New Course</span>
              <span className="sm:hidden">New Course</span>
            </h2>
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg">
              <span className="hidden sm:inline">
                Fill in the details to create a new course for your students
              </span>
              <span className="sm:hidden">Course details</span>
            </p>
          </div>

          <form
            className="space-y-4 sm:space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              console.log("=== [CreateCourse] Form submission started ===");

              setError("");
              setSuccess("");
              setLoading(true);

              try {
                // Validate duration format
                if (!form.duration.trim()) {
                  throw new Error("Duration is required");
                }

                const courseData = {
                  title: form.title,
                  description: form.description,
                  duration: form.duration,
                };

                console.log(
                  "📤 [CreateCourse] Submitting course data:",
                  JSON.stringify(courseData, null, 2)
                );
                console.log(
                  "🔑 [CreateCourse] Token from localStorage:",
                  localStorage.getItem("token") ? "Present" : "Missing"
                );

                // Call backend API using the API module
                console.log(
                  "🔄 [CreateCourse] Calling courseAPI.createCourse..."
                );
                const response = await courseAPI.createCourse(courseData);

                console.log(
                  "✅ [CreateCourse] API response received:",
                  JSON.stringify(response.data, null, 2)
                );
                console.log("✅ [CreateCourse] Course created successfully!");
                console.log(
                  "📋 [CreateCourse] New course ID:",
                  response.data.course?._id
                );

                setSuccess("Course created successfully!");
                setForm({ title: "", description: "", duration: "" });

                console.log(
                  "⏱️ [CreateCourse] Waiting 1.5 seconds before navigation..."
                );
                setTimeout(() => {
                  console.log(
                    "🚀 [CreateCourse] Navigating to teacher dashboard"
                  );
                  navigate("/teacher-dashboard");
                }, 1500);
              } catch (err) {
                console.error("❌ [CreateCourse] Error occurred:", err);
                console.error(
                  "❌ [CreateCourse] Error response:",
                  err.response?.data
                );
                console.error("❌ [CreateCourse] Error message:", err.message);
                console.error(
                  "❌ [CreateCourse] Full error:",
                  JSON.stringify(err, null, 2)
                );

                // Show full Axios error details for debugging
                setError(
                  (err.response &&
                    JSON.stringify(err.response.data, null, 2)) ||
                    err.message ||
                    "Failed to create course. Please try again."
                );
              } finally {
                setLoading(false);
                console.log(
                  "=== [CreateCourse] Form submission completed ===\n"
                );
              }
            }}
          >
            {/* Course Title */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <label
                htmlFor="title"
                className="flex items-center text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Course Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="input-field"
                  placeholder="e.g., Introduction to Web Development"
                  required
                />
              </div>
            </div>

            {/* Course Description */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <label
                htmlFor="description"
                className="flex items-center text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-secondary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
                Course Description *
              </label>
              <textarea
                id="description"
                rows="5"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="input-field resize-none"
                placeholder="Describe what students will learn in this course (minimum 10 characters)..."
                required
                minLength={10}
              ></textarea>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 flex items-center">
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Minimum 10 characters required
              </p>
            </div>

            {/* Duration */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <label
                htmlFor="duration"
                className="flex items-center text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-accent-500"
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
                Course Duration *
              </label>
              <input
                type="text"
                id="duration"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
                className="input-field"
                placeholder="e.g., 8 weeks, 3 months, 40 hours"
                required
              />
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 flex items-center">
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  Specify the course duration (e.g., "8 weeks", "3 months")
                </span>
                <span className="sm:hidden">e.g., "8 weeks"</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start shadow-lg animate-fade-in">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                </div>
                <div>
                  <p className="font-semibold text-red-900 text-xs sm:text-sm">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-success-50 border border-success-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start shadow-lg animate-fade-in">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-success-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
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
                  <p className="font-semibold text-success-900 text-xs sm:text-sm">
                    {success}
                  </p>
                  <p className="text-xs sm:text-sm text-success-700 mt-1">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t-2 border-gray-100 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link
                to="/teacher-dashboard"
                className="w-full sm:w-auto px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-center text-sm sm:text-base"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2"
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
                    <span className="hidden sm:inline">Creating Course...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create Course
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div
            className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-100 rounded-xl sm:rounded-2xl animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="flex">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-primary-900 mb-2 sm:mb-3 text-sm sm:text-base">
                  Course Creation Tips:
                </p>
                <ul className="space-y-1.5 sm:space-y-2 text-primary-800">
                  <li className="flex items-start">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 mt-0.5 text-primary-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Title should be clear and descriptive (3-200 characters)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 mr-2 mt-0.5 text-primary-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Description must be at least 10 characters and clearly
                      explain what students will learn
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 mr-2 mt-0.5 text-primary-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Duration should specify the time frame (e.g., "8 weeks",
                      "3 months", "40 hours")
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCourse;
