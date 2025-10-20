import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const updatedData = { ...formData, [e.target.name]: e.target.value };
    setFormData(updatedData);
    console.log(
      "📝 [Login] Form input changed:",
      e.target.name,
      "=",
      e.target.value
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== [LOGIN] Form submission started ===");
    console.log("📤 [Login] Submitting credentials:", {
      email: formData.email,
      password: "***",
    });

    setError("");
    setLoading(true);

    try {
      console.log("🔄 [Login] Calling API...");
      const response = await authAPI.login(formData);
      console.log("✅ [Login] API response received:", response.data);

      const { token, user } = response.data;
      console.log(
        "🔑 [Login] Token received:",
        token ? "Yes (length: " + token.length + ")" : "No"
      );
      console.log("👤 [Login] User data:", JSON.stringify(user, null, 2));

      // Store token and user data
      console.log("💾 [Login] Storing token in localStorage...");
      localStorage.setItem("token", token);
      console.log("💾 [Login] Storing user data in localStorage...");
      localStorage.setItem("user", JSON.stringify(user));
      console.log("✅ [Login] Data stored successfully in localStorage");

      console.log(
        "✅ [Login] Login successful for user:",
        user.name,
        "| Role:",
        user.role
      );

      // Navigate based on role
      if (user.role === "Teacher") {
        console.log("🚀 [Login] Navigating to teacher dashboard...");
        navigate("/teacher-dashboard");
      } else {
        console.log("🚀 [Login] Navigating to student dashboard...");
        navigate("/student-dashboard");
      }
    } catch (err) {
      console.error("❌ [Login] Error occurred:", err);
      console.error("❌ [Login] Error response:", err.response?.data);
      console.error("❌ [Login] Error message:", err.message);
      setError(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
      console.log("=== [LOGIN] Form submission completed ===\n");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Illustration/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="animate-fade-in-up">
            {/* Logo/Brand */}
            <div className="flex items-center mb-8">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                <svg
                  className="h-8 w-8 text-white"
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
              <span className="text-2xl font-display font-bold">
                Hubexus LMS
              </span>
            </div>

            <h1 className="text-5xl font-display font-bold mb-6 leading-tight">
              Welcome Back to
              <br />
              Your Learning Hub
            </h1>
            <p className="text-xl text-primary-100 mb-12 leading-relaxed">
              Access your courses, track your progress, and continue your
              journey to excellence.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                {
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "Secure & Private",
                },
                {
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                  text: "Lightning Fast Access",
                },
                {
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "Real-time Updates",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center animate-fade-in-right"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={feature.icon}
                      />
                    </svg>
                  </div>
                  <span className="text-lg text-primary-50">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form - Compact & Responsive */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12">
        <div className="max-w-md w-full animate-fade-in-up">
          {/* Header - Smaller on mobile */}
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2 sm:mb-3">
              Sign In
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Alert - Compact */}
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form - Compact spacing */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5 lg:space-y-6"
          >
            <div className="group">
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10 sm:pl-12"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors"
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
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="input-field pl-10 sm:pl-12"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg
                      className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 sm:mt-8 mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500 font-medium">
                  New to Hubexus?
                </span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border-2 border-primary-600 rounded-xl text-base font-semibold text-primary-600 hover:bg-primary-50 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Create Account
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
