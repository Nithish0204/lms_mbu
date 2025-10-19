const dns = require("dns").promises;
const { validate } = require("deep-email-validator");
let sgClient;
try {
  sgClient = require("@sendgrid/client");
  if (process.env.SENDGRID_API_KEY) {
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("🔍 SendGrid Email Validation enabled");
  }
} catch (_) {}

/**
 * Email validation utility with real-world verification
 */

// Basic email regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
exports.isValidEmailFormat = (email) => {
  return emailRegex.test(email);
};

/**
 * Verify if email domain has valid MX records
 */
exports.verifyEmailDomain = async (email) => {
  try {
    if (!email || !email.includes("@")) {
      return { valid: false, message: "Invalid email format" };
    }

    const domain = email.split("@")[1];

    // Get MX records for the domain
    const mxRecords = await dns.resolveMx(domain);

    if (mxRecords && mxRecords.length > 0) {
      console.log(`✅ Email domain ${domain} has valid MX records`);
      return {
        valid: true,
        message: "Email domain is valid",
        mxRecords: mxRecords.map((r) => r.exchange),
      };
    }

    return { valid: false, message: "No MX records found for domain" };
  } catch (error) {
    console.error(
      `❌ Email domain verification failed for ${email}:`,
      error.message
    );

    // If DNS lookup fails, we'll still allow the email but log the issue
    return {
      valid: true, // Allow registration but log warning
      warning: true,
      message: "Could not verify domain, but allowing registration",
      error: error.message,
    };
  }
};

/**
 * Check if email is from disposable/temporary email service
 */
const disposableDomains = [
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "fakeinbox.com",
  "trashmail.com",
];

exports.isDisposableEmail = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  return disposableDomains.some((d) => domain?.includes(d));
};

/**
 * Sanitize email (lowercase and trim)
 */
exports.sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

/**
 * SendGrid Email Validation
 * Verdicts: Valid | Risky | Invalid | Unknown
 */
async function validateWithSendGrid(email) {
  if (!sgClient || !process.env.SENDGRID_API_KEY) return null;
  try {
    const strict =
      String(process.env.SENDGRID_VALIDATE_STRICT || "false").toLowerCase() ===
      "true";
    const req = {
      method: "POST",
      url: "/v3/validations/email",
      body: { email },
    };
    const [response, body] = await sgClient.request(req);
    const result = body?.result || body;
    const verdict = (
      result?.verdict ||
      result?.result?.verdict ||
      ""
    ).toString();

    // Decide based on verdict
    if (verdict.toLowerCase() === "valid") {
      return {
        valid: true,
        reason: "sendgrid",
        verdict,
        details: result,
        usedSendGrid: true,
      };
    }
    if (verdict.toLowerCase() === "risky") {
      if (strict) {
        return {
          valid: false,
          reason: "sendgrid",
          verdict,
          message: "Email flagged as risky by validation",
          details: result,
          usedSendGrid: true,
        };
      }
      return {
        valid: true,
        reason: "sendgrid",
        verdict,
        warning:
          "Email flagged as risky by validation - proceeding with OTP verification",
        details: result,
        usedSendGrid: true,
      };
    }
    // Invalid or Unknown
    return {
      valid: false,
      reason: "sendgrid",
      verdict,
      message: "Email validation failed",
      details: result,
      usedSendGrid: true,
    };
  } catch (error) {
    console.error(
      "❌ SendGrid validation error:",
      error.response?.body || error.message || error
    );
    return { error: true, usedSendGrid: true, message: error.message };
  }
}

/**
 * Full email validation (format + domain verification)
 */
exports.validateEmail = async (email) => {
  console.log(`\n🔍 Validating email: ${email}`);

  // Check format
  if (!this.isValidEmailFormat(email)) {
    console.log("❌ Invalid email format");
    return {
      valid: false,
      message: "Invalid email format. Please provide a valid email address.",
    };
  }

  // Check disposable
  if (this.isDisposableEmail(email)) {
    console.log("❌ Disposable email detected");
    return {
      valid: false,
      message: "Disposable/temporary email addresses are not allowed.",
    };
  }

  // Verify domain with DNS
  const domainCheck = await this.verifyEmailDomain(email);

  if (!domainCheck.valid && !domainCheck.warning) {
    console.log("❌ Domain verification failed");
    return domainCheck;
  }

  console.log("✅ Email validation passed");
  return {
    valid: true,
    message: "Email is valid",
    verified: true,
  };
};

