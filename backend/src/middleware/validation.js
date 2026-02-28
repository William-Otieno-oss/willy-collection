/**
 * Request validation middleware
 * Ensures proper request structure and content-type
 */

const validateContentType = (req, res, next) => {
  // allow JSON but also multipart/form-data, urlencoded and raw image streams
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"] || "";
    // If it's a JSON request we're happy
    if (contentType.includes("application/json")) {
      return next();
    }

    // allow standard form submissions (urlencoded) and file uploads
    if (
      contentType.startsWith("multipart/form-data") ||
      contentType.startsWith("application/x-www-form-urlencoded")
    ) {
      return next();
    }

    // allow direct image PUTs (used by /api/s3/local-upload)
    if (contentType.startsWith("image/")) {
      return next();
    }

    // otherwise we reject
    return res.status(400).json({
      error: "Content-Type must be application/json or a supported upload type",
    });
  }
  next();
};

const validateRequestSize = (req, res, next) => {
  // Express already handles this via bodyParser limits
  // This middleware is for custom validation if needed
  next();
};

module.exports = { validateContentType, validateRequestSize };
