import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assignmentAPI, courseAPI } from "../api";

const CreateAssignment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    course: courseId || "",
    dueDate: "",
    totalPoints: 100,
    allowLateSubmission: false,
    lateSubmissionPenalty: 0,
    submissionType: "both",
    status: "published",
  });

  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== "Teacher") {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getMyCourses();
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setError("Failed to load courses");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file count
    if (selectedFiles.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    // Validate file size (10MB each)
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > 10 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setError("Each file must be less than 10MB");
      return;
    }

    setAttachments(selectedFiles);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.course) {
      setError("Please select a course");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter an assignment title");
      return;
    }

    if (!formData.dueDate) {
      setError("Please select a due date");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      attachments.forEach((file) => {
        data.append("files", file);
      });

      const response = await assignmentAPI.createAssignment(data);
      setSuccess("Assignment created successfully!");

      setTimeout(() => {
        navigate(`/course/${formData.course}`);
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-accent-500 to-primary-600 rounded-2xl shadow-lg flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
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
              <div>
                <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                  Create New Assignment
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Design and publish assignments for your students
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all hover:scale-105"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 animate-fade-in">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start shadow-lg animate-fade-in">
              <div className="h-10 w-10 bg-red-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <svg
                  className="h-5 w-5 text-white"
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
              <p className="font-semibold text-red-900">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-success-50 border border-success-200 rounded-xl p-4 flex items-start shadow-lg animate-fade-in">
              <div className="h-10 w-10 bg-success-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <svg
                  className="h-5 w-5 text-white"
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
                <p className="font-semibold text-success-900">{success}</p>
                <p className="text-sm text-success-700 mt-1">Redirecting...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <label
                htmlFor="course"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-primary-500"
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
                Course *
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                disabled={!!courseId}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-100"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <label
                htmlFor="title"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-accent-500"
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
                Assignment Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Week 3 Programming Assignment"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Description */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <label
                htmlFor="description"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-secondary-500"
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
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of the assignment"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            {/* Instructions */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <label
                htmlFor="instructions"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-primary-500"
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
                Detailed Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="5"
                placeholder="Detailed instructions for students..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            {/* Due Date and Points Grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div>
                <label
                  htmlFor="dueDate"
                  className="flex items-center text-sm font-semibold text-gray-700 mb-3"
                >
                  <svg
                    className="h-5 w-5 mr-2 text-accent-500"
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
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all text-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="totalPoints"
                  className="flex items-center text-sm font-semibold text-gray-700 mb-3"
                >
                  <svg
                    className="h-5 w-5 mr-2 text-success-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Total Points *
                </label>
                <input
                  type="number"
                  id="totalPoints"
                  name="totalPoints"
                  value={formData.totalPoints}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Submission Type */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <label
                htmlFor="submissionType"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-secondary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                Submission Type *
              </label>
              <select
                id="submissionType"
                name="submissionType"
                value={formData.submissionType}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all text-gray-900"
              >
                <option value="file">File Upload Only</option>
                <option value="text">Text Submission Only</option>
                <option value="both">Both File and Text</option>
              </select>
            </div>

            {/* Late Submission Checkbox */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.7s" }}
            >
              <label className="flex items-center p-4 bg-warning-50 border-2 border-warning-200 rounded-xl cursor-pointer hover:bg-warning-100 transition-all">
                <input
                  type="checkbox"
                  name="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={handleChange}
                  className="h-5 w-5 text-warning-600 rounded focus:ring-2 focus:ring-warning-500"
                />
                <span className="ml-3 text-sm font-semibold text-warning-900">
                  Allow Late Submissions
                </span>
              </label>
            </div>

            {/* Late Penalty */}
            {formData.allowLateSubmission && (
              <div className="animate-fade-in">
                <label
                  htmlFor="lateSubmissionPenalty"
                  className="flex items-center text-sm font-semibold text-gray-700 mb-3"
                >
                  <svg
                    className="h-5 w-5 mr-2 text-warning-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Late Submission Penalty (% per day)
                </label>
                <input
                  type="number"
                  id="lateSubmissionPenalty"
                  name="lateSubmissionPenalty"
                  value={formData.lateSubmissionPenalty}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all text-gray-900"
                />
                <p className="mt-2 text-sm text-gray-500 flex items-center">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Percentage deducted from grade per day late
                </p>
              </div>
            )}

            {/* File Attachments */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <label
                htmlFor="files"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Attach Files (Optional)
              </label>
              <input
                type="file"
                id="files"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                className="w-full px-5 py-4 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:font-semibold"
              />
              <p className="mt-2 text-sm text-gray-500 flex items-center">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Max 5 files, 10MB each. Attach reference materials, rubrics,
                etc.
              </p>
              {attachments.length > 0 && (
                <div className="mt-4 bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                  <p className="font-semibold text-primary-900 mb-2">
                    Selected files:
                  </p>
                  <ul className="space-y-1">
                    {attachments.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm text-primary-800 flex items-center"
                      >
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Status */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.9s" }}
            >
              <label
                htmlFor="status"
                className="flex items-center text-sm font-semibold text-gray-700 mb-3"
              >
                <svg
                  className="h-5 w-5 mr-2 text-success-500"
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
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all text-gray-900"
              >
                <option value="draft">Draft (not visible to students)</option>
                <option value="published">
                  Published (visible to students)
                </option>
              </select>
            </div>

            {/* Action Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t-2 border-gray-100 animate-fade-in-up"
              style={{ animationDelay: "1s" }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
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
                    Creating Assignment...
                  </>
                ) : (
                  <>
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
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateAssignment;
