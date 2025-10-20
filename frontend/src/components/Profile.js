import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-secondary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-secondary-500 animate-pulse"
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
        </div>
      </div>
    );
  }

  const dashboardLink =
    user.role === "Teacher" ? "/teacher-dashboard" : "/student-dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/20 to-secondary-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-2xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                <span className="text-white font-display font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                  {user.name}
                </h1>
                <p className="text-sm text-gray-600 font-medium">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to={dashboardLink}
                className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-xl font-medium transition-all"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-secondary-500 via-primary-500 to-accent-500 px-8 py-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="h-28 w-28 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-2xl animate-scale-in hover:scale-110 transition-transform">
                <span className="text-5xl font-display font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-4xl font-display font-bold text-white mt-6 drop-shadow-lg">
                {user.name}
              </h2>
              <p className="text-white/90 text-lg font-medium mt-2">
                {user.role}
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="h-7 w-7 text-white"
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
              <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Profile Information
              </h3>
            </div>

            <div className="space-y-4">
              <div
                className="bg-primary-50 border-2 border-primary-200 rounded-xl p-5 flex items-center space-x-4 hover:shadow-lg transition-all animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-primary-600"
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
                <div className="flex-1">
                  <div className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-1">
                    Name
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {user.name}
                  </div>
                </div>
              </div>

              <div
                className="bg-secondary-50 border-2 border-secondary-200 rounded-xl p-5 flex items-center space-x-4 hover:shadow-lg transition-all animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="h-12 w-12 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-secondary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-secondary-600 uppercase tracking-wide mb-1">
                    Email
                  </div>
                  <div className="text-lg font-medium text-gray-900 break-all">
                    {user.email}
                  </div>
                </div>
              </div>

              <div
                className="bg-success-50 border-2 border-success-200 rounded-xl p-5 flex items-center space-x-4 hover:shadow-lg transition-all animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="h-12 w-12 bg-success-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-success-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-success-600 uppercase tracking-wide mb-1">
                    Role
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-xl text-base font-bold shadow-md ${
                        user.role === "Teacher"
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white"
                          : "bg-gradient-to-r from-success-500 to-success-600 text-white"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="bg-accent-50 border-2 border-accent-200 rounded-xl p-5 flex items-center space-x-4 hover:shadow-lg transition-all animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="h-12 w-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-accent-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-accent-600 uppercase tracking-wide mb-1">
                    User ID
                  </div>
                  <div className="text-base font-mono text-gray-700 bg-white px-3 py-2 rounded-lg border border-accent-200 break-all">
                    {user._id || user.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <button className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Profile</span>
              </button>
              <button className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center space-x-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Change Password</span>
              </button>
            </div>

            {/* Info Note */}
            <div
              className="mt-6 p-5 bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-primary-700 font-medium">
                  Note: Profile editing functionality will be implemented soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
