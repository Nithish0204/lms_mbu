const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
    // Check if user already exists
    console.log("Checking if user already exists...");
    let user = await User.findOne({ email });
    if (user) {
      console.log("❌ User already exists with email:", email);
      return res
        .status(400)
        .json({ success: false, msg: "User already exists" });
    }
    console.log("✅ Email is available");

    // Create a new user
    console.log("Creating new user in database...");
    user = await User.create({
      name,
      email,
      password,
      role,
    });
    console.log("✅ User created successfully!");
    console.log("New user ID:", user._id);
    console.log("User role:", user.role);

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
