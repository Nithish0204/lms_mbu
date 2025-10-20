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
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg w-full sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between h-auto md:h-20 items-center md:items-stretch">
          <div className="flex items-center py-3 md:py-0 w-full md:w-auto justify-center md:justify-start">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <span className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                Hubexus LMS
              </span>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto justify-center md:justify-end py-2 md:py-0">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl text-base font-semibold transition-all duration-200 w-full md:w-auto text-center"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl text-base font-semibold transition-all duration-200 w-full md:w-auto text-center"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-6 py-2.5 rounded-xl text-base font-bold transition-all duration-200 shadow-lg hover:shadow-glow hover:scale-105 w-full md:w-auto text-center"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-secondary-400/20 to-accent-400/20 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 relative z-10">
          <div className="text-center animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 font-semibold text-sm mb-6 shadow-lg animate-bounce-slow">
              <span className="animate-pulse mr-2">🚀</span>
              Next-Gen Learning Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold mb-6 leading-tight">
              <span className="block text-gray-900">Transform Learning</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-500 animate-shimmer bg-[length:200%_auto]">
                Empower Success
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
              The all-in-one Learning Management System that brings students and
              teachers together.
              <span className="block mt-2 text-primary-600 font-semibold">
                Create. Collaborate. Excel.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-12">
              <Link
                to="/register"
                className="group relative bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-glow-lg hover:scale-105 w-full sm:w-auto text-center overflow-hidden"
              >
                <span className="relative z-10">Start Learning Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                to="/login"
                className="group bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-500 px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto text-center"
              >
                Sign In →
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-success-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-success-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-success-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-y border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
                500+
              </div>
              <div className="text-gray-600 font-medium">Active Students</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary-600 to-secondary-400 mb-2">
                50+
              </div>
              <div className="text-gray-600 font-medium">Expert Teachers</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-success-600 to-success-400 mb-2">
                100+
              </div>
              <div className="text-gray-600 font-medium">Courses</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-400 mb-2">
                98%
              </div>
              <div className="text-gray-600 font-medium">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* All Features Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-4">
            Everything You Need to{" "}
            <span className="text-primary-600">Excel</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover all the powerful features that make learning and teaching a
            seamless experience
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: Course Management */}
          <div className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-primary-300 hover:-translate-y-2 animate-fade-in-up">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Course Management
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Create, organize, and manage courses effortlessly. Teachers can
              publish content, track progress, and students can enroll with a
              single click.
            </p>
            <div className="flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 2: Assignments */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-secondary-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Smart Assignments
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Submit assignments with attachments, track deadlines with
              reminders, and receive detailed feedback to improve your
              performance.
            </p>
            <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 3: Assessments */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-accent-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Online Assessments
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conduct timed assessments, quizzes, and exams online. Automatic
              grading, instant results, and comprehensive analytics included.
            </p>
            <div className="flex items-center text-accent-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 4: Live Classes */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-success-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-success-400 to-success-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Live Video Classes
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Host and join live video classes with integrated video calling.
              Schedule sessions, send reminders, and engage in real-time
              learning.
            </p>
            <div className="flex items-center text-success-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 5: Grade Analytics */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-warning-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-warning-400 to-warning-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Grade Analytics
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Track your academic progress with visual charts and detailed
              reports. Monitor performance trends and identify areas for
              improvement.
            </p>
            <div className="flex items-center text-warning-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 6: Enrollment System */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-primary-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Easy Enrollment
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Browse and enroll in courses instantly. Teachers get notified
              immediately, and students receive confirmation emails
              automatically.
            </p>
            <div className="flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 7: Submissions */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-secondary-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              File Submissions
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Upload assignments with multiple file types. Teachers can review
              submissions, add comments, and grade all from one interface.
            </p>
            <div className="flex items-center text-secondary-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 8: Notifications */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-accent-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-success-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Email Notifications
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Never miss an update! Get instant email notifications for new
              assignments, grades, live classes, and course enrollments.
            </p>
            <div className="flex items-center text-accent-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Feature 9: User Profiles */}
          <div
            className="group bg-white rounded-3xl shadow-lg hover:shadow-glow transition-all duration-300 p-8 border border-gray-100 hover:border-success-300 hover:-translate-y-2 animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-success-400 to-warning-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              User Profiles
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Personalized profiles for students and teachers. Manage your
              account, view your activity history, and customize your learning
              experience.
            </p>
            <div className="flex items-center text-success-600 font-semibold group-hover:gap-2 transition-all">
              <span>Learn more</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Why Choose Hubexus LMS?
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Built with modern technology and designed for the future of
              education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-primary-100">
                Optimized performance ensures smooth experience even with large
                courses and hundreds of students.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-3">Secure & Private</h3>
              <p className="text-primary-100">
                Bank-level security with JWT authentication, encrypted data, and
                role-based access control.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-2xl font-bold mb-3">Fully Responsive</h3>
              <p className="text-primary-100">
                Works perfectly on all devices - desktop, tablet, and mobile.
                Learn anywhere, anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of students and teachers already using Hubexus LMS
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-glow-lg hover:scale-105 text-center"
            >
              Get Started Now - It's Free!
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-500 px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl text-center"
            >
              I Already Have an Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="text-xl font-bold">Hubexus LMS</span>
              </div>
              <p className="text-gray-400 max-w-md">
                The next-generation learning management system designed for
                modern education. Empowering students and teachers worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/login" className="hover:text-white transition">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/courses" className="hover:text-white transition">
                    Browse Courses
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Course Management</li>
                <li>Live Classes</li>
                <li>Assignments & Grades</li>
                <li>Real-time Notifications</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              © 2025 Hubexus LMS. Built with ❤️ for better education. All rights
              reserved.
            </p>
          </div>
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
