// load environment variables in two steps: first .env then .env.local
// This mirrors Next.js behavior and allows developers to override values
// without modifying the committed `.env` file.  `.env.local` is gitignored.
require("dotenv").config();
// override with .env.local if present
require("dotenv").config({ path: ".env.local", override: true });

const config = require("./config");

// basic required environment variable validation
if (!config.JWT_SECRET || !config.DATABASE_URL) {
  console.error("ERROR: missing required JWT_SECRET or DATABASE_URL");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const logger = require("./middleware/logger");
const { rateLimit } = require("./middleware/rateLimit");
const { validateContentType } = require("./middleware/validation");
const prisma = require("./db");
const bcrypt = require("bcrypt");

const app = express();
const port = config.PORT;
const NODE_ENV = config.NODE_ENV;
const ALLOWED_ORIGINS = config.ALLOWED_ORIGINS;

// In production, trust proxy headers (for HTTPS enforcement)
if (NODE_ENV === "production") {
  app.enable("trust proxy");
}

// Parse cookies for refresh token flow
app.use(cookieParser());

const RATE_LIMIT_WINDOW_MS = config.RATE_LIMIT_WINDOW_MS;
const RATE_LIMIT_MAX_REQUESTS = config.RATE_LIMIT_MAX_REQUESTS;

// Request logging
app.use(logger.request);

// HTTPS enforcement (Production only, robust)
if (config.NODE_ENV === "production") {
  app.use((req, res, next) => {
    // If not secure, redirect to HTTPS
    const isSecure = req.secure || req.get("X-Forwarded-Proto") === "https";
    if (!isSecure) {
      // If GET or HEAD, redirect. Otherwise, reject (to avoid unsafe redirects for POST, etc.)
      if (req.method === "GET" || req.method === "HEAD") {
        const redirectUrl = "https://" + req.get("host") + req.originalUrl;
        return res.redirect(301, redirectUrl);
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: "INSECURE_REQUEST",
            message: "HTTPS required in production.",
          },
        });
      }
    }
    next();
  });
}

// Enable gzip compression for responses
app.use(compression());

// CORS Configuration - restrict to allowed origins only
app.use(
  cors({
    origin: (origin, callback) => {
      // log origin for debugging CORS issues
      logger.info("CORS origin check", { origin });
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-requested-with",
      "x-upload-key",
    ],
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

  // HSTS header in production (enforce HTTPS for 1 year)
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
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: "1d",
    etag: false,
  }),
);

// Fallback explicit route to serve uploaded files. This ensures files written
// to the backend uploads directory are returned even if the static middleware
// misses them for any reason (helps during local dev on Windows/paths).
app.get("/uploads/*", (req, res, next) => {
  try {
    const relPath = req.path.replace(/^\/+/, ""); // e.g. "uploads/filename"
    const filePath = path.join(__dirname, "..", relPath);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return next();
  } catch (err) {
    // let the global error handler/logging handle unexpected issues
    return next(err);
  }
});

// Routes with error handling
const authRoutes = require("./routes/auth");
const sneakerRoutes = require("./routes/sneakers");
const orderRoutes = require("./routes/orders");
const paymentsRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const s3Routes = require("./routes/s3");
const bannerRoutes = require("./routes/banners");
const categoryRoutes = require("./routes/categories");
const brandRoutes = require("./routes/brands");

// register routes (logger used elsewhere for request tracking)
app.use("/api/auth", authRoutes);
app.use("/api/sneakers", sneakerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentsRoutes);
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
const readinessHandler = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
};
app.get("/ready", readinessHandler);
app.get("/api/ready", readinessHandler);

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

// Ensure a default admin user exists in non-production environments so that
// automated tests and local admin flows can authenticate reliably.
const ensureDevAdmin = async () => {
  if (NODE_ENV === "production") return;

  try {
    const email = (process.env.ADMIN_EMAIL || "admin@example.com")
      .toLowerCase()
      .trim();
    let password = process.env.ADMIN_PASSWORD;

    if (!password) {
      // Instead of failing when the variable is missing, log a warning and
      // generate a temporary password so the server can start in CI or local
      // environments that don't set it explicitly. This keeps the tests
      // working without needing manual env configuration.
      logger.warn(
        "ADMIN_PASSWORD not set; creating dev admin with random password",
      );
      password = Math.random().toString(36).slice(-8);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hash,
          name: "Admin",
          isAdmin: true,
        },
      });
      logger.info("Dev admin user created", { email: user.email, id: user.id });
    } else if (!user.isAdmin) {
      user = await prisma.user.update({
        where: { email },
        data: { isAdmin: true },
      });
      logger.info("Existing user elevated to admin", {
        email: user.email,
        id: user.id,
      });
    }
  } catch (err) {
    logger.error("Failed to ensure dev admin user", { message: err.message });
    throw err;
  }
};

// Start server with pre-flight checks
const startServer = async () => {
  try {
    // verify database connection before binding
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection successful");

    // In non-production, ensure a default admin user exists for tests and
    // local admin access.
    await ensureDevAdmin();

    if (NODE_ENV !== "production") {
      try {
        const seed = require("../scripts/seed");
        if (typeof seed.main === "function") {
          await seed.main();
        }
      } catch (err) {
        logger.warn("Failed to execute full seed script", {
          message: err.message,
        });
      }
    }
  } catch (err) {
    logger.error("Database connection failed", { message: err.message });
    // exit early if the DB is not reachable
    process.exit(1);
  }

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
};

startServer();

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
