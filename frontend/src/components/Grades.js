import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Grades = () => {
  const [user, setUser] = useState(null);
  const [grades, setGrades] = useState([]);
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
    // Fetch graded submissions
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5001/api/submissions/my-submissions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // Filter only graded submissions
        const gradedSubmissions =
          response.data.submissions?.filter(
            (sub) => sub.grade !== undefined && sub.grade !== null
          ) || [];
        setGrades(gradedSubmissions);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      }
    };
    if (user) {
      fetchGrades();
    }
  }, [user]);

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
          <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
          <Link
            to={
              user.role === "Teacher"
                ? "/teacher-dashboard"
                : "/student-dashboard"
            }
            className="text-primary-600 hover:underline"
          >
            Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold mb-4">Your Grades</h2>
          {grades.length === 0 ? (
            <div className="text-gray-500">No grades found.</div>
          ) : (
            <ul className="space-y-4">
              {grades.map((g) => (
                <li key={g._id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
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
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-primary-600">
                        {g.grade}
                        <span className="text-sm text-gray-500">
                          /{g.assignment?.totalPoints || 100}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {(
                          (g.grade / (g.assignment?.totalPoints || 100)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                  {g.feedback && (
                    <div className="mt-2 text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Feedback: </span>
                      {g.feedback}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Grades;
