/**
 * Request Sanitization Middleware
 * Sanitizes and validates incoming request data
 * Prevents common injection attacks and malformed requests
 */

const logger = require("./logger");

/**
 * Sanitize string input - removes potentially dangerous characters
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") {
    return str;
  }

  // Remove null bytes
  str = str.replace(/\0/g, "");

  // Remove control characters (except \n, \r, \t)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Trim whitespace
  return str.trim();
};

/**
 * Recursively sanitize object properties
 * @param {*} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {*} Sanitized object
 */
const sanitizeObject = (obj, depth = 0) => {
  // Prevent deep recursion
  if (depth > 10) {
    logger.warn("Sanitization depth exceeded", { depth });
    return null;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names too
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Request body sanitization middleware
 */
const sanitizeRequestBody = (req, res, next) => {
  if (!req.body) {
    return next();
  }

  try {
    req.body = sanitizeObject(req.body);
    next();
  } catch (error) {
    logger.error("Request sanitization error", {
      error: error.message,
      path: req.path,
    });
    res.status(400).json({
      error: "Invalid request format",
    });
  }
};

/**
 * Request query sanitization middleware
 */
const sanitizeQueryParams = (req, res, next) => {
  if (!req.query) {
    return next();
  }

  try {
    req.query = sanitizeObject(req.query);
    next();
  } catch (error) {
    logger.error("Query sanitization error", {
      error: error.message,
      path: req.path,
    });
    res.status(400).json({
      error: "Invalid query parameters",
    });
  }
};

/**
 * Request size limit validation
 */
const validateRequestSize = (req, res, next) => {
  // Maximum JSON size: 10 MB
  const maxSize = 10 * 1024 * 1024;

  if (req.headers["content-length"]) {
    const size = parseInt(req.headers["content-length"], 10);
    if (size > maxSize) {
      logger.warn("Request size exceeded", { size, maxSize });
      return res.status(413).json({
        error: "Request entity too large",
      });
    }
  }

  next();
};

/**
 * Validate JSON structure
 */
const validateJsonStructure = (req, res, next) => {
  if (req.method === "GET" || !req.body) {
    return next();
  }

  // Check for circular references (might indicate attack)
  try {
    JSON.stringify(req.body);
    next();
  } catch (error) {
    logger.warn("Invalid JSON structure detected", {
      path: req.path,
    });
    res.status(400).json({
      error: "Invalid JSON structure",
    });
  }
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeQueryParams,
  validateRequestSize,
  validateJsonStructure,
};
