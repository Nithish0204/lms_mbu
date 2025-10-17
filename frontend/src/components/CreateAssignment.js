import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assignmentAPI, courseAPI } from "../api";
import "./CreateAssignment.css";

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
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="create-assignment-container">
      <div className="create-assignment-card">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h2>Create New Assignment</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label htmlFor="course">Course *</label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
              disabled={!!courseId}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Assignment Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Week 3 Programming Assignment"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Brief description of the assignment"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows="5"
              placeholder="Detailed instructions for students..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalPoints">Total Points *</label>
              <input
                type="number"
                id="totalPoints"
                name="totalPoints"
                value={formData.totalPoints}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="submissionType">Submission Type *</label>
            <select
              id="submissionType"
              name="submissionType"
              value={formData.submissionType}
              onChange={handleChange}
              required
            >
              <option value="file">File Upload Only</option>
              <option value="text">Text Submission Only</option>
              <option value="both">Both File and Text</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleChange}
              />
              <span>Allow Late Submissions</span>
            </label>
          </div>

          {formData.allowLateSubmission && (
            <div className="form-group">
              <label htmlFor="lateSubmissionPenalty">
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
              />
              <small>Percentage deducted from grade per day late</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="files">Attach Files (Optional)</label>
            <input
              type="file"
              id="files"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
            />
            <small className="file-info">
              Max 5 files, 10MB each. Attach reference materials, rubrics, etc.
            </small>
            {attachments.length > 0 && (
              <div className="selected-files">
                <strong>Selected files:</strong>
                <ul>
                  {attachments.map((file, index) => (
                    <li key={index}>
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="draft">Draft (not visible to students)</option>
              <option value="published">Published (visible to students)</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;
