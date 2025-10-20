import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const updatedData = { ...formData, [e.target.name]: e.target.value };
    setFormData(updatedData);
    console.log(
      "📝 [Register] Form input changed:",
      e.target.name,
      "=",
      e.target.value === formData.password ? "***" : e.target.value
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== [REGISTER] Form submission started ===");
    console.log("📤 [Register] Submitting registration:", {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      password: "***",
    });

    setError("");
    setLoading(true);

    try {
      console.log("🔄 [Register] Calling API...");
      const response = await authAPI.register(formData);
      console.log("✅ [Register] API response received:", response.data);

      // OTP flow: Show OTP input, don't log in yet
      setShowOtp(true);
      setRegisteredEmail(formData.email);
      setError("");
    } catch (err) {
      console.error("❌ [Register] Error occurred:", err);
      console.error("❌ [Register] Error response:", err.response?.data);
      console.error("❌ [Register] Error message:", err.message);
      setError(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
      console.log("=== [REGISTER] Form submission completed ===\n");
    }
  };

  // OTP verification handler
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpLoading(true);
    try {
      const response = await authAPI.verifyOtp({ email: registeredEmail, otp });
      setOtpError("");
      // On success, store token and user, redirect to dashboard
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "Teacher") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      setOtpError(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "OTP verification failed."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Illustration/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-600 via-secondary-700 to-secondary-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float"></div>
          <div
            className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float"
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
              Start Your
              <br />
              Learning Journey
            </h1>
            <p className="text-xl text-secondary-100 mb-12 leading-relaxed">
              Join thousands of students and teachers building their future with
              Hubexus LMS.
            </p>

            {/* Benefits list */}
            <div className="space-y-5">
              {[
                {
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                  text: "Get started in 2 minutes",
                  desc: "Quick & easy registration",
                },
                {
                  icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                  text: "Access premium content",
                  desc: "100% free, forever",
                },
                {
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  text: "Secure & verified",
                  desc: "Email verification required",
                },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-start animate-fade-in-right"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={benefit.icon}
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {benefit.text}
                    </div>
                    <div className="text-sm text-secondary-100">
                      {benefit.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form - Compact & Responsive */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12 overflow-y-auto">
        <div className="max-w-md w-full animate-fade-in-up">
          {!showOtp ? (
            <>
              {/* Header - Smaller on mobile */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2 sm:mb-3">
                  Create Account
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Join our learning community today
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
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="group">
                  <label
                    htmlFor="name"
                    className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-secondary-500 transition-colors"
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
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field pl-10 sm:pl-12"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

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
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-secondary-500 transition-colors"
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
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-secondary-500 transition-colors"
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
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      minLength={6}
                      className="input-field pl-10 sm:pl-12"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="role"
                    className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2"
                  >
                    I am a
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-secondary-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="input-field pl-10 sm:pl-12 appearance-none cursor-pointer"
                    >
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="pt-1 sm:pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-secondary w-full flex justify-center items-center"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
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
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-3 sm:px-4 bg-gray-50 text-gray-500 font-medium">
                      Already registered?
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-secondary-600 rounded-xl text-sm sm:text-base font-semibold text-secondary-600 hover:bg-secondary-50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Sign In Instead
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
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* OTP Verification View */}
              <div className="mb-6 sm:mb-8 text-center animate-fade-in">
                <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-secondary-500/30">
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-white"
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
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-2 sm:mb-3">
                  Verify Your Email
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">
                  We've sent a 6-digit OTP to
                </p>
                <p className="text-base sm:text-lg font-semibold text-secondary-600 mb-6 sm:mb-8">
                  {registeredEmail}
                </p>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  If you don't see the OTP in your inbox, please check your
                  spam/junk or promotions folder — emails may land in your Inbox
                  or Spam.
                </p>
              </div>

              {otpError && (
                <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 animate-fade-in">
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
                    <div className="ml-3">
                      <p className="text-xs sm:text-sm font-medium text-red-800">
                        {otpError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleOtpSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div className="group">
                  <label
                    htmlFor="otp"
                    className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2 text-center"
                  >
                    Enter OTP Code
                  </label>
                  <div className="relative">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      minLength={6}
                      className="appearance-none block w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-center text-xl sm:text-2xl font-bold tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="btn-secondary w-full flex justify-center items-center"
                  >
                    {otpLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Continue
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center text-xs sm:text-sm text-gray-600">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="font-semibold text-secondary-600 hover:text-secondary-700 transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
