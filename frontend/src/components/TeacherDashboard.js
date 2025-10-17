import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { courseAPI, enrollmentAPI, assignmentAPI, submissionAPI } from "../api";

// Assignment Card Component
const AssignmentCard = ({
  assignment,
  submissions = [],
  onDelete,
  deleting,
}) => {
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(
    (s) => s.grade !== null && s.grade !== undefined
  ).length;
  const pendingSubmissions = totalSubmissions - gradedSubmissions;
  const isOverdue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 mb-1">
              {assignment.title}
            </h3>
            {assignment.status === "published" ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Published
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                Draft
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {assignment.description}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
              {isOverdue && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  Overdue
                </span>
              )}
            </div>
            <div className="flex items-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{assignment.totalPoints} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Stats */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {totalSubmissions}
            </p>
            <p className="text-xs text-gray-600">Total Submissions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {gradedSubmissions}
            </p>
            <p className="text-xs text-gray-600">Graded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {pendingSubmissions}
            </p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Link
          to={`/view-submissions/${assignment._id}`}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2 rounded-lg text-sm font-medium transition"
        >
          {pendingSubmissions > 0 ? (
            <>Grade ({pendingSubmissions})</>
          ) : totalSubmissions > 0 ? (
            "View All"
          ) : (
            "View"
          )}
        </Link>
        <button
          onClick={() => onDelete(assignment._id, assignment.title)}
          disabled={deleting}
          className="px-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center"
        >
          {deleting ? (
            <svg
              className="animate-spin h-4 w-4"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [submissionStats, setSubmissionStats] = useState({
    total: 0,
    pending: 0, // Students who haven't submitted
    late: 0, // Students who submitted late
    done: 0, // Students who submitted on time
    ungraded: 0, // Submissions that need grading
  });
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]); // Students who haven't submitted any assignments
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [deletingAssignment, setDeletingAssignment] = useState({});
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [modalSubmissions, setModalSubmissions] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [
    selectedAssignmentForSubmissions,
    setSelectedAssignmentForSubmissions,
  ] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [removingStudent, setRemovingStudent] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    console.log("=== [TeacherDashboard] Component mounted ===");
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    console.log(
      "📦 [TeacherDashboard] Retrieved from localStorage:",
      userData ? "User data found" : "No user data"
    );

    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log(
        "👤 [TeacherDashboard] Parsed user:",
        JSON.stringify(parsedUser, null, 2)
      );
      setUser(parsedUser);
      console.log("✅ [TeacherDashboard] User state set");
    } else {
      console.log("❌ [TeacherDashboard] No user data, redirecting to login");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch teacher's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      console.log("=== [TeacherDashboard] Fetching courses ===");
      setLoading(true);

      try {
        console.log("🔄 [TeacherDashboard] Calling courseAPI.getMyCourses...");
        const response = await courseAPI.getMyCourses();
        console.log("✅ [TeacherDashboard] Courses response:", response.data);

        const coursesData = response.data.courses || [];
        setCourses(coursesData);
        console.log(
          `✅ [TeacherDashboard] Loaded ${coursesData.length} courses`
        );
        console.log(
          "📋 [TeacherDashboard] Courses:",
          JSON.stringify(coursesData, null, 2)
        );

        // Fetch enrollment counts for each course
        fetchEnrollmentCounts(coursesData);
      } catch (error) {
        console.error("❌ [TeacherDashboard] Error fetching courses:", error);
        console.error(
          "❌ [TeacherDashboard] Error response:",
          error.response?.data
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const fetchEnrollmentCounts = async (coursesData) => {
    console.log("=== [TeacherDashboard] Fetching enrollment counts ===");
    const counts = {};

    for (const course of coursesData) {
      try {
        const response = await enrollmentAPI.getCourseEnrollments(course._id);
        counts[course._id] = response.data.count || 0;
        console.log(
          `✅ Course ${course.title}: ${counts[course._id]} students`
        );
      } catch (error) {
        console.error(
          `❌ Error fetching enrollments for course ${course._id}:`,
          error
        );
        counts[course._id] = 0;
      }
    }

    setEnrollmentCounts(counts);
    console.log("✅ [TeacherDashboard] Enrollment counts loaded:", counts);
  };

  const fetchAssignmentsAndSubmissions = async () => {
    console.log(
      "=== [TeacherDashboard] Fetching assignments and submissions ==="
    );
    try {
      // Fetch all teacher's assignments
      const assignmentsRes = await assignmentAPI.getMyAssignments();
      const teacherAssignments = assignmentsRes.data.assignments || [];
      setAssignments(teacherAssignments);
      console.log(`✅ Found ${teacherAssignments.length} assignments`);

      // Fetch submission stats for each assignment
      let totalEnrolled = 0;
      let totalSubmitted = 0;
      let lateSubmissions = 0;
      let doneSubmissions = 0;
      let ungradedSubmissions = 0;
      const submissionsMap = {};
      const allSubmissionsList = [];
      const allPendingStudents = [];

      for (const assignment of teacherAssignments) {
        try {
          // Get enrolled students for this course
          const courseId =
            typeof assignment.course === "object"
              ? assignment.course._id
              : assignment.course;

          const enrollmentsRes = await enrollmentAPI.getCourseEnrollments(
            courseId
          );
          const enrolledCount = enrollmentsRes.data.count || 0;
          const enrolledStudents = enrollmentsRes.data.enrollments || [];

          // Get submissions for this assignment
          const submissionsRes = await submissionAPI.getSubmissionsByAssignment(
            assignment._id
          );
          const submissions = submissionsRes.data.submissions || [];
          submissionsMap[assignment._id] = submissions;

          // Add assignment info to each submission for display
          const submissionsWithAssignment = submissions.map((s) => ({
            ...s,
            assignmentTitle: assignment.title,
            assignmentDueDate: assignment.dueDate,
          }));
          allSubmissionsList.push(...submissionsWithAssignment);

          // Find students who haven't submitted this assignment
          const submittedStudentIds = submissions.map((s) =>
            typeof s.student === "object" ? s.student._id : s.student
          );

          const pendingForThisAssignment = enrolledStudents
            .filter((enrollment) => {
              const studentId =
                typeof enrollment.student === "object"
                  ? enrollment.student._id
                  : enrollment.student;
              return !submittedStudentIds.includes(studentId);
            })
            .map((enrollment) => ({
              student: enrollment.student,
              assignmentTitle: assignment.title,
              assignmentId: assignment._id,
              dueDate: assignment.dueDate,
              courseTitle:
                typeof assignment.course === "object"
                  ? assignment.course.title
                  : "Course",
            }));

          allPendingStudents.push(...pendingForThisAssignment);

          // Calculate stats
          totalEnrolled += enrolledCount;
          totalSubmitted += submissions.length;
          lateSubmissions += submissions.filter((s) => s.isLate).length;
          doneSubmissions += submissions.filter((s) => !s.isLate).length;
          ungradedSubmissions += submissions.filter(
            (s) => s.grade === null || s.grade === undefined
          ).length;
        } catch (error) {
          console.error(
            `❌ Error fetching submissions for assignment ${assignment._id}:`,
            error
          );
          submissionsMap[assignment._id] = [];
        }
      }

      const pendingCount = totalEnrolled - totalSubmitted;

      setAssignmentSubmissions(submissionsMap);
      setAllSubmissions(allSubmissionsList);
      setPendingStudents(allPendingStudents);
      setSubmissionStats({
        total: totalSubmitted,
        pending: pendingCount > 0 ? pendingCount : 0,
        late: lateSubmissions,
        done: doneSubmissions,
        ungraded: ungradedSubmissions,
      });
      console.log(
        `✅ Submission stats - Total Enrolled: ${totalEnrolled}, Submitted: ${totalSubmitted}, Pending: ${pendingCount}, Late: ${lateSubmissions}, Done: ${doneSubmissions}, Ungraded: ${ungradedSubmissions}, Pending Students: ${allPendingStudents.length}`
      );
    } catch (error) {
      console.error("❌ Error fetching assignments/submissions:", error);
    }
  };

  // Fetch assignments when user is loaded
  useEffect(() => {
    if (user && user.role === "Teacher") {
      fetchAssignmentsAndSubmissions();
    }
  }, [user]);

  // Refresh data when page becomes visible (e.g., returning from grading page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        user &&
        user.role === "Teacher"
      ) {
        console.log("🔄 [TeacherDashboard] Page visible, refreshing data...");
        fetchAssignmentsAndSubmissions();
        if (courses.length > 0) {
          fetchEnrollmentCounts(courses);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, courses]);

  const handleManageStudents = async (course) => {
    console.log(
      "🔍 [TeacherDashboard] Managing students for course:",
      course.title
    );
    setSelectedCourse(course);
    setShowStudentsModal(true);
    setLoadingStudents(true);

    try {
      const response = await enrollmentAPI.getCourseEnrollments(course._id);
      console.log(
        "✅ [TeacherDashboard] Loaded enrolled students:",
        response.data
      );
      setEnrolledStudents(response.data.enrollments || []);
    } catch (error) {
      console.error("❌ [TeacherDashboard] Error loading students:", error);
      alert("Failed to load enrolled students");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${studentName} from this course?`
      )
    ) {
      return;
    }

    console.log(
      `🗑️ [TeacherDashboard] Removing student enrollment ${enrollmentId}...`
    );
    setRemovingStudent({ ...removingStudent, [enrollmentId]: true });

    try {
      await enrollmentAPI.removeStudentFromCourse(enrollmentId);
      console.log("✅ [TeacherDashboard] Student removed successfully");

      // Update local state
      setEnrolledStudents(
        enrolledStudents.filter((enrollment) => enrollment._id !== enrollmentId)
      );

      // Update enrollment count
      if (selectedCourse) {
        setEnrollmentCounts({
          ...enrollmentCounts,
          [selectedCourse._id]: (enrollmentCounts[selectedCourse._id] || 1) - 1,
        });
      }

      // Refresh assignment/submission stats since enrollment affects pending counts
      fetchAssignmentsAndSubmissions();

      alert(`${studentName} has been removed from the course`);
    } catch (err) {
      console.error("❌ [TeacherDashboard] Remove student error:", err);
      alert(err.response?.data?.error || "Failed to remove student");
    } finally {
      setRemovingStudent({ ...removingStudent, [enrollmentId]: false });
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${courseTitle}"? This will also remove all student enrollments.`
      )
    ) {
      return;
    }

    console.log(`🗑️ [TeacherDashboard] Deleting course ${courseId}...`);
    setDeleting({ ...deleting, [courseId]: true });

    try {
      await courseAPI.deleteCourse(courseId);
      console.log("✅ [TeacherDashboard] Course deleted successfully");

      // Remove from local state
      setCourses(courses.filter((course) => course._id !== courseId));
    } catch (err) {
      console.error("❌ [TeacherDashboard] Delete error:", err);
      alert(err.response?.data?.error || "Failed to delete course");
    } finally {
      setDeleting({ ...deleting, [courseId]: false });
    }
  };

  const handleDeleteAssignment = async (assignmentId, assignmentTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${assignmentTitle}"? This will also remove all student submissions.`
      )
    ) {
      return;
    }

    console.log(`🗑️ [TeacherDashboard] Deleting assignment ${assignmentId}...`);
    setDeletingAssignment({ ...deletingAssignment, [assignmentId]: true });

    try {
      await assignmentAPI.deleteAssignment(assignmentId);
      console.log("✅ [TeacherDashboard] Assignment deleted successfully");

      // Remove from local state
      setAssignments(assignments.filter((a) => a._id !== assignmentId));

      // Remove submissions for this assignment
      const updatedSubmissions = { ...assignmentSubmissions };
      delete updatedSubmissions[assignmentId];
      setAssignmentSubmissions(updatedSubmissions);

      // Refresh all stats to ensure accuracy
      fetchAssignmentsAndSubmissions();

      alert("Assignment deleted successfully");
    } catch (err) {
      console.error("❌ [TeacherDashboard] Delete assignment error:", err);
      alert(err.response?.data?.error || "Failed to delete assignment");
    } finally {
      setDeletingAssignment({ ...deletingAssignment, [assignmentId]: false });
    }
  };

  const handleShowPendingSubmissions = () => {
    // Show students who haven't submitted
    setModalSubmissions(pendingStudents);
    setModalTitle(
      `Pending Submissions (${pendingStudents.length} students haven't submitted)`
    );
    setShowSubmissionsModal(true);
  };

  const handleShowLateSubmissions = () => {
    const late = allSubmissions.filter((s) => s.isLate);
    setModalSubmissions(late);
    setModalTitle("Late Submissions");
    setShowSubmissionsModal(true);
  };

  const handleShowDoneSubmissions = () => {
    const done = allSubmissions.filter((s) => !s.isLate);
    setModalSubmissions(done);
    setModalTitle("Done on Time");
    setShowSubmissionsModal(true);
  };

  const handleShowAssignments = () => {
    setShowAssignmentsModal(true);
  };

  const handleShowAssignmentSubmissions = (assignment, submissionType) => {
    const submissions = assignmentSubmissions[assignment._id] || [];
    let filteredSubmissions = [];
    let title = "";

    switch (submissionType) {
      case "total":
        filteredSubmissions = submissions;
        title = `All Submissions - ${assignment.title}`;
        break;
      case "pending":
        filteredSubmissions = submissions.filter(
          (s) => s.grade === null || s.grade === undefined
        );
        title = `Pending Submissions - ${assignment.title}`;
        break;
      case "graded":
        filteredSubmissions = submissions.filter(
          (s) => s.grade !== null && s.grade !== undefined
        );
        title = `Graded Submissions - ${assignment.title}`;
        break;
      default:
        filteredSubmissions = submissions;
        title = `Submissions - ${assignment.title}`;
    }

    const submissionsWithAssignment = filteredSubmissions.map((s) => ({
      ...s,
      assignmentTitle: assignment.title,
      assignmentDueDate: assignment.dueDate,
    }));

    setSelectedAssignmentForSubmissions(assignment);
    setModalSubmissions(submissionsWithAssignment);
    setModalTitle(title);
    setShowAssignmentsModal(false);
    setShowSubmissionsModal(true);
  };

  const handleLogout = () => {
    console.log("=== [TeacherDashboard] Logout initiated ===");
    console.log("🗑️ [TeacherDashboard] Clearing localStorage...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("✅ [TeacherDashboard] localStorage cleared");
    console.log("🚀 [TeacherDashboard] Navigating to login page");
    navigate("/login");
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
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
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Teacher
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
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
            {/* Right side - Navigation & Logout */}
            <div className="flex items-center space-x-4">
              <Link
                to="/teacher-dashboard"
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Courses Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Courses
                </p>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {courses.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Students Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-secondary-600 mt-2">
                  {Object.values(enrollmentCounts).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-secondary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Assignments Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Active Assignments
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {assignments.filter((a) => a.status === "published").length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
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
              </div>
            </div>
          </div>

          {/* Pending Reviews Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Submissions to Grade
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {submissionStats.ungraded || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/create-course"
              className="flex items-center p-4 border-2 border-primary-500 rounded-lg hover:bg-primary-50 transition duration-150"
            >
              <svg
                className="h-8 w-8 text-primary-600 mr-3"
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
              <div>
                <p className="font-semibold text-gray-900">Create Course</p>
                <p className="text-sm text-gray-600">Add a new course</p>
              </div>
            </Link>

            <Link
              to="/live-classes"
              className="flex items-center p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 transition duration-150"
            >
              <svg
                className="h-8 w-8 text-red-600 mr-3"
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
              <div>
                <p className="font-semibold text-gray-900">Live Classes</p>
                <p className="text-sm text-gray-600">Schedule & host classes</p>
              </div>
            </Link>

            <Link
              to="/my-courses"
              className="flex items-center p-4 border-2 border-secondary-500 rounded-lg hover:bg-secondary-50 transition duration-150"
            >
              <svg
                className="h-8 w-8 text-secondary-600 mr-3"
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
              <div>
                <p className="font-semibold text-gray-900">Manage Courses</p>
                <p className="text-sm text-gray-600">View & edit courses</p>
              </div>
            </Link>

            <Link
              to="/create-assignment"
              className="flex items-center p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition duration-150"
            >
              <svg
                className="h-8 w-8 text-green-600 mr-3"
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
              <div>
                <p className="font-semibold text-gray-900">Create Assignment</p>
                <p className="text-sm text-gray-600">Add new assignment</p>
              </div>
            </Link>

            <button
              onClick={handleShowAssignments}
              className="flex items-center p-4 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition duration-150 w-full"
            >
              <svg
                className="h-8 w-8 text-orange-600 mr-3"
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
              <div className="text-left">
                <p className="font-semibold text-gray-900">View Assignments</p>
                <p className="text-sm text-gray-600">
                  {assignments.filter((a) => a.status === "published").length}{" "}
                  active assignments
                </p>
              </div>
            </button>

            <div className="flex flex-col p-4 border-2 border-purple-500 rounded-lg bg-white">
              <div className="flex items-center mb-3">
                <svg
                  className="h-8 w-8 text-purple-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">
                    Grade Submissions
                  </p>
                  <p className="text-xs text-gray-500">Click counts to view</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleShowPendingSubmissions}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-2 rounded-lg text-center transition"
                >
                  <p className="text-lg font-bold">{submissionStats.pending}</p>
                  <p className="text-xs">Pending</p>
                </button>
                <button
                  onClick={handleShowLateSubmissions}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-2 rounded-lg text-center transition"
                >
                  <p className="text-lg font-bold">{submissionStats.late}</p>
                  <p className="text-xs">Late</p>
                </button>
                <button
                  onClick={handleShowDoneSubmissions}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-2 rounded-lg text-center transition"
                >
                  <p className="text-lg font-bold">{submissionStats.done}</p>
                  <p className="text-xs">Done</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
            <Link
              to="/create-course"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              + Create New
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading courses...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center text-xs text-gray-500">
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>
                        {enrollmentCounts[course._id] !== undefined
                          ? `${enrollmentCounts[course._id]} student${
                              enrollmentCounts[course._id] !== 1 ? "s" : ""
                            } enrolled`
                          : "Loading..."}
                      </span>
                    </div>
                    {course.duration && (
                      <div className="flex items-center text-xs text-gray-500">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Duration: {course.duration}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        Created:{" "}
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleManageStudents(course)}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center"
                    >
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
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      Manage
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteCourse(course._id, course.title)
                      }
                      disabled={deleting[course._id]}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-150"
                    >
                      {deleting[course._id] ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin h-4 w-4 mr-2"
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
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Deleting...
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
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
              <p className="mb-2">No courses created yet</p>
              <Link
                to="/create-course"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create your first course
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recently Created Courses
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="h-16 w-16 mx-auto text-gray-300 mb-4"
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
              <p>No courses created yet</p>
              <p className="text-sm mt-2">
                <Link
                  to="/create-course"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create your first course
                </Link>{" "}
                to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 5).map((course) => (
                <div
                  key={course._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
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
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created on{" "}
                        {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleManageStudents(course)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Manage →
                  </button>
                </div>
              ))}
              {courses.length > 5 && (
                <div className="text-center pt-2">
                  <Link
                    to="/my-courses"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all {courses.length} courses →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Assignments Modal */}
      {showAssignmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  All Assignments & Submissions
                </h2>
                <p className="text-white text-sm opacity-90">
                  {assignments.length} assignment
                  {assignments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowAssignmentsModal(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="h-16 w-16 mx-auto text-gray-300 mb-4"
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
                  <p className="text-gray-500 text-lg mb-2">
                    No assignments created yet
                  </p>
                  <Link
                    to="/create-assignment"
                    onClick={() => setShowAssignmentsModal(false)}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Create your first assignment
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const submissions =
                      assignmentSubmissions[assignment._id] || [];
                    const totalSubmissions = submissions.length;
                    const gradedSubmissions = submissions.filter(
                      (s) => s.grade !== null && s.grade !== undefined
                    ).length;
                    const pendingSubmissions =
                      totalSubmissions - gradedSubmissions;
                    const isOverdue = new Date(assignment.dueDate) < new Date();

                    return (
                      <div
                        key={assignment._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                      >
                        {/* Assignment Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {assignment.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {assignment.status === "published" ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    Published
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                    Draft
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {assignment.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
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
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>
                                  Due:{" "}
                                  {new Date(
                                    assignment.dueDate
                                  ).toLocaleDateString()}
                                </span>
                                {isOverdue && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>{assignment.totalPoints} points</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Clickable Submission Stats */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-600 font-medium mb-2">
                            Click count to view submissions:
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              onClick={() =>
                                handleShowAssignmentSubmissions(
                                  assignment,
                                  "total"
                                )
                              }
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-3 rounded-lg text-center transition"
                            >
                              <p className="text-2xl font-bold">
                                {totalSubmissions}
                              </p>
                              <p className="text-xs">Total</p>
                            </button>
                            <button
                              onClick={() =>
                                handleShowAssignmentSubmissions(
                                  assignment,
                                  "graded"
                                )
                              }
                              className="bg-green-100 hover:bg-green-200 text-green-800 p-3 rounded-lg text-center transition"
                            >
                              <p className="text-2xl font-bold">
                                {gradedSubmissions}
                              </p>
                              <p className="text-xs">Graded</p>
                            </button>
                            <button
                              onClick={() =>
                                handleShowAssignmentSubmissions(
                                  assignment,
                                  "pending"
                                )
                              }
                              className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-3 rounded-lg text-center transition"
                            >
                              <p className="text-2xl font-bold">
                                {pendingSubmissions}
                              </p>
                              <p className="text-xs">Pending</p>
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Link
                            to={`/view-submissions/${assignment._id}`}
                            onClick={() => setShowAssignmentsModal(false)}
                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-center py-2 rounded-lg text-sm font-medium transition"
                          >
                            View & Grade All
                          </Link>
                          <button
                            onClick={() => {
                              setShowAssignmentsModal(false);
                              handleDeleteAssignment(
                                assignment._id,
                                assignment.title
                              );
                            }}
                            disabled={deletingAssignment[assignment._id]}
                            className="px-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center"
                          >
                            {deletingAssignment[assignment._id] ? (
                              <svg
                                className="animate-spin h-4 w-4"
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
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <Link
                to="/create-assignment"
                onClick={() => setShowAssignmentsModal(false)}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                + Create New Assignment
              </Link>
              <button
                onClick={() => setShowAssignmentsModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
                <p className="text-white text-sm opacity-90">
                  {modalSubmissions.length} submission
                  {modalSubmissions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {modalSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="h-16 w-16 mx-auto text-gray-300 mb-4"
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
                  <p className="text-gray-500 text-lg">No data found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalSubmissions.map((submission, index) => {
                    // Check if this is a pending student (no submission) or actual submission
                    const isPending =
                      !submission.submittedAt && submission.assignmentId;

                    return (
                      <div
                        key={isPending ? `pending-${index}` : submission._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Student Avatar */}
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {submission.student?.name
                                  ?.charAt(0)
                                  .toUpperCase() || "S"}
                              </span>
                            </div>
                            {/* Student Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">
                                  {submission.student?.name ||
                                    "Unknown Student"}
                                </h3>
                                {!isPending && (
                                  <Link
                                    to={`/view-submissions/${submission.assignment}`}
                                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded transition"
                                  >
                                    Grade
                                  </Link>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {submission.student?.email || "No email"}
                              </p>
                            </div>
                          </div>
                          {/* Status Badges */}
                          <div className="flex space-x-2 flex-shrink-0">
                            {isPending ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                Not Submitted
                              </span>
                            ) : (
                              <>
                                {submission.isLate && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                    Late
                                  </span>
                                )}
                                {submission.grade !== null &&
                                submission.grade !== undefined ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    Graded: {submission.grade}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                    Not Graded
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Assignment Info */}
                        <div className="bg-gray-50 rounded p-3 mb-2">
                          <p className="font-medium text-gray-900 text-sm">
                            {submission.assignmentTitle}
                          </p>
                          {isPending ? (
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                              <div className="flex items-center">
                                <svg
                                  className="h-3 w-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Due:{" "}
                                {new Date(submission.dueDate).toLocaleString()}
                              </div>
                              {submission.courseTitle && (
                                <div className="flex items-center">
                                  <svg
                                    className="h-3 w-3 mr-1"
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
                                  Course: {submission.courseTitle}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                              <div className="flex items-center">
                                <svg
                                  className="h-3 w-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Submitted:{" "}
                                {new Date(
                                  submission.submittedAt
                                ).toLocaleString()}
                              </div>
                              {submission.assignmentDueDate && (
                                <div className="flex items-center">
                                  <svg
                                    className="h-3 w-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Due:{" "}
                                  {new Date(
                                    submission.assignmentDueDate
                                  ).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Text Submission - only show if not pending */}
                        {!isPending && submission.textSubmission && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-600 font-medium mb-1">
                              Text Submission:
                            </p>
                            <p className="text-sm text-gray-700 bg-blue-50 rounded p-2 line-clamp-3">
                              {submission.textSubmission}
                            </p>
                          </div>
                        )}

                        {/* Files - only show if not pending */}
                        {!isPending &&
                          submission.files &&
                          submission.files.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-600 font-medium mb-1">
                                Attached Files ({submission.files.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {submission.files.map((file, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                  >
                                    📎 File {idx + 1}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Management Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Enrolled Students - {selectedCourse?.title}
              </h2>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {loadingStudents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading students...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="h-16 w-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    No students enrolled yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Students will appear here once they enroll in this course
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                    <p className="text-primary-800 font-medium">
                      Total Enrolled: {enrolledStudents.length} student
                      {enrolledStudents.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {enrolledStudents.map((enrollment) => (
                    <div
                      key={enrollment._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Student Avatar */}
                        <div className="h-12 w-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {enrollment.student?.name
                              ?.charAt(0)
                              .toUpperCase() || "S"}
                          </span>
                        </div>
                        {/* Student Info */}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {enrollment.student?.name || "Unknown Student"}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center">
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
                            {enrollment.student?.email || "No email"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Enrolled on{" "}
                            {new Date(
                              enrollment.enrolledAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {/* Remove Button */}
                      <button
                        onClick={() =>
                          handleRemoveStudent(
                            enrollment._id,
                            enrollment.student?.name || "this student"
                          )
                        }
                        disabled={removingStudent[enrollment._id]}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
                      >
                        {removingStudent[enrollment._id] ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 mr-2"
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
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Removing...
                          </>
                        ) : (
                          <>
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowStudentsModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
