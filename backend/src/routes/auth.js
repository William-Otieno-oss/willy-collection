const express = require("express");
const router = express.Router();
const prisma = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const logger = require("../middleware/logger");

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Login endpoint with proper validation and security
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "Password is required" });
    }

    const emailLower = email.toLowerCase().trim();

    // Validate email format
    if (!isValidEmail(emailLower)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password length (reasonable bounds)
    if (password.length > 500) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Lookup user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    // Use generic error message to prevent email enumeration attacks
    if (!user) {
      logger.warn("Login attempt with non-existent email", {
        email: emailLower,
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password with bcrypt
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      logger.error("Bcrypt error during login", {
        email: emailLower,
        error: bcryptErr.message,
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!passwordMatch) {
      logger.warn("Login attempt with wrong password", { email: emailLower });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user has admin rights
    if (!user.isAdmin) {
      logger.warn("Login attempt by non-admin user", { email: emailLower });
      return res.status(403).json({ error: "Admin access required" });
    }

    // Generate JWT token with expiration
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      { expiresIn: "8h", algorithm: "HS256" },
    );

    logger.info("User logged in successfully", {
      userId: user.id,
      email: emailLower,
    });

    res.json({
      token,
      expiresIn: 28800, // 8 hours in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    logger.error("Login error", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

module.exports = router;
