const jwt = require("jsonwebtoken");
const logger = require("./logger");

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

function adminAuth(req, res, next) {
  try {
    // Support Bearer header or HTTP-only cookie for access token
    let token;
    const auth = req.headers.authorization;
    if (auth && typeof auth === "string") {
      const parts = auth.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      } else {
        logger.warn("Invalid authorization format attempt", { path: req.path });
        return res.status(401).json({
          error: "Invalid authorization format. Expected: Bearer <token>",
        });
      }
    }

    // If no header token, try cookie
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token || typeof token !== "string") {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization token" });
    }

    // Verify token is not empty
    if (!token || token.trim() === "" || token.length > 500) {
      logger.warn("Invalid token format attempt", { path: req.path });
      return res.status(401).json({ error: "Invalid token" });
    }

    // Verify JWT token signature and expiration
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        logger.warn("Token expired attempt", { path: req.path });
        return res
          .status(401)
          .json({ error: "Token has expired. Please log in again." });
      }
      if (jwtErr.name === "JsonWebTokenError") {
        logger.warn("Malformed token attempt", { path: req.path });
        return res.status(401).json({ error: "Invalid or malformed token" });
      }
      logger.warn("JWT verification failed", {
        path: req.path,
        error: jwtErr.message,
      });
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Ensure payload has required fields and admin flag
    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.id ||
      !payload.email ||
      !payload.isAdmin
    ) {
      logger.warn("Invalid token payload", { path: req.path });
      return res
        .status(403)
        .json({ error: "Insufficient permissions. Admin access required." });
    }

    // Attach user info to request for downstream handlers
    req.user = {
      id: payload.id,
      email: payload.email,
      isAdmin: payload.isAdmin,
    };

    next();
  } catch (err) {
    logger.error("Auth middleware error", {
      message: err.message,
      path: req.path,
    });
    return res.status(401).json({ error: "Authentication failed" });
  }
}

module.exports = { adminAuth };
