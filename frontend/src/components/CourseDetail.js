import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { courseAPI, assignmentAPI, enrollmentAPI, submissionAPI } from "../api";
import Modal from "./Modal";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (user && id) {
      fetchCourseData();
    }
  }, [user, id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, assignmentsRes] = await Promise.all([
        courseAPI.getCourse(id),
        assignmentAPI.getAssignmentsByCourse(id),
      ]);

      setCourse(courseRes.data.course);
      setAssignments(assignmentsRes.data.assignments || []);

      // Check enrollment status for students
      if (user.role === "Student") {
        try {
          const enrollmentRes = await enrollmentAPI.checkEnrollment(id);
          setIsEnrolled(enrollmentRes.data.enrolled);

          // Fetch student's submissions to check which assignments are already submitted
          const submissionsRes = await submissionAPI.getMySubmissions();
          const submittedIds = submissionsRes.data.submissions.map(
            (sub) => sub.assignment._id
          );
          setSubmittedAssignments(submittedIds);
        } catch (err) {
          setIsEnrolled(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
      setError("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollmentAPI.enroll(id);
      setIsEnrolled(true);
      setModal({
        isOpen: true,
        title: "Success",
        message: "Successfully enrolled in the course!",
        type: "success",
      });
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Error",
        message: error.response?.data?.error || "Failed to enroll",
        type: "error",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8 text-center max-w-md animate-fade-in">
          <div className="h-20 w-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-10 w-10 text-red-600"
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
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isTeacher = user?.role === "Teacher";
  const isOwner = isTeacher && course.teacher === user._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors mb-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/20"
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

          <div className="flex items-start space-x-6">
            <div className="h-20 w-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl">
              <svg
                className="h-12 w-12 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-display font-bold text-white mb-3 drop-shadow-lg">
                {course.title}
              </h1>
              <p className="text-white/90 text-lg mb-4 drop-shadow">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Created: {formatDate(course.createdAt)}
                </div>
                {course.duration && (
                  <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Duration: {course.duration}
                  </div>
                )}
                {course.level && (
                  <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Level: {course.level}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Enrollment Section for Students */}
        {!isTeacher && !isEnrolled && (
          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl shadow-2xl p-8 mb-8 text-center animate-fade-in">
            <div className="h-20 w-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-10 w-10 text-white"
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
            <h3 className="text-3xl font-display font-bold text-white mb-2">
              Enroll in this course
            </h3>
            <p className="text-white/90 text-lg mb-6">
              Get access to all assignments and course materials
            </p>
            <button
              onClick={handleEnroll}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-primary-600 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Enroll Now
            </button>
          </div>
        )}
        {/* Assignments Section */}
        {/* Assignments Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200 shadow-xl p-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <h2 className="text-3xl font-display font-bold flex items-center text-gray-900">
              <span className="inline-flex items-center justify-center h-10 w-10 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-xl mr-3 text-white shadow-lg">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              Assignments
            </h2>
            {isTeacher && (
              <button
                onClick={() =>
                  navigate(`/create-assignment?courseId=${course._id}`)
                }
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create Assignment
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center h-24 w-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl mx-auto mb-4 animate-bounce-slow">
                <svg
                  className="h-12 w-12 text-primary-600"
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
              <p className="text-xl font-display font-semibold text-gray-700 mb-2">
                No assignments yet
              </p>
              <p className="text-gray-500">
                Check back later for new assignments
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment, idx) => {
                const isSubmitted = submittedAssignments.includes(
                  assignment._id
                );
                const dueDate = new Date(assignment.dueDate);
                const isOverdue = dueDate < new Date();

                return (
                  <div
                    key={assignment._id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all hover:shadow-2xl hover:-translate-y-2 hover:border-primary-300 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-display font-bold text-gray-900 flex-1 pr-2 line-clamp-2">
                        {assignment.title}
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 bg-success-100 text-success-700 rounded-lg font-semibold text-sm whitespace-nowrap">
                        {assignment.totalPoints} pts
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="flex items-center text-sm mb-4 pb-4 border-b-2 border-gray-100">
                      <svg
                        className={`h-5 w-5 mr-2 ${
                          isOverdue ? "text-red-500" : "text-primary-500"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span
                        className={`font-medium ${
                          isOverdue ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        Due: {formatDate(assignment.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      {isTeacher ? (
                        <button
                          onClick={() =>
                            navigate(
                              `/assignments/${assignment._id}/submissions`
                            )
                          }
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary-600 to-accent-600 hover:from-secondary-700 hover:to-accent-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          View Submissions
                        </button>
                      ) : isSubmitted ? (
                        <div className="flex-1 flex items-center justify-center px-4 py-2.5 bg-success-100 text-success-700 rounded-xl font-semibold">
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
                          Submitted
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            navigate(`/assignments/${assignment._id}/submit`)
                          }
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          Submit Assignment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Course Actions (for course owner) */}
        {isOwner && (
          <div
            className="mt-8 flex justify-end animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <button
              onClick={() => navigate(`/edit-course/${id}`)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-secondary-600 to-accent-600 hover:from-secondary-700 hover:to-accent-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Course
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default CourseDetail;
