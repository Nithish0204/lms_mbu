const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  console.log("=== [AUTH MIDDLEWARE] Protecting route ===");
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("🔑 [Auth] Token found in Authorization header");
  }

  // Make sure token exists
  if (!token) {
    console.log("❌ [Auth] No token provided");
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    console.log("🔄 [Auth] Verifying JWT token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(
      "✅ [Auth] Token verified. User ID:",
      decoded.id,
      "| Role:",
      decoded.role
    );

    // Get user from token
    console.log("🔄 [Auth] Fetching user from database...");
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      console.log("❌ [Auth] User not found in database");
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    console.log(
      "✅ [Auth] User authenticated:",
      req.user.name,
      "| Role:",
      req.user.role
    );
    console.log("✅ [Auth] Proceeding to next middleware/controller");
    next();
  } catch (error) {
    console.error("❌ [Auth] Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      error: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log("=== [AUTHORIZE MIDDLEWARE] Checking role ===");
    console.log("👤 [Authorize] User role:", req.user.role);
    console.log("✓ [Authorize] Required roles:", roles.join(", "));

    if (!roles.includes(req.user.role)) {
      console.log("❌ [Authorize] User not authorized. Role mismatch.");
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    console.log("✅ [Authorize] User authorized. Proceeding...");
    next();
  };
};
