const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { NodeClam } = require("clamscan");
const logger = require("../middleware/logger");

const quarantineDir = path.join(__dirname, "..", "..", "quarantine");
if (!fs.existsSync(quarantineDir)) {
  fs.mkdirSync(quarantineDir, { recursive: true });
}

let clamscan = null;

// Initialize ClamAV scanner (optional, for enhanced security)
const initializeScanner = async () => {
  try {
    clamscan = await new NodeClam().init({
      removeInfected: false,
      debug: process.env.NODE_ENV === "development",
      clamscan: {
        bin: process.env.CLAMSCAN_BIN,
      },
    });
    logger.info("ClamAV scanner initialized successfully");
  } catch (e) {
    clamscan = null;
    logger.warn(
      "ClamAV not available. Using fallback scanning. Ensure virus scanning is properly configured for production.",
    );
  }
};

// Initialize scanner on startup
if (process.env.ENABLE_VIRUS_SCANNING === "true") {
  initializeScanner();
}

async function computeChecksum(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid buffer provided");
  }
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function scanBuffer(buffer, filename) {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return { status: "error", infected: false, error: "Invalid buffer" };
    }

    if (!filename || typeof filename !== "string") {
      return { status: "error", infected: false, error: "Invalid filename" };
    }

    // Quick malware signature check (magic bytes)
    const magicBytes = buffer.slice(0, 4);
    const suspiciousPrefixes = [
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP (could be used for zip bombing)
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable
      Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // Windows PE executable
    ];

    for (const prefix of suspiciousPrefixes) {
      if (magicBytes.equals(prefix)) {
        return {
          status: "suspicious",
          infected: true,
          error: "File appears to be executable",
        };
      }
    }

    // If ClamAV is available and enabled, use it
    if (clamscan) {
      const target = path.join(
        quarantineDir,
        `${Date.now()}-${path.basename(filename)}`,
      );

      try {
        await fs.promises.writeFile(target, buffer);

        const { isInfected, viruses } = await clamscan.scan_file(target);

        // Clean up temp file
        try {
          await fs.promises.unlink(target);
        } catch (cleanupErr) {
          logger.warn("Failed to clean up temp scan file", {
            message: cleanupErr.message,
          });
        }

        return {
          status: isInfected ? "infected" : "clean",
          infected: !!isInfected,
          viruses: viruses || [],
        };
      } catch (scanErr) {
        logger.error("ClamAV scan error", { message: scanErr.message });
        return { status: "error", infected: false, error: scanErr.message };
      }
    }

    // Fall back to basic checks only
    return { status: "pending", infected: false };
  } catch (err) {
    logger.error("Scanner error", { message: err.message });
    return { status: "error", infected: false, error: err.message };
  }
}

module.exports = { computeChecksum, scanBuffer, initializeScanner };
