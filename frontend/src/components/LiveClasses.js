import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { liveClassAPI, courseAPI } from "../api";

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
      await liveClassAPI.createLiveClass(formData);
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
    if (window.confirm("Are you sure you want to delete this live class?")) {
      try {
        await liveClassAPI.deleteLiveClass(liveClassId);
        fetchData(user.role);
      } catch (err) {
        alert("Failed to delete live class");
      }
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.name}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
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
                  <span className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
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
            <div className="flex items-center space-x-4">
              <Link
                to={
                  user?.role === "Teacher"
                    ? "/teacher-dashboard"
                    : "/student-dashboard"
                }
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
              >
                Dashboard
              </Link>
              <Link
                to="/my-courses"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
              >
                My Courses
              </Link>
              <Link
                to="/live-classes"
                className="text-primary-600 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center border-b-2 border-primary-600"
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
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150 flex items-center"
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
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-150 flex items-center"
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
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
              <p className="mt-2 text-gray-600">
                {user?.role === "Teacher"
                  ? "Schedule and manage your live classes"
                  : "Join upcoming live classes for your enrolled courses"}
              </p>
            </div>
            {user?.role === "Teacher" && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Schedule New Class</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Classes Grid */}
        {liveClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No live classes
            </h3>
            <p className="mt-2 text-gray-600">
              {user?.role === "Teacher"
                ? "Schedule your first live class to get started"
                : "Check back later for upcoming live classes"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveClasses.map((liveClass) => (
              <div
                key={liveClass._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {liveClass.title}
                    </h3>
                    {getStatusBadge(liveClass.status, liveClass.scheduledAt)}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {liveClass.description || "No description provided"}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {new Date(liveClass.scheduledAt).toLocaleDateString()} at{" "}
                      {new Date(liveClass.scheduledAt).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {liveClass.duration} minutes
                    </div>
                    {liveClass.course && (
                      <div className="flex items-center text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        {typeof liveClass.course === "string"
                          ? liveClass.course
                          : liveClass.course.title}
                      </div>
                    )}
                    {liveClass.teacher && user?.role === "Student" && (
                      <div className="flex items-center text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {typeof liveClass.teacher === "string"
                          ? liveClass.teacher
                          : liveClass.teacher.name}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {canJoin(liveClass.status, liveClass.scheduledAt) && (
                      <button
                        onClick={() => handleJoin(liveClass._id)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center space-x-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span>Join Now</span>
                      </button>
                    )}
                    {user?.role === "Teacher" &&
                      liveClass.status === "scheduled" && (
                        <button
                          onClick={() => handleDelete(liveClass._id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Schedule Live Class
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500"
                  placeholder="Introduction to React Hooks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500"
                  placeholder="Brief description of the class..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50"
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
