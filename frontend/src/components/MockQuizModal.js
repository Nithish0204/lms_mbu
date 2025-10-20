import React, { useState, useEffect } from "react";
import api from "../api";

const MockQuizModal = ({ assignment, assignmentId, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    generateQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining, quizSubmitted]);

  const normalizeQuiz = (raw) => {
    const title = raw.title || "Mock Quiz";
    const description =
      raw.description ||
      `Practice quiz generated for ${assignment?.title || "this assignment"}.`;
    const timeLimit = Number(raw.timeLimit) || 10;

    const questions = (raw.questions || []).map((q, idx) => {
      const id = q.id || `${idx + 1}`;
      let optionsObj = q.options;
      if (Array.isArray(optionsObj)) {
        const letters = ["A", "B", "C", "D"];
        optionsObj = optionsObj.slice(0, 4).reduce((acc, val, i) => {
          acc[letters[i] || String(i)] = val;
          return acc;
        }, {});
      }
      if (!optionsObj || typeof optionsObj !== "object") {
        optionsObj = {
          A: "Option A",
          B: "Option B",
          C: "Option C",
          D: "Option D",
        };
      }

      let correctAnswer = q.correctAnswer || q.answer;
      if (correctAnswer && !optionsObj[correctAnswer]) {
        const match = Object.entries(optionsObj).find(
          ([, val]) => val === correctAnswer
        );
        if (match) correctAnswer = match[0];
      }
      if (!correctAnswer) correctAnswer = "A";

      return {
        id,
        question: q.question || `Question ${idx + 1}`,
        options: optionsObj,
        correctAnswer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || undefined,
      };
    });

    return {
      title,
      description,
      timeLimit,
      totalQuestions: questions.length,
      questions,
    };
  };

  const generateQuiz = async () => {
    try {
      setError("");
      setGenerating(true);
      const id = assignment?._id || assignmentId;
      if (!id) throw new Error("Missing assignment id");
      const response = await api.post(`/assignments/${id}/mock-quiz`);
      const rawQuiz = response.data?.quiz || response.data;
      const normalized = normalizeQuiz(rawQuiz || {});
      setQuiz(normalized);
      setTimeRemaining((normalized.timeLimit || 10) * 60);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.response?.data?.error ||
          e.message ||
          "Failed to generate quiz. Please try again."
      );
      setTimeout(() => onClose && onClose(), 1000);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuiz = () => setQuizStarted(true);

  const handleAnswerSelect = (questionId, option) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion((q) => q - 1);
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    let correctCount = 0;
    const results = quiz.questions.map((question) => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        options: question.options,
      };
    });

    const percentage = Number(
      ((correctCount / quiz.questions.length) * 100).toFixed(1)
    );
    let performanceLevel;
    let message;
    if (percentage >= 90) {
      performanceLevel = "Excellent";
      message = "Outstanding! You have excellent understanding of the topic!";
    } else if (percentage >= 80) {
      performanceLevel = "Very Good";
      message = "Great job! You have a strong grasp of the material.";
    } else if (percentage >= 70) {
      performanceLevel = "Good";
      message = "Good work! Consider reviewing a few topics for improvement.";
    } else if (percentage >= 60) {
      performanceLevel = "Satisfactory";
      message = "You're on the right track. More practice will help!";
    } else {
      performanceLevel = "Needs Improvement";
      message = "Keep studying! Review the material and try again.";
    }

    setScore({
      correct: correctCount,
      total: quiz.questions.length,
      percentage,
      performanceLevel,
      message,
      results,
    });
    setQuizSubmitted(true);
  };

  const formatTime = (seconds) => {
    const secs = Math.max(0, seconds || 0);
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${String(rem).padStart(2, "0")}`;
  };
  const getAnsweredCount = () => Object.keys(userAnswers).length;

  if (generating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🤖 Generating Mock Quiz...
            </h3>
            <p className="text-gray-600">
              AI is creating 10 questions for you. This may take a moment.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>📚 Analyzing: {assignment?.title || "Assignment"}</p>
              <p className="mt-1">
                🎯 Course: {assignment?.course?.title || "Course"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Failed to Generate Quiz
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (!quizStarted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 my-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎯 {quiz.title}
              </h2>
              <p className="text-gray-600">{quiz.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-2xl"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📋 Quiz Information
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center text-gray-700">
                <span className="font-medium w-32">Assignment:</span>
                <span>{assignment?.title}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <span className="font-medium w-32">Course:</span>
                <span>{assignment?.course?.title}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <span className="font-medium w-32">Total Questions:</span>
                <span>{quiz.totalQuestions}</span>
              </p>
              <p className="flex items-center text-gray-700">
                <span className="font-medium w-32">Time Limit:</span>
                <span>{quiz.timeLimit} minutes</span>
              </p>
              <p className="flex items-center text-gray-700">
                <span className="font-medium w-32">Type:</span>
                <span>Multiple Choice</span>
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              ⚠️ Important Instructions
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  This is a <strong>practice quiz</strong> and will{" "}
                  <strong>NOT</strong> be recorded or graded
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  You have {quiz.timeLimit} minutes to complete all{" "}
                  {quiz.totalQuestions} questions
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Each question has only ONE correct answer</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  You can navigate between questions before submitting
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  After submission, you can review your answers and see
                  explanations
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  The timer will automatically submit the quiz when time runs
                  out
                </span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStartQuiz}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl"
            >
              🚀 Start Quiz
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizSubmitted && !showReview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-xl w-full mx-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">
              {score.percentage >= 80
                ? "🎉"
                : score.percentage >= 60
                ? "😊"
                : "💪"}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Quiz Completed!
            </h2>
            <p className="text-lg text-gray-600">{score.message}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">{score.percentage}%</div>
              <div className="text-lg mb-2">{score.performanceLevel}</div>
              <div className="text-base opacity-90">
                {score.correct} out of {score.total} questions correct
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-green-600 text-2xl font-bold">
                {score.correct}
              </div>
              <div className="text-gray-600 text-sm">Correct Answers</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="text-red-600 text-2xl font-bold">
                {score.total - score.correct}
              </div>
              <div className="text-gray-600 text-sm">Incorrect Answers</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-700 text-center">
              💡 <strong>Remember:</strong> This was a practice quiz to help you
              prepare. Your results are <strong>NOT</strong> saved or recorded.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowReview(true)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition"
            >
              📝 Review Answers
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 my-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📝 Quiz Review
              </h2>
              <p className="text-gray-600">
                Review your answers and see explanations
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-2xl"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">
                Score: {score.correct}/{score.total} ({score.percentage}%)
              </span>
              <span className="text-gray-600">{score.performanceLevel}</span>
            </div>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {score.results.map((result, index) => (
              <div
                key={result.questionId}
                className={`border-2 rounded-xl p-6 ${
                  result.isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    {index + 1}. {result.question}
                  </h3>
                  <span
                    className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                      result.isCorrect
                        ? "bg-green-200 text-green-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {result.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {Object.entries(result.options).map(([key, value]) => {
                    const isUserAnswer = result.userAnswer === key;
                    const isCorrectAnswer = result.correctAnswer === key;
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrectAnswer
                            ? "border-green-500 bg-green-100"
                            : isUserAnswer
                            ? "border-red-500 bg-red-100"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{key}.</span>
                          <span className="flex-1">{value}</span>
                          {isCorrectAnswer && (
                            <span className="text-green-600 font-bold">
                              ✓ Correct
                            </span>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span className="text-red-600 font-bold">
                              Your answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {result.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong className="text-blue-900">💡 Explanation:</strong>{" "}
                      {result.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-medium transition"
            >
              Close Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const answeredCount = getAnsweredCount();
  const allAnswered = answeredCount === quiz.questions.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-2xl"
              title="Close Quiz"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center text-sm">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <span className="font-medium text-blue-900">
                Question {currentQuestion + 1} of {quiz.totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
              <span className="font-medium text-green-900">
                Answered: {answeredCount}/{quiz.totalQuestions}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                timeRemaining < 300
                  ? "bg-red-50 text-red-900"
                  : "bg-gray-50 text-gray-900"
              }`}
            >
              <span>⏱️ {formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestion + 1) / quiz.totalQuestions) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
                Q{currentQuestion + 1}
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {question.question}
                </h3>
                {question.difficulty && (
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      question.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : question.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {question.difficulty.charAt(0).toUpperCase() +
                      question.difficulty.slice(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => {
                const isSelected = userAnswers[question.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(question.id, key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700 mr-2">
                          {key}.
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-xl font-medium transition ${
                currentQuestion === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-700"
              }`}
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              {isLastQuestion ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered}
                  className={`px-8 py-3 rounded-xl font-bold transition ${
                    allAnswered
                      ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {allAnswered
                    ? "✓ Submit Quiz"
                    : `Answer All (${answeredCount}/${quiz.totalQuestions})`}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
          {!allAnswered && isLastQuestion && (
            <p className="text-center text-sm text-orange-600 mt-3">
              ⚠️ Please answer all questions before submitting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockQuizModal;
