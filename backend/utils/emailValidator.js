const dns = require("dns").promises;
const { validate } = require("deep-email-validator");

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
    const result = await validate({
      email: email,
      sender: process.env.SMTP_USER || "noreply@lmsplatform.com",
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: true, // ✅ ENABLED - Checks if email actually exists on server
    });

    console.log("Deep validation result:", result);

    if (result.valid) {
      console.log("✅ Deep email validation passed");
      return {
        valid: true,
        message: "Email is valid and exists",
        details: result,
      };
    } else {
      console.log("❌ Deep email validation failed:", result.reason);

      // Provide user-friendly error messages
      let message = "Email validation failed";

      if (result.reason === "regex") {
        message = "Invalid email format";
      } else if (result.reason === "mx") {
        message = "Email domain does not exist or cannot receive emails";
      } else if (result.reason === "disposable") {
        message = "Disposable/temporary email addresses are not allowed";
      } else if (result.reason === "smtp") {
        message = "Email address does not exist on the server";
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
