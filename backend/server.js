const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { createLogger } = require("./utils/logger");
const { randomUUID } = require("crypto");

// Load env vars from .env file in backend root
dotenv.config();

// Connect to database
connectDB();

const app = express();
const log = createLogger("server");

// Body parser
app.use(express.json());

// Assign request id and log lifecycle
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || randomUUID();
  const reqLog = log.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
  });
  const start = process.hrtime.bigint();
  reqLog.info("request:start", { ip: req.ip, origin: req.headers.origin });
  res.on("finish", () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    reqLog.info("request:finish", {
      status: res.statusCode,
      durationMs: Math.round(durMs),
    });
  });
  next();
});

// Enable CORS
app.use(cors());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routers
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/assessments", assessmentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
