import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assignmentAPI, submissionAPI } from "../api";

const ViewSubmissions = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUserRole(user?.role);
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentAPI.getAssignment(assignmentId),
        submissionAPI.getSubmissionsByAssignment(assignmentId),
      ]);
      setAssignment(assignmentRes.data.assignment);
      setSubmissions(submissionsRes.data.submissions);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || "");
    setFeedback(submission.feedback || "");
    setError("");
    setSuccess("");
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!grade || grade < 0 || grade > assignment.totalPoints) {
      setError(`Grade must be between 0 and ${assignment.totalPoints}`);
      return;
    }

    try {
      setGrading(true);
      await submissionAPI.gradeSubmission(selectedSubmission._id, {
        grade: parseFloat(grade),
        feedback,
      });
      setSuccess("Submission graded successfully!");
      fetchData();
      setTimeout(() => {
        setSelectedSubmission(null);
        setSuccess("");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to grade submission");
    } finally {
      setGrading(false);
    }
  };

  const handleDownloadFile = async (submissionId, fileIndex, fileName) => {
    // Find the file object
    const submission =
      submissions.find((s) => s._id === submissionId) || selectedSubmission;
    const file = submission?.files?.[fileIndex];
    if (file && file.url && /^https?:\/\//.test(file.url)) {
      // Cloud file: direct download
      window.open(file.url, "_blank");
      return;
    }
    // Local file: use backend endpoint
    try {
      const response = await submissionAPI.downloadFile(
        submissionId,
        fileIndex
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError("Failed to download file");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSubmissionStatus = (submission) => {
    if (submission.status === "graded") {
      return {
        label: "Graded",
        className: "status-graded",
      };
    }
    return {
      label: "Submitted",
      className: "status-submitted",
    };
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.status === "graded").length;
    const late = submissions.filter((s) => s.isLate).length;
    const avgGrade =
      graded > 0
        ? (
            submissions
              .filter((s) => s.grade !== null)
              .reduce((sum, s) => sum + s.grade, 0) / graded
          ).toFixed(2)
        : "N/A";

    return { total, graded, late, avgGrade };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-secondary-500 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
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

  const stats = getSubmissionStats();

  const handleBackClick = () => {
    if (userRole === "Teacher") {
      navigate("/teacher-dashboard");
    } else {
      navigate(`/course/${assignment.course}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors mb-4"
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
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl shadow-lg flex items-center justify-center">
              <svg
                className="h-7 w-7 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                {assignment.title}
              </h1>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-1 text-accent-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Due: {formatDate(assignment.dueDate)}
                </span>
                <span className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-1 text-success-500"
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
                  Total Points: {assignment.totalPoints}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium uppercase tracking-wide">
                  Total Submissions
                </p>
                <h3 className="text-4xl font-display font-bold text-white mt-2">
                  {stats.total}
                </h3>
              </div>
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-success-500 to-success-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-100 text-sm font-medium uppercase tracking-wide">
                  Graded
                </p>
                <h3 className="text-4xl font-display font-bold text-white mt-2">
                  {stats.graded}
                </h3>
              </div>
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning-100 text-sm font-medium uppercase tracking-wide">
                  Late Submissions
                </p>
                <h3 className="text-4xl font-display font-bold text-white mt-2">
                  {stats.late}
                </h3>
              </div>
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-100 text-sm font-medium uppercase tracking-wide">
                  Average Grade
                </p>
                <h3 className="text-4xl font-display font-bold text-white mt-2">
                  {stats.avgGrade}
                </h3>
              </div>
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-fade-in">
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
          <div className="mb-6 bg-success-50 border-2 border-success-200 rounded-xl p-4 animate-fade-in">
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

        {/* Submissions Content */}
        <div
          className={`grid ${
            selectedSubmission ? "lg:grid-cols-2" : "grid-cols-1"
          } gap-6`}
        >
          {/* Submissions List */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4">
              <h3 className="text-xl font-display font-bold text-white flex items-center">
                <svg
                  className="h-6 w-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Student Submissions ({submissions.length})
              </h3>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">
                    No submissions yet for this assignment
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission, idx) => {
                    const status = getSubmissionStatus(submission);
                    const isSelected =
                      selectedSubmission?._id === submission._id;
                    return (
                      <div
                        key={submission._id}
                        onClick={() => handleViewSubmission(submission)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 animate-fade-in-up ${
                          isSelected
                            ? "border-primary-500 bg-primary-50 shadow-lg scale-[1.02]"
                            : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-md hover:scale-[1.01]"
                        }`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {submission.student.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {submission.student.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {submission.grade !== null
                                ? `${submission.grade}/${assignment.totalPoints}`
                                : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {submission.isLate && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning-100 text-warning-700 border border-warning-200">
                              <svg
                                className="h-3 w-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Late
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              status.className === "status-graded"
                                ? "bg-success-100 text-success-700 border border-success-200"
                                : "bg-primary-100 text-primary-700 border border-primary-200"
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Submission Details */}
          {selectedSubmission && (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden animate-scale-in">
              <div className="bg-gradient-to-r from-accent-500 to-primary-500 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white flex items-center">
                  <svg
                    className="h-6 w-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedSubmission.student.name}'s Submission
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="h-8 w-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 max-h-[600px] overflow-y-auto space-y-5">
                {/* Submission Time */}
                <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-primary-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                        Submitted
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatDate(selectedSubmission.submittedAt)}
                      </p>
                    </div>
                  </div>
                  {selectedSubmission.isLate && (
                    <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start space-x-2">
                      <svg
                        className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-warning-700">
                          Late submission
                        </p>
                        {assignment.lateSubmissionPenalty > 0 && (
                          <p className="text-xs text-warning-600 mt-1">
                            {assignment.lateSubmissionPenalty}% penalty per day
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Text Submission */}
                {selectedSubmission.textSubmission && (
                  <div className="bg-secondary-50 border-2 border-secondary-200 rounded-xl p-4">
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
                      <p className="font-semibold text-secondary-700">
                        Text Submission
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-gray-700 whitespace-pre-wrap border border-secondary-200">
                      {selectedSubmission.textSubmission}
                    </div>
                  </div>
                )}

                {/* Attached Files */}
                {selectedSubmission.files &&
                  selectedSubmission.files.length > 0 && (
                    <div className="bg-accent-50 border-2 border-accent-200 rounded-xl p-4">
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
                        <p className="font-semibold text-accent-700">
                          Attached Files
                        </p>
                      </div>
                      <div className="space-y-2">
                        {selectedSubmission.files.map((file, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3 border border-accent-200 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="h-10 w-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">
                                  {file.originalName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleDownloadFile(
                                  selectedSubmission._id,
                                  index,
                                  file.originalName
                                )
                              }
                              className="ml-3 px-4 py-2 bg-accent-100 hover:bg-accent-200 text-accent-700 rounded-lg font-semibold text-sm transition-colors flex items-center space-x-2"
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              <span>Download</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Graded Info */}
                {selectedSubmission.status === "graded" && (
                  <div className="bg-success-50 border-2 border-success-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-success-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-success-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-success-600 uppercase tracking-wide">
                            Grade
                          </p>
                          <p className="text-2xl font-display font-bold text-success-700">
                            {selectedSubmission.grade}/{assignment.totalPoints}
                          </p>
                        </div>
                      </div>
                    </div>
                    {selectedSubmission.feedback && (
                      <div className="bg-white rounded-lg p-4 border border-success-200">
                        <p className="text-sm font-semibold text-success-700 mb-2">
                          Feedback
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedSubmission.feedback}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-success-600 mt-3">
                      Graded on {formatDate(selectedSubmission.gradedAt)}
                    </p>
                  </div>
                )}

                {/* Grading Form */}
                <form
                  onSubmit={handleGradeSubmit}
                  className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 space-y-4"
                >
                  <h4 className="text-xl font-display font-bold text-gray-900 flex items-center">
                    <svg
                      className="h-6 w-6 text-primary-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    {selectedSubmission.status === "graded"
                      ? "Update Grade"
                      : "Grade Submission"}
                  </h4>

                  <div>
                    <label
                      htmlFor="grade"
                      className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg
                        className="h-5 w-5 text-success-500 mr-2"
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
                      Grade (0-{assignment.totalPoints}) *
                    </label>
                    <input
                      type="number"
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      min="0"
                      max={assignment.totalPoints}
                      step="0.1"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="feedback"
                      className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                    >
                      <svg
                        className="h-5 w-5 text-secondary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Feedback
                    </label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows="5"
                      placeholder="Provide feedback to the student..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={grading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                  >
                    {grading ? (
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
                        <span>Saving...</span>
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
                        <span>
                          {selectedSubmission.status === "graded"
                            ? "Update Grade"
                            : "Submit Grade"}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissions;
