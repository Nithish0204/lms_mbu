import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assignmentAPI, submissionAPI } from "../api";
import "./SubmitAssignment.css";

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

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

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
    return <div className="loading">Loading assignment...</div>;
  }

  if (!assignment) {
    return <div className="error">Assignment not found</div>;
  }

  const getCourseId = () => {
    return typeof assignment.course === "object"
      ? assignment.course._id
      : assignment.course;
  };

  const handleBackClick = () => {
    const courseId = getCourseId();
    if (courseId) {
      navigate(`/course/${courseId}`);
    } else {
      navigate("/student-dashboard");
    }
  };

  return (
    <div className="submit-assignment-container">
      <div className="submit-assignment-card">
        <button className="back-button" onClick={handleBackClick}>
          ← Back to Course
        </button>

        <div className="assignment-header">
          <h2>{assignment.title}</h2>
          {isLate() && !assignment.allowLateSubmission && (
            <div className="alert alert-danger">
              ⚠️ This assignment is past due and late submissions are not
              allowed
            </div>
          )}
          {isLate() && assignment.allowLateSubmission && (
            <div className="alert alert-warning">
              ⚠️ Late submission - {assignment.lateSubmissionPenalty}% penalty
              per day
            </div>
          )}
        </div>

        <div className="assignment-info">
          <div className="info-row">
            <span className="label">Due Date:</span>
            <span className={isLate() ? "late-date" : "due-date"}>
              {formatDate(assignment.dueDate)}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Total Points:</span>
            <span>{assignment.totalPoints}</span>
          </div>
          <div className="info-row">
            <span className="label">Submission Type:</span>
            <span className="submission-type">
              {assignment.submissionType === "both"
                ? "File Upload or Text"
                : assignment.submissionType === "file"
                ? "File Upload Only"
                : "Text Only"}
            </span>
          </div>
        </div>

        {assignment.description && (
          <div className="assignment-description">
            <h3>Description</h3>
            <p>{assignment.description}</p>
          </div>
        )}

        {assignment.instructions && (
          <div className="assignment-instructions">
            <h3>Instructions</h3>
            <p>{assignment.instructions}</p>
          </div>
        )}

        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="assignment-attachments">
            <h3>Attachments</h3>
            <ul>
              {assignment.attachments.map((attachment, index) => {
                const href = attachment.url
                  ? attachment.url
                  : attachment.path && /^https?:\/\//.test(attachment.path)
                  ? attachment.path
                  : attachment.path
                  ? `http://localhost:5001/${attachment.path}`
                  : "#";
                return (
                  <li key={index}>
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      📎{" "}
                      {attachment.filename ||
                        attachment.originalName ||
                        `Attachment ${index + 1}`}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {(!isLate() || assignment.allowLateSubmission) && (
          <form onSubmit={handleSubmit} className="submission-form">
            {(assignment.submissionType === "text" ||
              assignment.submissionType === "both") && (
              <div className="form-group">
                <label htmlFor="textSubmission">
                  Your Submission {assignment.submissionType === "text" && "*"}
                </label>
                <textarea
                  id="textSubmission"
                  value={textSubmission}
                  onChange={(e) => setTextSubmission(e.target.value)}
                  rows="10"
                  placeholder="Type your submission here..."
                  required={assignment.submissionType === "text"}
                />
              </div>
            )}

            {(assignment.submissionType === "file" ||
              assignment.submissionType === "both") && (
              <div className="form-group">
                <label htmlFor="files">
                  Upload Files {assignment.submissionType === "file" && "*"}
                </label>
                <input
                  type="file"
                  id="files"
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                  required={assignment.submissionType === "file"}
                />
                <small className="file-info">
                  Max 5 files, 10MB each. Allowed: PDF, DOC, DOCX, TXT, JPG,
                  PNG, ZIP, RAR
                </small>
                {files.length > 0 && (
                  <div className="selected-files">
                    <strong>Selected files:</strong>
                    <ul>
                      {files.map((file, index) => (
                        <li key={index}>
                          {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBackClick}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Assignment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitAssignment;