/**
 * Deep email validation using deep-email-validator
 * This checks:
 * - Format validity
 * - MX records
 * - SMTP server validity
 * - Disposable email detection
 * - Role-based email detection (info@, admin@, etc.)
 */
exports.deepValidateEmail = async (email) => {
  console.log(`\n🔬 Deep validating email: ${email}`);

  try {
    // 1) Try SendGrid validation first if configured
    const sgResult = await validateWithSendGrid(email);
    if (sgResult && sgResult.usedSendGrid) {
      if (sgResult.valid) {
        return sgResult;
      }
      // If SendGrid returned a definitive invalid, stop here
      if (
        !sgResult.error &&
        sgResult.verdict &&
        sgResult.verdict.toLowerCase() === "invalid"
      ) {
        return sgResult;
      }
      // Otherwise continue to fallback validator below
      console.log(
        "ℹ️ SendGrid validation inconclusive or failed, falling back to SMTP-based validation"
      );
    }

    const smtpTimeout = parseInt(process.env.EMAIL_SMTP_TIMEOUT || "10000", 10);
    const result = await validate({
      email: email,
      sender: process.env.SMTP_USER || "noreply@lmsplatform.com",
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: true, // ✅ ENABLED - Checks if email actually exists on server
      timeout: Number.isFinite(smtpTimeout) ? smtpTimeout : 10000, // Configurable timeout
    });

    console.log("Deep validation result:", result);

    if (result.valid) {
      console.log("✅ Deep email validation passed - email exists!");
      return {
        valid: true,
        message: "Email is valid and exists",
        details: result,
      };
    } else {
      console.log("❌ Deep email validation failed:", result.reason);

      // Provide user-friendly error messages
      let message = "Email validation failed";
      let allowRegistration = false;

      if (result.reason === "regex") {
        message = "Invalid email format. Please check your email address.";
      } else if (result.reason === "mx") {
        message =
          "Email domain does not exist or cannot receive emails. Please check the domain.";
      } else if (result.reason === "disposable") {
        message =
          "Disposable/temporary email addresses are not allowed. Please use a permanent email.";
      } else if (result.reason === "smtp") {
        // SMTP validation failed. Distinguish between hard failures vs. inconclusive (timeouts/blocked).
        const smtpDetails = result.validators?.smtp || {};
        const smtpReasonRaw = smtpDetails.reason ?? result.reason;
        const smtpReason = String(smtpReasonRaw).toLowerCase();

        const isTimeoutOrBlocked =
          smtpReason.includes("timeout") ||
          smtpReason.includes("timed out") ||
          smtpReason.includes("connection") ||
          smtpReason.includes("refused") ||
          smtpReason.includes("block") ||
          smtpReason.includes("grey") ||
          smtpReason.includes("anti") ||
          smtpReason.includes("starttls") ||
          smtpReason.includes("tls");

        const strictMode =
          String(process.env.EMAIL_SMTP_STRICT || "false").toLowerCase() ===
          "true";

        if (isTimeoutOrBlocked && !strictMode) {
          // Treat as inconclusive: allow registration but require OTP to verify real ownership
          const hasValidFormat = result.validators?.regex?.valid !== false;
          const hasValidMx = result.validators?.mx?.valid !== false;
          const notDisposable = result.validators?.disposable?.valid !== false;

          if (hasValidFormat && hasValidMx && notDisposable) {
            console.log(
              "⚠️ SMTP check inconclusive (",
              smtpReasonRaw,
              ") - allowing registration with OTP verification"
            );
            return {
              valid: true,
              message: "Email validation passed (SMTP check inconclusive)",
              warning:
                "SMTP verification timed out or was blocked. We'll verify ownership via OTP.",
              details: result,
            };
          }
          // Otherwise, fall through to a generic failure message below
        }

        // Hard SMTP failure (e.g., mailbox does not exist) or strict mode enabled
        console.log(
          "❌ SMTP verification hard failure",
          smtpReasonRaw ? `- reason: ${smtpReasonRaw}` : ""
        );
        message =
          "This email address could not be verified by the mail server. Please use a valid email address that you can access.";
      } else if (result.reason === "typo") {
        message = `Did you mean ${result.validators.typo.suggestion}?`;
      }

      return {
        valid: false,
        message: message,
        reason: result.reason,
        details: result,
      };
    }
  } catch (error) {
    console.error("❌ Deep validation error:", error);

    // If deep validation fails (network issues, etc.), fall back to basic validation
    console.log("⚠️  Falling back to basic validation");
    return await this.validateEmail(email);
  }
};

console.log("📧 Email validator loaded with deep validation support");
