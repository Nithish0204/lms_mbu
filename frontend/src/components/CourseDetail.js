import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { courseAPI, assignmentAPI, enrollmentAPI, submissionAPI } from "../api";
import Modal from "./Modal";
import "./CourseDetail.css";

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
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="error-container">
        <h2>Course Not Found</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const isTeacher = user?.role === "Teacher";
  const isOwner = isTeacher && course.teacher === user._id;

  return (
    <div className="course-detail-container">
      <div className="course-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="course-header-content">
          <h1>{course.title}</h1>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span>📅 Created: {formatDate(course.createdAt)}</span>
            {course.duration && <span>⏱️ Duration: {course.duration}</span>}
            {course.level && <span>📊 Level: {course.level}</span>}
          </div>
        </div>
      </div>

      <div className="course-content">
        {/* Enrollment Section for Students */}
        {!isTeacher && !isEnrolled && (
          <div className="enrollment-card">
            <h3>Enroll in this course</h3>
            <p>Get access to all assignments and course materials</p>
            <button onClick={handleEnroll} className="btn-primary">
              Enroll Now
            </button>
          </div>
        )}

        {/* Assignments Section */}
        <div className="assignments-section">
          <div className="section-header">
            <h2>📝 Assignments</h2>
            {isOwner && (
              <Link
                to={`/create-assignment/${id}`}
                className="btn-primary btn-sm"
              >
                + Create Assignment
              </Link>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="no-content">
              <p>No assignments yet for this course</p>
              {isOwner && (
                <Link to={`/create-assignment/${id}`} className="btn-primary">
                  Create First Assignment
                </Link>
              )}
            </div>
          ) : (
            <div className="assignments-grid">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="assignment-card">
                  <div className="assignment-header">
                    <h3>{assignment.title}</h3>
                    <span className="assignment-points">
                      {assignment.totalPoints} pts
                    </span>
                  </div>
                  <p className="assignment-description">
                    {assignment.description}
                  </p>
                  <div className="assignment-footer">
                    <span className="due-date">
                      📅 Due: {formatDate(assignment.dueDate)}
                    </span>
                    <div className="assignment-actions">
                      {isTeacher ? (
                        <Link
                          to={`/view-submissions/${assignment._id}`}
                          className="btn-secondary btn-sm"
                        >
                          View Submissions
                        </Link>
                      ) : (
                        isEnrolled &&
                        (submittedAssignments.includes(assignment._id) ? (
                          <span className="submitted-badge">✓ Submitted</span>
                        ) : (
                          <Link
                            to={`/submit-assignment/${assignment._id}`}
                            className="btn-primary btn-sm"
                          >
                            Submit
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Actions */}
        {isOwner && (
          <div className="course-actions">
            <button
              onClick={() => navigate(`/edit-course/${id}`)}
              className="btn-secondary"
            >
              Edit Course
            </button>
          </div>
        )}
      </div>
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
