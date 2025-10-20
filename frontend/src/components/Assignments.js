import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assignmentAPI, submissionAPI } from "../api";
import Modal from "./Modal";

const Assignments = () => {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch assignments
        const assignmentsResponse = await assignmentAPI.getMyAssignments();
        const allAssignments = assignmentsResponse.data.assignments || [];

        // Filter out deleted assignments and unpublished ones
        const validAssignments = allAssignments.filter(
          (a) => a && a._id && a.status === "published"
        );

        setAssignments(validAssignments);

        // For students, fetch submissions to check what's pending
        if (user && user.role === "Student") {
          const submissionsResponse = await submissionAPI.getMySubmissions();
          setMySubmissions(submissionsResponse.data.submissions || []);
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const isAssignmentSubmitted = (assignmentId) => {
    return mySubmissions.some(
      (submission) =>
        submission.assignment && submission.assignment._id === assignmentId
    );
  };

  const getSubmissionForAssignment = (assignmentId) => {
    return mySubmissions.find(
      (submission) =>
        submission.assignment && submission.assignment._id === assignmentId
    );
  };

  const isAssignmentLate = (dueDate) => {
    return new Date() > new Date(dueDate);
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

  // Filter assignments based on user role
  const getFilteredAssignments = () => {
    if (!user) return [];

    if (user.role === "Student") {
      // For students, show only pending (unsubmitted) assignments
      return assignments.filter(
        (assignment) => !isAssignmentSubmitted(assignment._id)
      );
    }
    // For teachers, show all assignments
    return assignments;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-lg flex items-center justify-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {user.role === "Student"
                    ? "Pending Assignments"
                    : "All Assignments"}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {user.role === "Student"
                    ? "Complete your pending work"
                    : "Manage and review assignments"}
                </p>
              </div>
            </div>
            <Link
              to={
                user.role === "Teacher"
                  ? "/teacher-dashboard"
                  : "/student-dashboard"
              }
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
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 font-medium mt-4">
              Loading assignments...
            </p>
          </div>
        ) : (
          <>
            {user.role === "Student" && (
              <div className="mb-6 bg-primary-50 border-2 border-primary-200 rounded-xl p-5 flex items-start animate-fade-in shadow-lg">
                <div className="h-10 w-10 bg-primary-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-primary-900 font-medium">
                  📝 Showing only assignments you haven't submitted yet.
                  Completed assignments are not displayed here.
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">
                    {filteredAssignments.length}{" "}
                    {user.role === "Student" ? "Pending" : "Total"} Assignment
                    {filteredAssignments.length !== 1 ? "s" : ""}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {user.role === "Student"
                      ? "Complete these assignments on time"
                      : "View and manage all assignments"}
                  </p>
                </div>
                {user.role === "Teacher" && (
                  <Link
                    to="/create-assignment"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
                    Create Assignment
                  </Link>
                )}
              </div>

              {filteredAssignments.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="h-28 w-28 bg-gradient-to-br from-success-100 to-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                    <svg
                      className="h-16 w-16 text-success-500"
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
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {user.role === "Student"
                      ? "🎉 Great! You have no pending assignments"
                      : "No assignments found"}
                  </p>
                  <p className="text-gray-500 text-lg">
                    {user.role === "Student"
                      ? "All your assignments have been submitted"
                      : "Create your first assignment to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredAssignments.map((assignment, idx) => {
                    const isLate = isAssignmentLate(assignment.dueDate);
                    const submitted = isAssignmentSubmitted(assignment._id);
                    const submission = getSubmissionForAssignment(
                      assignment._id
                    );

                    return (
                      <div
                        key={assignment._id}
                        className="group border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-primary-200 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-display font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                {assignment.title}
                              </h3>
                              {isLate && !submitted && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                                  <svg
                                    className="h-3.5 w-3.5 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Overdue
                                </span>
                              )}
                              {assignment.allowLateSubmission && isLate && (
                                <span className="inline-flex items-center px-3 py-1.5 bg-warning-500 text-white text-xs font-bold rounded-full shadow-lg">
                                  Late submission allowed
                                </span>
                              )}
                            </div>

                            <p className="text-gray-700 mb-4 leading-relaxed">
                              {assignment.description}
                            </p>

                            <div className="flex flex-wrap gap-3 mb-4">
                              <span className="inline-flex items-center px-3 py-2 bg-primary-100 text-primary-800 rounded-lg text-sm font-medium">
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
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                  />
                                </svg>
                                {assignment.course?.title || "N/A"}
                              </span>
                              <span className="inline-flex items-center px-3 py-2 bg-accent-100 text-accent-800 rounded-lg text-sm font-medium">
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
                                Due: {formatDate(assignment.dueDate)}
                              </span>
                              <span className="inline-flex items-center px-3 py-2 bg-success-100 text-success-800 rounded-lg text-sm font-medium">
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
                                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                  />
                                </svg>
                                {assignment.totalPoints} Points
                              </span>
                              <span className="inline-flex items-center px-3 py-2 bg-secondary-100 text-secondary-800 rounded-lg text-sm font-medium">
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
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                {assignment.submissionType === "both"
                                  ? "File or Text"
                                  : assignment.submissionType === "file"
                                  ? "File Upload"
                                  : "Text Only"}
                              </span>
                            </div>

                            {assignment.instructions && (
                              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-primary-500 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center">
                                  <svg
                                    className="h-4 w-4 mr-1 text-primary-500"
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
                                  Instructions:
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {assignment.instructions}
                                </p>
                              </div>
                            )}
                          </div>

                          {user.role === "Student" && (
                            <div className="ml-6 flex-shrink-0">
                              <Link
                                to={`/submit-assignment/${assignment._id}`}
                                className={`inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                                  isLate && !assignment.allowLateSubmission
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white hover:scale-105 hover:shadow-xl"
                                }`}
                                onClick={(e) => {
                                  if (
                                    isLate &&
                                    !assignment.allowLateSubmission
                                  ) {
                                    e.preventDefault();
                                    setModal({
                                      isOpen: true,
                                      title: "Late submission blocked",
                                      message:
                                        "This assignment is past due and late submissions are not allowed.",
                                      type: "warning",
                                    });
                                  }
                                }}
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Submit Assignment
                              </Link>
                            </div>
                          )}

                          {user.role === "Teacher" && (
                            <div className="ml-6 flex-shrink-0">
                              <Link
                                to={`/view-submissions/${assignment._id}`}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                View Submissions
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Assignments;
