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

// Utility to set secure HTTP-only cookie for refresh tokens
function setRefreshTokenCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Utility to set secure HTTP-only cookie for access tokens
function setAccessTokenCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/api",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

// Login endpoint with refresh token flow
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info("Login route hit", { origin: req.headers.origin });

    // Input validation
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Email is required" },
      });
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Password is required" },
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Validate email format
    if (!isValidEmail(emailLower)) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
    }

    // Check password length (reasonable bounds)
    if (password.length > 500) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
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
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
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
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
    }

    if (!passwordMatch) {
      logger.warn("Login attempt with wrong password", { email: emailLower });
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      });
    }

    // Check if user has admin rights
    if (!user.isAdmin) {
      logger.warn("Login attempt by non-admin user", { email: emailLower });
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" },
      });
    }

    // Generate short-lived access token (15m)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      { expiresIn: "15m", algorithm: "HS256" },
    );

    // Generate long-lived refresh token (7d)
    const refreshToken = jwt.sign(
      {
        id: user.id,
        type: "refresh",
      },
      jwtSecret,
      { expiresIn: "7d", algorithm: "HS256" },
    );

    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);

    logger.info("User logged in successfully", {
      userId: user.id,
      email: emailLower,
    });

    // For backward compatibility, also return access token in response
    res.json({
      token: accessToken,
      expiresIn: 900, // 15 minutes in seconds
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    logger.error("Login error", { message: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Login failed. Please try again.",
      },
    });
  }
});

// Refresh token endpoint (uses HTTP-only cookie)
router.post("/refresh", async (req, res) => {
  try {
    // Accept refresh token from cookie (preferred) or Authorization header (legacy)
    let refreshToken = req.cookies?.refresh_token;
    if (
      !refreshToken &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      refreshToken = req.headers.authorization.slice(7);
    }
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing refresh token" },
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtSecret);
    } catch (jwtErr) {
      logger.warn("Token refresh failed - invalid refresh token", {
        error: jwtErr.message,
      });
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired refresh token",
        },
      });
    }

    // Must be a refresh token
    if (!decoded || decoded.type !== "refresh" || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid refresh token" },
      });
    }

    // Verify user still exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isAdmin) {
      logger.warn("Token refresh failed - user not found or not admin", {
        userId: decoded.id,
      });
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "User not found or not admin" },
      });
    }

    // Issue new short-lived access token (15m)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      { expiresIn: "15m", algorithm: "HS256" },
    );

    setAccessTokenCookie(res, accessToken);

    // Rotate refresh token (new 7d token)
    const newRefreshToken = jwt.sign(
      {
        id: user.id,
        type: "refresh",
      },
      jwtSecret,
      { expiresIn: "7d", algorithm: "HS256" },
    );
    setRefreshTokenCookie(res, newRefreshToken);

    logger.info("Token refreshed successfully", { userId: user.id });

    res.json({
      token: accessToken,
      expiresIn: 900, // 15 minutes in seconds
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    logger.error("Token refresh error", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Token refresh failed" },
    });
  }
});

// Logout endpoint (clears refresh token cookie)
router.post("/logout", async (req, res) => {
  try {
    // Clear cookies with the same paths they were set with
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/api/auth/refresh",
    });
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/api",
    });
    logger.info("Logout requested");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error("Logout error", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Logout failed" },
    });
  }
});

// Export router so server.js can mount it
module.exports = router;
