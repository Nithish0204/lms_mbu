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
app.use(
  cors({
    origin: ["https://lms-mbu-aqux.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);

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
// Also expose uploads under /api prefix for serverless routing compatibility
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

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

// Health check endpoint for deployment diagnostics
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

app.get("/api/health/email", (req, res) => {
  const sendgridConfigured = Boolean(process.env.SENDGRID_API_KEY);
  const smtpConfigured = Boolean(
    process.env.SMTP_USER && process.env.SMTP_PASS
  );
  const smtpEnabled =
    String(process.env.EMAIL_SMTP_ENABLE || "true").toLowerCase() === "true";
  const strictSmtp =
    String(process.env.EMAIL_SMTP_STRICT || "false").toLowerCase() === "true";
  const smtpTimeout = Number(process.env.EMAIL_SMTP_TIMEOUT || 10000);
  const sgStrict =
    String(process.env.SENDGRID_VALIDATE_STRICT || "false").toLowerCase() ===
    "true";
  res.json({
    ok: true,
    providers: {
      sendgrid: { configured: sendgridConfigured },
      smtp: {
        configured: smtpConfigured,
        enabled: smtpEnabled,
        timeoutMs: smtpTimeout,
        strict: strictSmtp,
      },
    },
    validation: {
      order: [
        sendgridConfigured ? "sendgrid" : null,
        "deep-email-validator",
      ].filter(Boolean),
      sendgridStrict: sgStrict,
    },
  });
});
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(
      `Server running in ${
        process.env.NODE_ENV || "development"
      } mode on port ${PORT}`
    )
  );
}

module.exports = app;
