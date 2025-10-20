import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { liveClassAPI, courseAPI } from "../api";
import Modal from "./Modal";

const LiveClasses = () => {
  const [user, setUser] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    scheduledAt: "",
    duration: 60,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // Helper: Format date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(userData);
    fetchData(userData.role);
  }, [navigate]);

  const fetchData = async (role) => {
    try {
      setLoading(true);
      if (role === "Teacher") {
        const [classesRes, coursesRes] = await Promise.all([
          liveClassAPI.getMyScheduledClasses(),
          courseAPI.getMyCourses(),
        ]);
        setLiveClasses(classesRes.data.liveClasses || []);
        setCourses(coursesRes.data.courses || []);
      } else {
        const classesRes = await liveClassAPI.getMyLiveClasses();
        setLiveClasses(classesRes.data.liveClasses || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load live classes");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Convert datetime-local to ISO string preserving local timezone
      const scheduledDate = new Date(formData.scheduledAt);
      const dataToSend = {
        ...formData,
        scheduledAt: scheduledDate.toISOString(),
      };

      await liveClassAPI.createLiveClass(dataToSend);
      setShowScheduleModal(false);
      setFormData({
        courseId: "",
        title: "",
        description: "",
        scheduledAt: "",
        duration: 60,
      });
      fetchData(user.role);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to schedule live class");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = (liveClassId) => {
    navigate(`/video-call/${liveClassId}`);
  };

  const handleDelete = async (liveClassId) => {
    setModal({
      isOpen: true,
      title: "Delete live class?",
      message: "Are you sure you want to delete this live class?",
      type: "confirm",
      onConfirm: async () => {
        try {
          await liveClassAPI.deleteLiveClass(liveClassId);
          fetchData(user.role);
        } catch (err) {
          setModal({
            isOpen: true,
            title: "Error",
            message: "Failed to delete live class",
            type: "error",
          });
        }
      },
    });
  };

  const getStatusBadge = (status, scheduledAt) => {
    const now = new Date();
    const classTime = new Date(scheduledAt);

    if (status === "live") {
      return (
        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">
          🔴 Live
        </span>
      );
    } else if (status === "ended") {
      return (
        <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm">
          Ended
        </span>
      );
    } else if (classTime <= now) {
      return (
        <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
          Ready to Join
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
          Scheduled
        </span>
      );
    }
  };

  const canJoin = (status, scheduledAt) => {
    const now = new Date();
    const classTime = new Date(scheduledAt);
    return status === "live" || (status === "scheduled" && classTime <= now);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-secondary-500 animate-pulse"
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
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading live classes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />
      {/* Header with Navigation */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="h-14 w-14 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-2xl shadow-lg flex items-center justify-center group hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                  {user?.name}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className="flex items-center font-medium">
                    <svg
                      className="h-4 w-4 mr-1 text-secondary-500"
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
                    {user?.role}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>
            {/* Right side - Navigation & Logout */}
            <div className="flex items-center space-x-2">
              <Link
                to={
                  user?.role === "Teacher"
                    ? "/teacher-dashboard"
                    : "/student-dashboard"
                }
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                to="/my-courses"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-gray-100"
              >
                My Courses
              </Link>
              <Link
                to="/live-classes"
                className="text-secondary-600 bg-secondary-50 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-secondary-200 flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-1"
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
                Live Classes
              </Link>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 flex items-center"
              >
                <svg
                  className="h-5 w-5 mr-1"
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
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center font-medium"
              >
                <svg
                  className="h-5 w-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-12 w-12 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="h-7 w-7 text-white"
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
                <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                  Live Classes
                </h1>
              </div>
              <p className="text-gray-600 text-lg ml-15">
                {user?.role === "Teacher"
                  ? "Schedule and manage your live classes"
                  : "Join upcoming live classes for your enrolled courses"}
              </p>
            </div>
            {user?.role === "Teacher" && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Schedule New Class
              </button>
            )}
          </div>
        </div>

        {/* Live Classes Grid */}
        {liveClasses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center animate-fade-in">
            <div className="h-28 w-28 bg-gradient-to-br from-secondary-100 to-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
              <svg
                className="h-16 w-16 text-secondary-500"
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
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">
              No live classes
            </h3>
            <p className="text-gray-600 text-lg">
              {user?.role === "Teacher"
                ? "Schedule your first live class to get started"
                : "Check back later for upcoming live classes"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveClasses.map((liveClass, idx) => (
              <div
                key={liveClass._id}
                className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-display font-bold text-gray-900 flex-1 pr-2">
                      {liveClass.title}
                    </h3>
                    {getStatusBadge(liveClass.status, liveClass.scheduledAt)}
                  </div>

                  <p className="text-gray-600 mb-5 line-clamp-2 min-h-[48px]">
                    {liveClass.description || "No description provided"}
                  </p>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center text-sm text-gray-700 bg-primary-50 px-3 py-2 rounded-lg">
                      <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="h-4 w-4 text-primary-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">
                        {new Date(liveClass.scheduledAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(liveClass.scheduledAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-700 bg-accent-50 px-3 py-2 rounded-lg">
                      <div className="h-8 w-8 bg-accent-100 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="h-4 w-4 text-accent-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">
                        {liveClass.duration} minutes
                      </span>
                    </div>

                    {liveClass.course && (
                      <div className="flex items-center text-sm text-gray-700 bg-secondary-50 px-3 py-2 rounded-lg">
                        <div className="h-8 w-8 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
                          <svg
                            className="h-4 w-4 text-secondary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <span className="font-medium truncate">
                          {typeof liveClass.course === "string"
                            ? liveClass.course
                            : liveClass.course.title}
                        </span>
                      </div>
                    )}

                    {liveClass.teacher && user?.role === "Student" && (
                      <div className="flex items-center text-sm text-gray-700 bg-success-50 px-3 py-2 rounded-lg">
                        <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center mr-3">
                          <svg
                            className="h-4 w-4 text-success-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="font-medium truncate">
                          {typeof liveClass.teacher === "string"
                            ? liveClass.teacher
                            : liveClass.teacher.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {canJoin(liveClass.status, liveClass.scheduledAt) && (
                      <button
                        onClick={() => handleJoin(liveClass._id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Join Now
                      </button>
                    )}
                    {user?.role === "Teacher" &&
                      liveClass.status === "scheduled" && (
                        <button
                          onClick={() => handleDelete(liveClass._id)}
                          className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-700 rounded-xl font-semibold hover:from-red-100 hover:to-red-200 transition-all hover:scale-105"
                        >
                          Delete
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="h-7 w-7 text-white"
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
              <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                Schedule Live Class
              </h2>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSchedule} className="space-y-5">
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg
                    className="h-5 w-5 text-secondary-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  Course *
                </label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg
                    className="h-5 w-5 text-primary-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                  placeholder="Introduction to React Hooks"
                />
              </div>

              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg
                    className="h-5 w-5 text-accent-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all resize-none"
                  placeholder="Brief description of the class..."
                />
              </div>

              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg
                    className="h-5 w-5 text-success-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                />
              </div>

              <div
                className="animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <svg
                    className="h-5 w-5 text-warning-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  max="240"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
                />
              </div>

              <div
                className="flex space-x-3 pt-4 animate-fade-in-up"
                style={{ animationDelay: "0.6s" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setError("");
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary-600 to-primary-600 hover:from-secondary-700 hover:to-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? "Scheduling..." : "Schedule Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClasses;
