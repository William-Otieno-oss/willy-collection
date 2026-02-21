require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const logger = require("./middleware/logger");
const { rateLimit } = require("./middleware/rateLimit");
const { validateContentType } = require("./middleware/validation");

const app = express();
const port = parseInt(process.env.PORT || "4000", 10);

const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000",
  10,
);
const RATE_LIMIT_MAX_REQUESTS = parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "100",
  10,
);

// Request logging
app.use(logger.request);

// Enable gzip compression for responses
app.use(compression());

// CORS Configuration - restrict to allowed origins only
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400,
  }),
);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // HTTPS enforcement in production
  if (NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Content Security Policy - restrictive for security
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'",
  );

  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  next();
});

// Rate limiting (apply to all routes)
app.use(rateLimit(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS));

// Request validation
app.use(validateContentType);

// Body parser with limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Static file serving with cache control
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "..", "uploads"), {
    maxAge: "1d",
    etag: false,
  }),
);

// Routes with error handling
const authRoutes = require("./routes/auth");
const sneakerRoutes = require("./routes/sneakers");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const s3Routes = require("./routes/s3");
const bannerRoutes = require("./routes/banners");
const categoryRoutes = require("./routes/categories");
const brandRoutes = require("./routes/brands");

app.use("/api/auth", authRoutes);
app.use("/api/sneakers", sneakerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/s3", s3Routes);
app.use("/api/banners", bannerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Readiness check for Kubernetes/container orchestration
app.get("/ready", async (req, res) => {
  try {
    const prisma = require("./db");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn("Route not found", { method: req.method, path: req.path });
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isDev = NODE_ENV === "development";

  // Log error with context
  logger.error("Request error", {
    message: err.message || "Unknown error",
    path: req.path,
    method: req.method,
    statusCode,
    stack: isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error:
      NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
});

// Start server
const server = app.listen(port, "0.0.0.0", () => {
  logger.info("Backend server started", {
    port,
    environment: NODE_ENV,
    allowedOrigins: ALLOWED_ORIGINS.join(", "),
  });
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error("Port already in use", { port });
  } else {
    logger.error("Server error", { message: err.message });
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully...");
  server.close(async () => {
    try {
      logger.info("Server closed");
      const prisma = require("./db");
      await prisma.$disconnect();
      logger.info("Database disconnected");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { message: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Force shutdown due to timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", {
    reason: String(reason),
  });
});
