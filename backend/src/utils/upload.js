const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Parse integer env var with fallback
function parseIntEnv(name, fallback) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

const MAX_UPLOAD_SIZE = parseIntEnv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024); // 5MB default
const MAX_FILES = parseIntEnv("MAX_FILES", 16); // 16 files default

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .substring(0, 100);
    const randomStr = crypto.randomBytes(6).toString("hex");
    cb(null, `${Date.now()}-${randomStr}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

// Validate file MIME type using extension and content checking
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

function fileFilter(req, file, cb) {
  if (!file || !file.mimetype || typeof file.mimetype !== "string") {
    return cb(new Error("Invalid file provided"), false);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only image uploads are allowed"), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  if (!allowedExts.includes(ext)) {
    return cb(new Error("Invalid file extension"), false);
  }

  cb(null, true);
}

const diskUpload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: MAX_FILES,
  },
});

const memoryUpload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: MAX_FILES,
  },
});

module.exports = { diskUpload, memoryUpload, MAX_UPLOAD_SIZE, MAX_FILES };
