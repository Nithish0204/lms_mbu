import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  verifyOtp: ({ email, otp }) => api.post("/auth/verify-otp", { email, otp }),
};

// Course API
export const courseAPI = {
  getAllCourses: () => api.get("/courses"),
  getCourse: (id) => api.get(`/courses/${id}`),
  getMyCourses: () => api.get("/courses/my-courses"),
  createCourse: (courseData) => api.post("/courses", courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getCourseStudents: (id) => api.get(`/courses/${id}/students`),
};

// Enrollment API
export const enrollmentAPI = {
  enroll: (courseId) => api.post("/enrollments", { courseId }),
  getMyEnrollments: () => api.get("/enrollments/my-enrollments"),
  checkEnrollment: (courseId) => api.get(`/enrollments/check/${courseId}`),
  unenroll: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`),
  getCourseEnrollments: (courseId) =>
    api.get(`/enrollments/course/${courseId}`),
  removeStudentFromCourse: (enrollmentId) =>
    api.delete(`/enrollments/remove/${enrollmentId}`),
  getMyStudents: () => api.get("/enrollments/my-students"),
};

// Assignment API
export const assignmentAPI = {
  createAssignment: (assignmentData) =>
    api.post("/assignments", assignmentData),
  getAssignmentsByCourse: (courseId) =>
    api.get(`/assignments/course/${courseId}`),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  getMyAssignments: () => api.get("/assignments/my-assignments"),
  updateAssignment: (id, assignmentData) =>
    api.put(`/assignments/${id}`, assignmentData),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
};

// Submission API
export const submissionAPI = {
  submitAssignment: (formData) => {
    return api.post("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getMySubmissions: () => api.get("/submissions/my-submissions"),
  getSubmissionsByAssignment: (assignmentId) =>
    api.get(`/submissions/assignment/${assignmentId}`),
  getSubmissionsByCourse: (courseId) =>
    api.get(`/submissions/course/${courseId}`),
  getSubmission: (id) => api.get(`/submissions/${id}`),
  updateSubmission: (id, formData) => {
    return api.put(`/submissions/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteSubmission: (id) => api.delete(`/submissions/${id}`),
  downloadSubmission: (id) =>
    api.get(`/submissions/${id}/download`, { responseType: "blob" }),
};

// Grade API
export const gradeAPI = {
  gradeSubmission: (submissionId, gradeData) =>
    api.post(`/grades/${submissionId}`, gradeData),
  updateGrade: (submissionId, gradeData) =>
    api.put(`/grades/${submissionId}`, gradeData),
  getMyGrades: () => api.get("/grades/my-grades"),
  getStudentGradesByCourse: (studentId, courseId) =>
    api.get(`/grades/student/${studentId}/course/${courseId}`),
  getCourseGradesOverview: (courseId) =>
    api.get(`/grades/course/${courseId}/overview`),
};

export default api;
