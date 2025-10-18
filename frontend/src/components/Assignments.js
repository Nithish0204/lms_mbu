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
    <div className="min-h-screen bg-gray-50">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === "Student"
              ? "Pending Assignments"
              : "All Assignments"}
          </h1>
          <Link
            to={
              user.role === "Teacher"
                ? "/teacher-dashboard"
                : "/student-dashboard"
            }
            className="text-primary-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {user.role === "Student" && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  📝 Showing only assignments you haven't submitted yet.
                  Completed assignments are not displayed here.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {filteredAssignments.length}{" "}
                  {user.role === "Student" ? "Pending" : "Total"} Assignment
                  {filteredAssignments.length !== 1 ? "s" : ""}
                </h2>
                {user.role === "Teacher" && (
                  <Link
                    to="/create-assignment"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    + Create Assignment
                  </Link>
                )}
              </div>

              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">
                    {user.role === "Student"
                      ? "🎉 Great! You have no pending assignments"
                      : "No assignments found"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {user.role === "Student"
                      ? "All your assignments have been submitted"
                      : "Create your first assignment to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => {
                    const isLate = isAssignmentLate(assignment.dueDate);
                    const submitted = isAssignmentSubmitted(assignment._id);
                    const submission = getSubmissionForAssignment(
                      assignment._id
                    );

                    return (
                      <div
                        key={assignment._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {assignment.title}
                              </h3>
                              {isLate && !submitted && (
                                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                  ⚠️ Overdue
                                </span>
                              )}
                              {assignment.allowLateSubmission && isLate && (
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                  Late submission allowed
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <p className="text-gray-700">
                                {assignment.description}
                              </p>

                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  📚 <strong>Course:</strong>{" "}
                                  {assignment.course?.title || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  📅 <strong>Due:</strong>{" "}
                                  {formatDate(assignment.dueDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  🎯 <strong>Points:</strong>{" "}
                                  {assignment.totalPoints}
                                </span>
                                <span className="flex items-center gap-1">
                                  📎 <strong>Type:</strong>{" "}
                                  {assignment.submissionType === "both"
                                    ? "File or Text"
                                    : assignment.submissionType === "file"
                                    ? "File Upload"
                                    : "Text Only"}
                                </span>
                              </div>
                            </div>

                            {assignment.instructions && (
                              <div className="bg-gray-50 rounded p-3 mb-4">
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  Instructions:
                                </p>
                                <p className="text-sm text-gray-600">
                                  {assignment.instructions}
                                </p>
                              </div>
                            )}
                          </div>

                          {user.role === "Student" && (
                            <div className="ml-6 flex-shrink-0">
                              <Link
                                to={`/submit-assignment/${assignment._id}`}
                                className={`inline-block px-6 py-3 rounded-lg text-sm font-medium transition shadow-sm ${
                                  isLate && !assignment.allowLateSubmission
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-primary-500 hover:bg-primary-600 text-white"
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
                                Submit Assignment
                              </Link>
                            </div>
                          )}

                          {user.role === "Teacher" && (
                            <div className="ml-6 flex-shrink-0 flex gap-2">
                              <Link
                                to={`/view-submissions/${assignment._id}`}
                                className="inline-block px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg text-sm font-medium transition"
                              >
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
