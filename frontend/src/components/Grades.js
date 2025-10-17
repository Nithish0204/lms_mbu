import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gradeAPI } from "../api";

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
    // Fetch grades using centralized API
    const fetchGrades = async () => {
      try {
        const response = await gradeAPI.getMyGrades();
        setGrades(response.data.grades || []);
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
                <li key={g._id} className="border-b pb-2">
                  <div className="font-semibold text-gray-900">
                    {g.courseTitle}
                  </div>
                  <div className="text-gray-600 text-sm">Grade: {g.grade}</div>
                  <div className="text-gray-700 mt-1">{g.comments}</div>
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
