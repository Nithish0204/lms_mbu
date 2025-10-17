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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const dashboardLink =
    user.role === "Teacher" ? "/teacher-dashboard" : "/student-dashboard";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-sm text-gray-600">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to={dashboardLink}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-150"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-8 py-12 text-center">
            <div className="h-24 w-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-primary-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{user.name}</h2>
            <p className="text-white text-opacity-90 mt-2">{user.role}</p>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Profile Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-32 text-sm font-medium text-gray-600">
                  Name:
                </div>
                <div className="flex-1 text-gray-900">{user.name}</div>
              </div>

              <div className="flex items-start">
                <div className="w-32 text-sm font-medium text-gray-600">
                  Email:
                </div>
                <div className="flex-1 text-gray-900">{user.email}</div>
              </div>

              <div className="flex items-start">
                <div className="w-32 text-sm font-medium text-gray-600">
                  Role:
                </div>
                <div className="flex-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === "Teacher"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-32 text-sm font-medium text-gray-600">
                  User ID:
                </div>
                <div className="flex-1 text-gray-900 font-mono text-sm">
                  {user._id || user.id}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t flex space-x-4">
              <button className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition duration-150">
                Edit Profile
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition duration-150">
                Change Password
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-blue-500 mr-2"
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
                <p className="text-sm text-blue-700">
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
