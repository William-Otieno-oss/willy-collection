/**
 * CSRF Token Middleware
 * Provides CSRF protection for state-changing operations
 * Generates tokens and validates them on requests
 */

const crypto = require("crypto");

// Store tokens in memory (in production, use Redis or database)
const csrfTokens = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate CSRF token
 * @param {string} sessionId - Unique session identifier
 * @returns {string} CSRF token
 */
const generateToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  csrfTokens.set(token, {
    sessionId,
    expiresAt,
  });

  // Cleanup expired tokens periodically
  if (csrfTokens.size % 100 === 0) {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (now > value.expiresAt) {
        csrfTokens.delete(key);
      }
    }
  }

  return token;
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} sessionId - Session identifier
 * @returns {boolean} Token is valid
 */
const validateToken = (token, sessionId) => {
  const tokenData = csrfTokens.get(token);

  if (!tokenData) {
    return false;
  }

  // Check expiration
  if (Date.now() > tokenData.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }

  // Check session ID match
  if (tokenData.sessionId !== sessionId) {
    return false;
  }

  // Token is single-use
  csrfTokens.delete(token);
  return true;
};

/**
 * CSRF protection middleware
 * Validates tokens on state-changing requests
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check if Authorization header present (JWT authenticated)
  if (req.headers.authorization) {
    return next();
  }

  // For form submissions without JWT, validate CSRF token
  const token =
    req.headers["x-csrf-token"] || req.body?.csrfToken || req.query?.csrfToken;

  if (!token) {
    return res.status(403).json({
      error: "CSRF token missing",
    });
  }

  // Use session ID from user ID or request IP
  const sessionId = req.user?.id || req.ip;

  if (!validateToken(token, sessionId)) {
    return res.status(403).json({
      error: "CSRF token invalid or expired",
    });
  }

  next();
};

/**
 * Generate token endpoint middleware
 * Can be used to provide fresh tokens to clients
 */
const csrfTokenEndpoint = (req, res) => {
  const sessionId = req.user?.id || req.ip;
  const token = generateToken(sessionId);

  res.json({
    csrfToken: token,
    expiresIn: TOKEN_EXPIRY_MS / 1000,
  });
};

module.exports = {
  generateToken,
  validateToken,
  csrfProtection,
  csrfTokenEndpoint,
};
