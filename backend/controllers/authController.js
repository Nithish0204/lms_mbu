exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, msg: "Email and OTP are required" });
  }
  try {
    const user = await User.findOne({ email }).select(
      "+otp +otpExpiry +isVerified"
    );
    if (!user) {
      return res.status(400).json({ success: false, msg: "User not found" });
    }
    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, msg: "User already verified" });
    }
    if (!user.otp || !user.otpExpiry) {
      return res
        .status(400)
        .json({ success: false, msg: "No OTP found. Please register again." });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, msg: "Invalid OTP" });
    }
    if (user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ success: false, msg: "OTP expired. Please register again." });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send welcome email asynchronously (don't block verification)
    sendWelcomeEmail(user).catch((error) => {
      console.error("⚠️ Failed to send welcome email:", error.message);
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    return res.json({
      success: true,
      msg: "Email verified successfully! Redirecting to dashboard...",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ OTP VERIFICATION ERROR:", error);
    return res
      .status(500)
      .json({ success: false, msg: "Server error", error: error.message });
  }
};
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  validateEmail,
  deepValidateEmail,
  sanitizeEmail,
} = require("../utils/emailValidator");
const { sendWelcomeEmail } = require("../utils/emailService");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  console.log("=== REGISTER REQUEST ===");
  const { name, email, password, role } = req.body;
  console.log("Registration data:", {
    name,
    email,
    role,
    passwordLength: password?.length,
  });

  try {
    // Validate required fields
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        msg: "Please provide name, email, and password",
      });
    }

    // Sanitize email
    const cleanEmail = sanitizeEmail(email);
    console.log("📧 Email sanitized:", cleanEmail);

    // STEP 1: Check if user already exists (fast check first)
    console.log("Checking if user already exists...");
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      console.log("❌ User already exists with email:", cleanEmail);
      return res
        .status(400)
        .json({ success: false, msg: "User already exists with this email" });
    }
    console.log("✅ Email is available in database");

    // STEP 2: Deep validate email (checks if email actually exists in real world)
    console.log("🔍 Deep validating email (this may take a few seconds)...");
    const emailValidation = await deepValidateEmail(cleanEmail);

    if (!emailValidation.valid) {
      console.log("❌ Email validation failed:", emailValidation.message);
      return res.status(400).json({
        success: false,
        msg: emailValidation.message,
        reason: emailValidation.reason,
      });
    }

    if (emailValidation.warning) {
      console.log("⚠️ Email validation warning:", emailValidation.warning);
    }

    console.log(
      "✅ Email validated successfully - email exists in real world!"
    );

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create a new user with OTP and isVerified false
    console.log("Creating new user in database with OTP...");
    user = await User.create({
      name,
      email: cleanEmail,
      password,
      role,
      otp,
      otpExpiry,
      isVerified: false,
    });
    console.log("✅ User created successfully!");
    console.log("New user ID:", user._id);
    console.log("User role:", user.role);
    console.log("OTP for verification:", otp);

    // Send OTP email (asynchronously)
    const { sendOtpEmail } = require("../utils/emailService");
    sendOtpEmail(user, otp).catch((error) => {
      console.error("⚠️ Failed to send OTP email:", error);
    });

    // Respond with success (but not logged in yet)
    const responseData = {
      success: true,
      msg: "Registration successful. Please verify your email with the OTP sent.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    res.status(201).json(responseData);
    console.log("✅ Registration response sent to frontend");
  } catch (error) {
    console.error("❌ REGISTRATION ERROR:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: error.message });
  }
  console.log("=== END REGISTER REQUEST ===\n");
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  console.log("=== LOGIN REQUEST ===");
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);

  try {
    // Validate email and password
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({
        success: false,
        msg: "Please provide email and password",
      });
    }

    // Check for user (include password since it's set to select: false in model)
    console.log("Looking up user in database...");
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }
    console.log("✅ User found:", user._id);
    console.log("User role:", user.role);

    // Check if password matches
    console.log("Verifying password...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }
    console.log("✅ Password verified");

    // Create token
    console.log("Generating JWT token...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );
    console.log("✅ JWT token generated");

    const responseData = {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    res.json(responseData);
    console.log("✅ Login response sent to frontend");
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
  console.log("=== END LOGIN REQUEST ===\n");
};
