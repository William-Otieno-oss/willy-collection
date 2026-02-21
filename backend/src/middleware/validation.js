/**
 * Request validation middleware
 * Ensures proper request structure and content-type
 */

const validateContentType = (req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
      });
    }
  }
  next();
};

const validateRequestSize = (req, res, next) => {
  // Express already handles this via bodyParser limits
  // This middleware is for custom validation if needed
  next();
};

module.exports = { validateContentType, validateRequestSize };
