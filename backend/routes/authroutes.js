const express = require("express");
const router = express.Router();

// Import the controller functions
const { register, login, verifyOtp } = require("../controllers/authController");

// Define the routes
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;
