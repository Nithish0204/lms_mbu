// Lightweight structured logger with levels, timestamps, and contextual child loggers
// Usage:
//   const { createLogger } = require("../utils/logger");
//   const log = createLogger("assignmentController");
//   log.info("message", { key: "value" });
//   const reqLog = log.child({ requestId: req.id });
//   reqLog.debug("processing", { step: 1 });

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function levelEnabled(level) {
  const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
  const envVal = LEVELS[envLevel] ?? LEVELS.info;
  const lvlVal = LEVELS[level] ?? LEVELS.info;
  return lvlVal <= envVal;
}

function ts() {
  return new Date().toISOString();
}

function formatCtx(ctx) {
  if (!ctx) return "";
  const flat = Object.entries(ctx)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${sanitize(v)}`)
    .join(" ");
  return flat ? ` ${flat}` : "";
}

function sanitize(value) {
  if (typeof value === "string") return value.replace(/\s+/g, " ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function baseLog(name, baseCtx = {}) {
  const logFn = (level) => (message, meta) => {
    if (!levelEnabled(level)) return;
    const line = `[${ts()}] ${level.toUpperCase()} [${name}]${formatCtx(
      baseCtx
    )} - ${message}`;
    // Route by level to console
    const payload = meta ? ` | ${sanitize(meta)}` : "";
    if (level === "error") console.error(line + payload);
    else if (level === "warn") console.warn(line + payload);
    else if (level === "info") console.log(line + payload);
    else console.debug(line + payload);
  };

  const logger = {
    error: logFn("error"),
    warn: logFn("warn"),
    info: logFn("info"),
    debug: logFn("debug"),
    child(extra) {
      return baseLog(name, { ...baseCtx, ...extra });
    },
  };
  return logger;
}

function createLogger(name, baseCtx) {
  return baseLog(name, baseCtx);
}

module.exports = { createLogger };
