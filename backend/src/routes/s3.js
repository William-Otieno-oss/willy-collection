const express = require("express");
const router = express.Router();
const logger = require("../middleware/logger");
const { getPresignedPutUrl } = require("../services/storage");
const { adminAuth } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

// Allowed S3 prefixes for organization
const ALLOWED_PREFIXES = ["sneakers/", "banners/", "brands/"];

// Generate presigned URL for direct client upload (admin only)
router.post("/presign", adminAuth, async (req, res) => {
  try {
    const { key, contentType } = req.body || {};

    // Validate key
    if (!key || typeof key !== "string" || !key.trim()) {
      return res.status(400).json({ error: "Missing or invalid key" });
    }

    // Validate contentType
    if (!contentType || typeof contentType !== "string") {
      return res.status(400).json({ error: "Missing or invalid contentType" });
    }

    const cleanKey = key.trim();

    // Only allow image content types
    if (!contentType.startsWith("image/")) {
      return res
        .status(400)
        .json({ error: "Only image content types are allowed" });
    }

    // Restrict keys to expected prefixes to prevent overwriting other buckets/paths
    if (!ALLOWED_PREFIXES.some((p) => cleanKey.startsWith(p))) {
      return res.status(400).json({
        error: `Invalid key prefix. Allowed prefixes: ${ALLOWED_PREFIXES.join(", ")}`,
      });
    }

    // Disallow path traversal
    if (cleanKey.includes("..") || cleanKey.includes("\\")) {
      return res
        .status(400)
        .json({ error: "Invalid key - path traversal detected" });
    }

    // Enforce key length limit
    if (cleanKey.length > 1024) {
      return res.status(400).json({ error: "Key is too long" });
    }

    // List of allowed MIME types
    const ALLOWED_MIMES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];

    if (!ALLOWED_MIMES.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid content type. Allowed: ${ALLOWED_MIMES.join(", ")}`,
      });
    }

    try {
      const url = await getPresignedPutUrl(cleanKey, contentType, 3600); // 1 hour expiry
      res.json({ url, key: cleanKey, expiresIn: 3600 });
    } catch (s3Err) {
      logger.warn("S3 presign error", {
        message: s3Err.message,
        key: cleanKey,
      });

      // Fallback: For local development without AWS, provide a local upload endpoint
      if (!process.env.AWS_ACCESS_KEY_ID) {
        // Return a local upload endpoint that the frontend can use
        // The frontend will PUT to this endpoint instead of S3
        const filename = path.basename(cleanKey);
        const localUrl = `${req.protocol}://${req.get("host")}/api/s3/local-upload`;
        res.json({
          url: localUrl,
          key: cleanKey,
          expiresIn: 3600,
          isLocal: true,
        });
      } else {
        res.status(500).json({ error: "Failed to generate presigned URL" });
      }
    }
  } catch (err) {
    logger.error("Presign endpoint error", { message: err.message });
    res.status(500).json({ error: "Failed to process presign request" });
  }
});

// Local upload endpoint for development (admin only)
router.put("/local-upload", adminAuth, async (req, res) => {
  try {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.startsWith("image/")) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const uploadDir = path.join(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const ext =
      contentType === "image/svg+xml"
        ? ".svg"
        : contentType === "image/jpeg"
          ? ".jpg"
          : contentType === "image/png"
            ? ".png"
            : contentType === "image/webp"
              ? ".webp"
              : contentType === "image/gif"
                ? ".gif"
                : ".jpg";

    const filename = `${timestamp}-${random}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Collect the request body chunks
    let buffer = Buffer.alloc(0);
    req.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      // Limit file size to 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        req.pause();
        return res.status(413).json({ error: "File too large" });
      }
    });

    req.on("end", () => {
      try {
        // Write file to disk
        fs.writeFileSync(filepath, buffer);

        // Return 200 OK to indicate successful upload (S3 normally returns 200)
        res.status(200).end();
      } catch (writeErr) {
        logger.error("File write error", {
          message: writeErr.message,
          filepath,
        });
        res.status(500).json({ error: "Failed to write file" });
      }
    });

    req.on("error", (err) => {
      logger.error("Request stream error", { message: err.message });
      res.status(500).json({ error: "Upload error" });
    });
  } catch (err) {
    logger.error("Local upload error", { message: err.message });
    res.status(500).json({ error: "Failed to upload file" });
  }
});

module.exports = router;
