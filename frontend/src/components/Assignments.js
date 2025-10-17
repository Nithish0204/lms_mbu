import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assignmentAPI } from "../api";

const Assignments = () => {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
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
    // Fetch assignments using centralized API
    const fetchAssignments = async () => {
      try {
        const response = await assignmentAPI.getMyAssignments();
        setAssignments(response.data.assignments || []);
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
      }
    };
    if (user) {
      fetchAssignments();
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
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
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
          <h2 className="text-xl font-bold mb-4">Your Assignments</h2>
          {assignments.length === 0 ? (
            <div className="text-gray-500">No assignments found.</div>
          ) : (
            <ul className="space-y-4">
              {assignments.map((a) => (
                <li key={a._id} className="border-b pb-2">
                  <div className="font-semibold text-gray-900">{a.title}</div>
                  <div className="text-gray-600 text-sm">Due: {a.dueDate}</div>
                  <div className="text-gray-700 mt-1">{a.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assignments;
