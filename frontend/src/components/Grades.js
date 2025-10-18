import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { enrollmentAPI, submissionAPI } from "../api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Grades = () => {
  const [user, setUser] = useState(null);
  const [grades, setGrades] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [courses, setCourses] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'table', 'bar', 'line', 'stats'
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch graded submissions and enrolled courses
    const fetchGradesAndCourses = async () => {
      try {
        // 1) Fetch my submissions (graded only)
        const subRes = await submissionAPI.getMySubmissions();
        const gradedSubmissions =
          subRes.data.submissions?.filter(
            (sub) =>
              sub.grade !== undefined &&
              sub.grade !== null &&
              sub.status === "graded"
          ) || [];
        setGrades(gradedSubmissions);

        // 2) Fetch my enrollments and extract unique courses (by _id)
        const enrRes = await enrollmentAPI.getMyEnrollments();
        const enrolledCoursesRaw = (enrRes.data.enrollments || [])
          .map((e) => e.course)
          .filter(Boolean);
        const seen = new Set();
        const uniqueCourses = [];
        for (const c of enrolledCoursesRaw) {
          const id = c?._id?.toString();
          if (id && !seen.has(id)) {
            seen.add(id);
            uniqueCourses.push(c);
          }
        }
        // Optional: sort by title
        uniqueCourses.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setCourses(uniqueCourses);
      } catch (error) {
        console.error("Failed to fetch grades or courses:", error);
      }
    };
    if (user) {
      fetchGradesAndCourses();
    }
  }, [user]);

  // Filter grades by selected course
  const filteredGrades =
    selectedCourse === "all"
      ? grades
      : grades.filter((g) => g.assignment?.course?._id === selectedCourse);

  // Calculate statistics
  const calculateStats = () => {
    if (filteredGrades.length === 0) return null;

    const scores = filteredGrades.map((g) => g.grade);
    const totalPoints = filteredGrades.map(
      (g) => g.assignment?.totalPoints || 100
    );
    const percentages = filteredGrades.map(
      (g) => (g.grade / (g.assignment?.totalPoints || 100)) * 100
    );

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgPercentage =
      percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const totalEarned = scores.reduce((a, b) => a + b, 0);
    const totalPossible = totalPoints.reduce((a, b) => a + b, 0);

    return {
      avgScore: avgScore.toFixed(1),
      avgPercentage: avgPercentage.toFixed(1),
      maxScore,
      minScore,
      totalEarned,
      totalPossible,
      count: filteredGrades.length,
    };
  };

  const stats = calculateStats();

  // Prepare chart data for Bar Chart
  const barChartData = {
    labels: filteredGrades.map((g) => g.assignment?.title || "Assignment"),
    datasets: [
      {
        label: "Score",
        data: filteredGrades.map((g) => g.grade),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
      {
        label: "Total Points",
        data: filteredGrades.map((g) => g.assignment?.totalPoints || 100),
        backgroundColor: "rgba(229, 231, 235, 0.6)",
        borderColor: "rgba(156, 163, 175, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Prepare chart data for Line Chart (showing trend)
  const lineChartData = {
    labels: filteredGrades.map((g, idx) => `Assignment ${idx + 1}`),
    datasets: [
      {
        label: "Score Percentage",
        data: filteredGrades.map(
          (g) => (g.grade / (g.assignment?.totalPoints || 100)) * 100
        ),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
      },
      {
        label: "Average Line",
        data: Array(filteredGrades.length).fill(
          stats ? stats.avgPercentage : 0
        ),
        borderColor: "rgba(239, 68, 68, 0.5)",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  // Prepare Doughnut chart for grade distribution
  const gradeDistribution = () => {
    const ranges = {
      "90-100%": 0,
      "80-89%": 0,
      "70-79%": 0,
      "60-69%": 0,
      "Below 60%": 0,
    };

    filteredGrades.forEach((g) => {
      const percentage = (g.grade / (g.assignment?.totalPoints || 100)) * 100;
      if (percentage >= 90) ranges["90-100%"]++;
      else if (percentage >= 80) ranges["80-89%"]++;
      else if (percentage >= 70) ranges["70-79%"]++;
      else if (percentage >= 60) ranges["60-69%"]++;
      else ranges["Below 60%"]++;
    });

    return {
      labels: Object.keys(ranges),
      datasets: [
        {
          data: Object.values(ranges),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(251, 191, 36, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Assignment Scores Visualization",
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: "Score Trend Over Time",
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Grade Distribution",
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Grades & Analytics
          </h1>
          <Link
            to={
              user.role === "Teacher"
                ? "/teacher-dashboard"
                : "/student-dashboard"
            }
            className="text-primary-600 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and View Toggle */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Course Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "table"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📋 Table
              </button>
              <button
                onClick={() => setViewMode("bar")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "bar"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📊 Bar Chart
              </button>
              <button
                onClick={() => setViewMode("line")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "line"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📈 Line Chart
              </button>
              <button
                onClick={() => setViewMode("stats")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === "stats"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📉 Statistics
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Average Score</div>
              <div className="text-3xl font-bold">{stats.avgPercentage}%</div>
              <div className="text-sm opacity-75 mt-1">
                {stats.avgScore} pts average
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Highest Score</div>
              <div className="text-3xl font-bold">{stats.maxScore}</div>
              <div className="text-sm opacity-75 mt-1">Best performance</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Lowest Score</div>
              <div className="text-3xl font-bold">{stats.minScore}</div>
              <div className="text-sm opacity-75 mt-1">Needs improvement</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="text-sm opacity-90 mb-1">Total Points</div>
              <div className="text-3xl font-bold">
                {stats.totalEarned}/{stats.totalPossible}
              </div>
              <div className="text-sm opacity-75 mt-1">
                {stats.count} assignments
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {filteredGrades.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="h-24 w-24 mx-auto text-gray-300 mb-4"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Graded Assignments
            </h3>
            <p className="text-gray-500">
              {selectedCourse === "all"
                ? "You don't have any graded assignments yet."
                : "No graded assignments found for this course."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Table View */}
            {viewMode === "table" && (
              <div>
                <h2 className="text-xl font-bold mb-4">Your Grades</h2>
                <div className="overflow-x-auto">
                  <ul className="space-y-4">
                    {filteredGrades.map((g) => (
                      <li key={g._id} className="border-b pb-4 last:border-b-0">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg">
                              {g.assignment?.title || "Assignment"}
                            </div>
                            <div className="text-gray-600 text-sm mt-1">
                              Course: {g.assignment?.course?.title || "N/A"}
                            </div>
                            <div className="text-gray-600 text-sm">
                              Submitted:{" "}
                              {new Date(g.submittedAt).toLocaleDateString()}
                              {g.isLate && (
                                <span className="ml-2 text-red-600 font-medium">
                                  (Late)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right md:ml-4">
                            <div className="text-3xl font-bold text-primary-600">
                              {g.grade}
                              <span className="text-sm text-gray-500">
                                /{g.assignment?.totalPoints || 100}
                              </span>
                            </div>
                            <div className="text-lg text-gray-500">
                              {(
                                (g.grade / (g.assignment?.totalPoints || 100)) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        </div>
                        {g.feedback && (
                          <div className="mt-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">💬 Feedback: </span>
                            {g.feedback}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Bar Chart View */}
            {viewMode === "bar" && (
              <div style={{ height: "500px" }}>
                <Bar data={barChartData} options={chartOptions} />
              </div>
            )}

            {/* Line Chart View */}
            {viewMode === "line" && (
              <div style={{ height: "500px" }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            )}

            {/* Statistics View */}
            {viewMode === "stats" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div style={{ height: "400px" }}>
                  <Doughnut
                    data={gradeDistribution()}
                    options={doughnutOptions}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">
                    Detailed Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="text-sm text-gray-600">
                        Average Performance
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.avgPercentage}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats.avgScore} points on average
                      </div>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="text-sm text-gray-600">
                        Total Points Earned
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.totalEarned} / {stats.totalPossible}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(
                          (stats.totalEarned / stats.totalPossible) *
                          100
                        ).toFixed(1)}
                        % of total possible points
                      </div>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="text-sm text-gray-600">
                        Assignments Completed
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.count}
                      </div>
                      <div className="text-sm text-gray-500">
                        Graded assignments
                      </div>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <div className="text-sm text-gray-600">Score Range</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.minScore} - {stats.maxScore}
                      </div>
                      <div className="text-sm text-gray-500">
                        Lowest to highest score
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Grades;
