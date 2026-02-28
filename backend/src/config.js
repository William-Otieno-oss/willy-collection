// central configuration with validation

const required = [
  "JWT_SECRET",
  "DATABASE_URL",
  // these are needed if MPESA payments are used in production
  // they can be missing in development but will produce warnings
  "LIPANA_TOKEN",
  "LIPANA_SHORTCODE",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(
    "WARNING: missing required environment variables:",
    missing.join(", "),
  );
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,

  LIPANA_TOKEN: process.env.LIPANA_TOKEN,
  LIPANA_SHORTCODE: process.env.LIPANA_SHORTCODE,
  LIPANA_ENV: process.env.LIPANA_ENV || "sandbox",
  LIPANA_CALLBACK_URL: process.env.LIPANA_CALLBACK_URL,

  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),

  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10,
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10,
  ),
};
