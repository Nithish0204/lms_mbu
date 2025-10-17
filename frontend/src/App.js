import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import CreateCourse from "./components/CreateCourse";
import MyCourses from "./components/MyCourses";
import BrowseCourses from "./components/BrowseCourses";
import Profile from "./components/Profile";
import Assignments from "./components/Assignments";
import Grades from "./components/Grades";
import LiveClasses from "./components/LiveClasses";
import VideoCall from "./components/VideoCall";
import SubmitAssignment from "./components/SubmitAssignment";
import ViewSubmissions from "./components/ViewSubmissions";
import CreateAssignment from "./components/CreateAssignment";
import CourseDetail from "./components/CourseDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Hubexus LMS
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
              Hubexus LMS
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your learning experience with our comprehensive Learning
            Management System. Connect, learn, and grow together.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition duration-150 shadow-lg hover:shadow-xl"
            >
              Start Learning
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-500 px-8 py-3 rounded-lg text-lg font-semibold transition duration-150 shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition duration-300">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-primary-600"
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
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Course Management
            </h3>
            <p className="text-gray-600">
              Create, manage, and access courses with ease. Teachers can publish
              content, and students can enroll seamlessly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition duration-300">
            <div className="h-12 w-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-secondary-600"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Assignment Tracking
            </h3>
            <p className="text-gray-600">
              Submit assignments, track deadlines, and receive feedback all in
              one place for better learning outcomes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition duration-300">
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Grade Analytics
            </h3>
            <p className="text-gray-600">
              Monitor your progress with detailed grade analytics and
              performance insights to stay on track.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">
                500+
              </div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary-600 mb-2">
                50+
              </div>
              <div className="text-gray-600">Expert Teachers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                100+
              </div>
              <div className="text-gray-600">Courses Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Hubexus LMS. Built for 24-Hour Hackathon. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  // Hide navbar on dashboard pages
  const isDashboardPage =
    location.pathname === "/student-dashboard" ||
    location.pathname === "/teacher-dashboard" ||
    location.pathname === "/create-course" ||
    location.pathname === "/my-courses" ||
    location.pathname === "/courses" ||
    location.pathname === "/assignments" ||
    location.pathname === "/my-assignments" ||
    location.pathname === "/create-assignment" ||
    location.pathname.startsWith("/create-assignment/") ||
    location.pathname.startsWith("/submit-assignment/") ||
    location.pathname.startsWith("/view-submissions/") ||
    location.pathname.startsWith("/course/") ||
    location.pathname === "/grades" ||
    location.pathname === "/profile" ||
    location.pathname === "/live-classes" ||
    location.pathname.startsWith("/video-call/");

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDashboardPage && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-course"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-courses"
          element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <BrowseCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-assignment"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <CreateAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-assignment/:courseId"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <CreateAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <Grades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-classes"
          element={
            <ProtectedRoute>
              <LiveClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-call/:id"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit-assignment/:assignmentId"
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <SubmitAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view-submissions/:assignmentId"
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <ViewSubmissions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
