import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assignmentAPI, submissionAPI } from "../api";

const SubmitAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [textSubmission, setTextSubmission] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchAssignment();
    checkUserRole();
    checkExistingSubmission();
  }, [assignmentId]);

  const checkUserRole = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserRole(user?.role);
  };

  const checkExistingSubmission = async () => {
    try {
      const response = await submissionAPI.getMySubmissions();
      const existingSubmission = response.data.submissions.find(
        (sub) => sub.assignment._id === assignmentId
      );
      if (existingSubmission) {
        setAlreadySubmitted(true);
      }
    } catch (error) {
      console.error("Error checking submission:", error);
    }
  };

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getAssignment(assignmentId);
      setAssignment(response.data.assignment);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to fetch assignment");
    } finally {
      setLoading(false);
    }
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

    setFiles(selectedFiles);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (assignment.submissionType === "file" && files.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    if (assignment.submissionType === "text" && !textSubmission.trim()) {
      setError("Please provide a text submission");
      return;
    }

    if (
      assignment.submissionType === "both" &&
      files.length === 0 &&
      !textSubmission.trim()
    ) {
      setError("Please provide either a text submission or upload files");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      formData.append("textSubmission", textSubmission);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await submissionAPI.submitAssignment(formData);
      setSuccess(response.data.message);

      setTimeout(() => {
        // Get the course ID (could be object or string)
        const courseId =
          typeof assignment.course === "object"
            ? assignment.course._id
            : assignment.course;

        // Redirect to course detail page or student dashboard
        if (courseId) {
          navigate(`/course/${courseId}`);
        } else {
          navigate("/student-dashboard");
        }
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const isLate = () => {
    if (!assignment) return false;
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    return now > dueDate;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-primary-500 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center animate-fade-in">
          <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600"
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
          <h3 className="text-xl font-bold text-red-900">
            Assignment not found
          </h3>
        </div>
      </div>
    );
  }

  const getCourseId = () => {
    return typeof assignment.course === "object"
      ? assignment.course._id
      : assignment.course;
  };

  const handleBackClick = () => {
    // Navigate based on user role
    if (userRole === "Student") {
      navigate("/student-dashboard");
    } else if (userRole === "Teacher") {
      navigate("/teacher-dashboard");
    } else {
      // Fallback to course page
      const courseId = getCourseId();
      if (courseId) {
        navigate(`/course/${courseId}`);
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors mb-6"
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
          Back to Course
        </button>

        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-8 py-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-display font-bold text-white">
                {assignment.title}
              </h1>
            </div>

            {/* Warning Banners */}
            {isLate() && !assignment.allowLateSubmission && (
              <div className="bg-red-500/90 backdrop-blur-lg border-2 border-red-300 rounded-xl p-4 flex items-center space-x-3">
                <svg
                  className="h-6 w-6 text-white flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-white font-semibold">
                  This assignment is past due and late submissions are not
                  allowed
                </p>
              </div>
            )}
            {isLate() && assignment.allowLateSubmission && (
              <div className="bg-warning-500/90 backdrop-blur-lg border-2 border-warning-300 rounded-xl p-4 flex items-center space-x-3">
                <svg
                  className="h-6 w-6 text-white flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-white font-semibold">
                  Late submission - {assignment.lateSubmissionPenalty}% penalty
                  per day
                </p>
              </div>
            )}
          </div>

          <div className="p-8 space-y-6">
            {/* Assignment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-accent-50 border-2 border-accent-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-accent-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-accent-600 uppercase tracking-wide">
                      Due Date
                    </p>
                    <p
                      className={`font-bold ${
                        isLate() ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {formatDate(assignment.dueDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-success-50 border-2 border-success-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-success-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-success-600 uppercase tracking-wide">
                      Total Points
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {assignment.totalPoints}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-secondary-50 border-2 border-secondary-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-secondary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary-600 uppercase tracking-wide">
                      Type
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {assignment.submissionType === "both"
                        ? "File or Text"
                        : assignment.submissionType === "file"
                        ? "File Upload"
                        : "Text Only"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {assignment.description && (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-primary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-display font-bold text-primary-700">
                    Description
                  </h3>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {assignment.description}
                </p>
              </div>
            )}

            {/* Instructions */}
            {assignment.instructions && (
              <div className="bg-secondary-50 border-2 border-secondary-200 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="h-8 w-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-secondary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-display font-bold text-secondary-700">
                    Instructions
                  </h3>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {assignment.instructions}
                </p>
              </div>
            )}

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="bg-accent-50 border-2 border-accent-200 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="h-8 w-8 bg-accent-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-accent-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-display font-bold text-accent-700">
                    Attachments
                  </h3>
                </div>
                <div className="space-y-2">
                  {assignment.attachments.map((attachment, index) => {
                    const href = attachment.url
                      ? attachment.url
                      : attachment.path && /^https?:\/\//.test(attachment.path)
                      ? attachment.path
                      : attachment.path
                      ? attachment.path.startsWith("uploads/")
                        ? `/api/${attachment.path}`
                        : `/${attachment.path}`
                      : "#";
                    return (
                      <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-accent-200 hover:shadow-md transition-all group"
                      >
                        <div className="h-10 w-10 bg-accent-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            className="h-5 w-5 text-accent-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-accent-700 font-medium group-hover:text-accent-800 transition-colors">
                          {attachment.filename ||
                            attachment.originalName ||
                            `Attachment ${index + 1}`}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alert Messages */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-600"
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
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-success-50 border-2 border-success-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-success-600"
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
                  <p className="text-success-700 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Submission Section */}
            {alreadySubmitted ? (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 text-center">
                <div className="h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-8 w-8 text-primary-600"
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
                <h3 className="text-xl font-bold text-primary-900 mb-2">
                  Already Submitted
                </h3>
                <p className="text-primary-700 mb-6">
                  You have already submitted this assignment.
                </p>
                <button
                  onClick={handleBackClick}
                  className="px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : !isLate() || assignment.allowLateSubmission ? (
              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-5"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-white"
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
                  <h3 className="text-2xl font-display font-bold text-gray-900">
                    Submit Your Work
                  </h3>
                </div>

                {/* Text Submission */}
                {(assignment.submissionType === "text" ||
                  assignment.submissionType === "both") && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <label
                      htmlFor="textSubmission"
                      className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Your Submission{" "}
                      {assignment.submissionType === "text" && "*"}
                    </label>
                    <textarea
                      id="textSubmission"
                      value={textSubmission}
                      onChange={(e) => setTextSubmission(e.target.value)}
                      rows="10"
                      placeholder="Type your submission here..."
                      required={assignment.submissionType === "text"}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    />
                  </div>
                )}

                {/* File Upload */}
                {(assignment.submissionType === "file" ||
                  assignment.submissionType === "both") && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <label
                      htmlFor="files"
                      className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg
                        className="h-5 w-5 text-accent-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Upload Files {assignment.submissionType === "file" && "*"}
                    </label>
                    <input
                      type="file"
                      id="files"
                      onChange={handleFileChange}
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                      required={assignment.submissionType === "file"}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:border-primary-500 transition-all 
                        file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-semibold hover:file:bg-primary-100 file:transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <svg
                        className="h-4 w-4 mr-1 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Max 5 files, 10MB each. Allowed: PDF, DOC, DOCX, TXT, JPG,
                      PNG, ZIP, RAR
                    </p>
                    {files.length > 0 && (
                      <div className="mt-4 p-4 bg-primary-50 border-2 border-primary-200 rounded-xl">
                        <p className="font-semibold text-primary-700 mb-2 flex items-center">
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
                          Selected files:
                        </p>
                        <ul className="space-y-2">
                          {files.map((file, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-3 bg-white p-2 rounded-lg"
                            >
                              <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="h-4 w-4 text-primary-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  className="flex flex-col sm:flex-row gap-3 pt-4 animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <button
                    type="button"
                    onClick={handleBackClick}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Submit Assignment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
