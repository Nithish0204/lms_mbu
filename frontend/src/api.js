import axios from "axios";

// Choose API base: in development (localhost) use local backend; in production use same-origin /api
const isLocalhost =
  typeof window !== "undefined" &&
  /localhost|127\.0\.0\.1/.test(window.location.hostname);
const API_URL =
  process.env.REACT_APP_API_URL ||
  (isLocalhost ? "http://localhost:5001/api" : "/api");

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
  createAssignment: (assignmentData) => {
    // Check if it's FormData (with files) or regular object
    const headers =
      assignmentData instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {};
    return api.post("/assignments", assignmentData, { headers });
  },
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
  getSubmission: (id) => api.get(`/submissions/${id}`),
  deleteSubmission: (id) => api.delete(`/submissions/${id}`),
  gradeSubmission: (id, gradeData) =>
    api.put(`/submissions/${id}/grade`, gradeData),
  downloadFile: (submissionId, fileIndex) =>
    api.get(`/submissions/${submissionId}/download/${fileIndex}`, {
      responseType: "blob",
    }),
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

// Live Class API
export const liveClassAPI = {
  createLiveClass: (liveClassData) => api.post("/live-classes", liveClassData),
  getCourseLiveClasses: (courseId) =>
    api.get(`/live-classes/course/${courseId}`),
  getMyLiveClasses: () => api.get("/live-classes/my-classes"),
  getMyScheduledClasses: () => api.get("/live-classes/my-scheduled"),
  joinLiveClass: (id) => api.get(`/live-classes/${id}/join`),
  endLiveClass: (id) => api.put(`/live-classes/${id}/end`),
  deleteLiveClass: (id) => api.delete(`/live-classes/${id}`),
};

// Assessment API
export const assessmentAPI = {
  createAssessment: (assessmentData) =>
    api.post("/assessments", assessmentData),
  getAssessmentsByCourse: (courseId) =>
    api.get(`/assessments/course/${courseId}`),
  getAssessment: (id) => api.get(`/assessments/${id}`),
  updateAssessment: (id, assessmentData) =>
    api.put(`/assessments/${id}`, assessmentData),
  deleteAssessment: (id) => api.delete(`/assessments/${id}`),
  submitAssessment: (id, answers) =>
    api.post(`/assessments/${id}/submit`, { answers }),
  getAssessmentSubmissions: (id) => api.get(`/assessments/${id}/submissions`),
  gradeSubmission: (submissionId, gradingData) =>
    api.put(`/assessments/submissions/${submissionId}/grade`, gradingData),
  getMySubmissions: () => api.get("/assessments/my-submissions"),
  getAssessmentAnalytics: (id) => api.get(`/assessments/${id}/analytics`),
};

export default api;
export { API_URL };
