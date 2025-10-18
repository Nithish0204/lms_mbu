import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assignmentAPI, submissionAPI } from "../api";
import "./ViewSubmissions.css";

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
    return <div className="loading">Loading submissions...</div>;
  }

  if (!assignment) {
    return <div className="error">Assignment not found</div>;
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
    <div className="view-submissions-container">
      <div className="submissions-header">
        <button className="back-button" onClick={handleBackClick}>
          ← Back to Dashboard
        </button>
        <h2>{assignment.title} - Submissions</h2>
        <div className="assignment-meta">
          <span>Due: {formatDate(assignment.dueDate)}</span>
          <span>Total Points: {assignment.totalPoints}</span>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Submissions</p>
        </div>
        <div className="stat-card">
          <h3>{stats.graded}</h3>
          <p>Graded</p>
        </div>
        <div className="stat-card">
          <h3>{stats.late}</h3>
          <p>Late Submissions</p>
        </div>
        <div className="stat-card">
          <h3>{stats.avgGrade}</h3>
          <p>Average Grade</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="submissions-content">
        <div className="submissions-list">
          <h3>Student Submissions ({submissions.length})</h3>
          {submissions.length === 0 ? (
            <div className="no-submissions">
              No submissions yet for this assignment
            </div>
          ) : (
            <div className="submissions-table">
              {submissions.map((submission) => {
                const status = getSubmissionStatus(submission);
                return (
                  <div
                    key={submission._id}
                    className={`submission-row ${
                      selectedSubmission?._id === submission._id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleViewSubmission(submission)}
                  >
                    <div className="submission-info">
                      <div className="student-name">
                        {submission.student.name}
                      </div>
                      <div className="submission-meta">
                        <span className="submission-date">
                          {formatDate(submission.submittedAt)}
                        </span>
                        {submission.isLate && (
                          <span className="late-badge">Late</span>
                        )}
                        <span className={`status-badge ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="submission-grade">
                      {submission.grade !== null
                        ? `${submission.grade}/${assignment.totalPoints}`
                        : "Not graded"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedSubmission && (
          <div className="submission-details">
            <div className="details-header">
              <h3>{selectedSubmission.student.name}'s Submission</h3>
              <button
                className="close-button"
                onClick={() => setSelectedSubmission(null)}
              >
                ✕
              </button>
            </div>

            <div className="details-content">
              <div className="detail-section">
                <strong>Submitted:</strong>
                <span>{formatDate(selectedSubmission.submittedAt)}</span>
                {selectedSubmission.isLate && (
                  <span className="late-warning">
                    ⚠️ Late submission
                    {assignment.lateSubmissionPenalty > 0 &&
                      ` (${assignment.lateSubmissionPenalty}% penalty per day)`}
                  </span>
                )}
              </div>

              {selectedSubmission.textSubmission && (
                <div className="detail-section">
                  <strong>Text Submission:</strong>
                  <div className="text-submission">
                    {selectedSubmission.textSubmission}
                  </div>
                </div>
              )}

              {selectedSubmission.files &&
                selectedSubmission.files.length > 0 && (
                  <div className="detail-section">
                    <strong>Attached Files:</strong>
                    <div className="files-list">
                      {selectedSubmission.files.map((file, index) => (
                        <div key={index} className="file-item">
                          <span className="file-name">{file.originalName}</span>
                          <span className="file-size">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                          <button
                            className="download-btn"
                            onClick={() =>
                              handleDownloadFile(
                                selectedSubmission._id,
                                index,
                                file.originalName
                              )
                            }
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedSubmission.status === "graded" && (
                <div className="graded-info">
                  <div className="grade-display">
                    <strong>Grade:</strong>
                    <span className="grade-value">
                      {selectedSubmission.grade}/{assignment.totalPoints}
                    </span>
                  </div>
                  {selectedSubmission.feedback && (
                    <div className="feedback-display">
                      <strong>Feedback:</strong>
                      <p>{selectedSubmission.feedback}</p>
                    </div>
                  )}
                  <div className="graded-meta">
                    Graded on {formatDate(selectedSubmission.gradedAt)}
                  </div>
                </div>
              )}

              <form onSubmit={handleGradeSubmit} className="grading-form">
                <h4>
                  {selectedSubmission.status === "graded"
                    ? "Update Grade"
                    : "Grade Submission"}
                </h4>
                <div className="form-group">
                  <label htmlFor="grade">
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
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="feedback">Feedback</label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="5"
                    placeholder="Provide feedback to the student..."
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={grading}
                >
                  {grading
                    ? "Saving..."
                    : selectedSubmission.status === "graded"
                    ? "Update Grade"
                    : "Submit Grade"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSubmissions;
