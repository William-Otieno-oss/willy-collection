const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");
const { memoryUpload } = require("../utils/upload");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
// file-type is an ESM module, handle it with dynamic import when needed
let fileTypeModule = null;
async function getFileType() {
  if (!fileTypeModule) {
    fileTypeModule = await import("file-type");
  }
  return fileTypeModule;
}
const { computeChecksum, scanBuffer } = require("../services/scanner");
const {
  uploadBufferToS3,
  deleteObject,
  headObject,
  getObjectBuffer,
  isConfigured,
  getPublicUrl,
} = require("../services/storage");

// ============ VALIDATION HELPERS ============

function validatePrice(price) {
  const num = parseFloat(price);
  if (isNaN(num) || num < 0) {
    return { valid: false, error: "Price must be a positive number" };
  }
  return { valid: true, value: num };
}

function validateModelName(name) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return {
      valid: false,
      error: "Model name is required and must be a string",
    };
  }
  if (name.length > 255) {
    return { valid: false, error: "Model name must not exceed 255 characters" };
  }
  return { valid: true, value: name.trim() };
}

function validateBrandId(brandId) {
  const id = parseInt(brandId);
  if (isNaN(id) || id <= 0) {
    return { valid: false, error: "Brand ID must be a positive integer" };
  }
  return { valid: true, value: id };
}

function validateDescription(description) {
  if (!description) return null;
  if (typeof description !== "string") return null;
  return description.trim().substring(0, 2000);
}

function validateCategories(categories) {
  if (!categories) return [];
  if (typeof categories === "string") {
    try {
      const parsed = JSON.parse(categories);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c) => typeof c === "string")
          .slice(0, 20)
          .map((c) => c.substring(0, 100));
      }
    } catch {
      // Fallback to treating as single category
      if (categories.length > 0) return [categories.substring(0, 100)];
    }
    return [];
  }
  if (Array.isArray(categories)) {
    return categories
      .filter((c) => typeof c === "string")
      .slice(0, 20)
      .map((c) => c.substring(0, 100));
  }
  return [];
}

function validateColors(colors) {
  if (!colors) return [];
  if (typeof colors === "string") {
    try {
      const parsed = JSON.parse(colors);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c) => typeof c === "string")
          .slice(0, 20)
          .map((c) => c.substring(0, 100));
      }
    } catch {
      if (colors.length > 0) return [colors.substring(0, 100)];
    }
    return [];
  }
  if (Array.isArray(colors)) {
    return colors
      .filter((c) => typeof c === "string")
      .slice(0, 20)
      .map((c) => c.substring(0, 100));
  }
  return [];
}

// ============ PUBLIC ROUTES ============

// Get all sneakers (with pagination for performance)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    // build dynamic filters based on query params
    const where = {};
    // accept `brand` (id or slug) or `brandId` in querystring for convenience
    const brandParam = req.query.brand || req.query.brandId;
    if (brandParam) {
      const asInt = parseInt(brandParam, 10);
      if (!isNaN(asInt)) {
        where.brandId = asInt;
      } else {
        // treat nondigits as slug (or name) and rely on relation filter
        where.brand = {
          slug: brandParam.toString().toLowerCase(),
        };
      }
    }
    // we intentionally do NOT filter categories at the database layer; the
    // previous substring-based approach caused Men/Women collision.  we'll
    // perform strict, case-insensitive matching below in JavaScript.
    // Note: Prisma PostgreSQL does not support mode: "insensitive" on contains
    // Must filter results in application layer
    const allSneakers = await prisma.sneaker.findMany({
      where: {
        ...(req.query.brand || req.query.category ? where : {}),
      },
      include: {
        images: {
          select: { id: true, url: true, order: true, filename: true },
        },
        stocks: {
          include: {
            size: true,
          },
        },
        brand: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply search and category filters in-memory if provided
    let filtered = allSneakers;
    const term =
      req.query.search && typeof req.query.search === "string"
        ? req.query.search.trim().toLowerCase()
        : null;
    let catFilterLower =
      req.query.category && typeof req.query.category === "string"
        ? req.query.category.toString().trim().toLowerCase()
        : null;

    // if the client passed a slug rather than the human-readable name
    // attempt to look it up and convert to the stored category name
    if (catFilterLower) {
      try {
        const foundCat = await prisma.category.findFirst({
          where: {
            slug: catFilterLower,
          },
        });
        if (foundCat && foundCat.name) {
          catFilterLower = foundCat.name.toLowerCase();
        }
      } catch (e) {
        /* ignore lookup failure, we'll just use the original string */
      }
    }

    if (term || catFilterLower) {
      filtered = allSneakers.filter((s) => {
        let match = false;
        if (term) {
          if (s.modelName && s.modelName.toLowerCase().includes(term))
            match = true;
          if (
            !match &&
            s.description &&
            s.description.toLowerCase().includes(term)
          )
            match = true;
          if (
            !match &&
            s.brand &&
            typeof s.brand === "object" &&
            s.brand.name &&
            s.brand.name.toLowerCase().includes(term)
          ) {
            match = true;
          }
        }
        if (catFilterLower) {
          try {
            const catsArr = JSON.parse(s.categories || "[]");
            if (Array.isArray(catsArr)) {
              if (
                catsArr.some((c) => String(c).toLowerCase() === catFilterLower)
              ) {
                match = true;
              }
            }
          } catch {
            // fallback to substring if JSON parse fails
            const cats = (s.categories || "").toLowerCase();
            if (cats.includes(catFilterLower)) {
              match = true;
            }
          }
        }
        return match;
      });
    }

    // Apply pagination to filtered results
    const paginated = filtered.slice(offset, offset + limit);

    // convert any relative image URLs to absolute using request info
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const resultsWithFullUrls = paginated.map((s) => {
      if (s.images && Array.isArray(s.images)) {
        s.images = s.images.map((img) => {
          if (img.url && !/^https?:\/\//i.test(img.url)) {
            return { ...img, url: baseUrl + img.url };
          }
          return img;
        });
      }
      return s;
    });

    // For public API consumers (including the storefront and automated tests),
    // return a simple array of sneakers. Metadata like total/offset can be
    // derived via separate endpoints when needed.
    res.json(resultsWithFullUrls);
  } catch (err) {
    logger.error("Error fetching sneakers", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch sneakers" },
    });
  }
});

// Get single sneaker by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid slug provided",
        },
      });
    }

    // support both slug and numeric id here.  Admin UI passes numeric ids when
    // editing, so treat purely-digits input as an ID lookup.  Normal clients send
    // human-readable slugs.
    let sneaker;
    if (/^\d+$/.test(slug.trim())) {
      // numeric string, lookup by id
      const id = parseInt(slug, 10);
      sneaker = await prisma.sneaker.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: { order: "asc" },
          },
          stocks: {
            include: {
              size: true,
            },
          },
          brand: true,
        },
      });
    } else {
      sneaker = await prisma.sneaker.findUnique({
        where: { slug: slug.toLowerCase().trim() },
        include: {
          images: {
            orderBy: { order: "asc" },
          },
          stocks: {
            include: {
              size: true,
            },
          },
          brand: true,
        },
      });
    }

    if (!sneaker) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Sneaker not found" },
      });
    }

    // ensure image URLs are absolute so clients don't need to guess the base
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    if (sneaker.images && Array.isArray(sneaker.images)) {
      sneaker.images = sneaker.images.map((img) => {
        if (img.url && !/^https?:\/\//i.test(img.url)) {
          return { ...img, url: baseUrl + img.url };
        }
        return img;
      });
    }

    res.json(sneaker);
  } catch (err) {
    logger.error("Error fetching sneaker", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch sneaker" },
    });
  }
});

// ============ ADMIN ROUTES ============

// Create sneaker (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    const modelValidation = validateModelName(data.modelName);
    if (!modelValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: modelValidation.error },
      });
    }

    const priceValidation = validatePrice(data.price);
    if (!priceValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: priceValidation.error },
      });
    }

    // Brand resolution and validation
    let brandId = null;
    if (data.brandId) {
      const brandValidation = validateBrandId(data.brandId);
      if (!brandValidation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: brandValidation.error,
          },
        });
      }
      brandId = brandValidation.value;
    } else if (data.brand) {
      const brand = await prisma.brand.findFirst({
        where: {
          OR: [
            {
              name: String(data.brand).trim(),
            },
            { slug: String(data.brand).toLowerCase().trim() },
          ],
        },
      });
      if (brand) brandId = brand.id;
    }

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Brand is required and must be valid",
        },
      });
    }

    // Verify brand exists
    const brandRec = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brandRec) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Specified brand does not exist",
        },
      });
    }

    // Generate slug
    const slug = slugify((brandRec.slug || "") + " " + modelValidation.value, {
      lower: true,
      limit: 200,
    });

    const categories = validateCategories(data.categories);
    const colors = validateColors(data.colors);

    const sneaker = await prisma.sneaker.create({
      data: {
        brandId,
        modelName: modelValidation.value,
        slug,
        description: validateDescription(data.description),
        price: priceValidation.value,
        categories: JSON.stringify(categories),
        colors: JSON.stringify(colors),
        featured: data.featured === true || data.featured === "true",
        inStock: data.inStock === true || data.inStock === "true",
      },
    });

    res.status(201).json(sneaker);
  } catch (err) {
    logger.error("Error creating sneaker", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create sneaker" },
    });
  }
});

// Update sneaker (admin only)
// multer might throw errors (file too large, invalid mime), intercept them so we respond cleanly
router.put(
  "/:id",
  adminAuth,
  (req, res, next) => {
    memoryUpload.array("images", 16)(req, res, (err) => {
      if (err) {
        logger.warn("Multer upload error", { error: err.message });
        // multer errors have code property
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            error: { code: "PAYLOAD_TOO_LARGE", message: "File too large" },
          });
        }
        return res.status(400).json({
          success: false,
          error: { code: "UPLOAD_ERROR", message: err.message },
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_FAILED", message: "Invalid sneaker ID" },
        });
      }

      // Verify sneaker exists
      const existingSneaker = await prisma.sneaker.findUnique({
        where: { id },
      });
      if (!existingSneaker) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Sneaker not found" },
        });
      }

      const data = req.body;
      const update = {};

      // Validate and collect fields
      if (data.modelName !== undefined) {
        const validation = validateModelName(data.modelName);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_FAILED", message: validation.error },
          });
        }
        update.modelName = validation.value;
      }
      if (data.price !== undefined) {
        const validation = validatePrice(data.price);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_FAILED", message: validation.error },
          });
        }
        update.price = validation.value;
      }
      if (data.brandId !== undefined) {
        const validation = validateBrandId(data.brandId);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: { code: "VALIDATION_FAILED", message: validation.error },
          });
        }
        const brand = await prisma.brand.findUnique({
          where: { id: validation.value },
        });
        if (!brand) {
          return res.status(404).json({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Specified brand does not exist",
            },
          });
        }
        update.brandId = validation.value;
      }
      if (data.description !== undefined) {
        update.description = validateDescription(data.description);
      }
      if (data.categories !== undefined) {
        update.categories = JSON.stringify(validateCategories(data.categories));
      }
      if (data.colors !== undefined) {
        update.colors = JSON.stringify(validateColors(data.colors));
      }
      if (data.featured !== undefined) {
        update.featured = data.featured === "true" || data.featured === true;
      }
      if (data.inStock !== undefined) {
        update.inStock = data.inStock === "true" || data.inStock === true;
      }

      // Process any uploaded files first
      const files = req.files || [];
      const inserts = [];
      const s3Configured = isConfigured();

      for (const f of files) {
        logger.info("Received file upload", {
          sneakerId: existingSneaker.id,
          name: f.originalname,
          size: f.size,
        });

        if (!f || !f.buffer || !Buffer.isBuffer(f.buffer)) {
          logger.warn("Upload missing buffer, skipping file", {
            name: f && f.originalname,
          });
          continue;
        }

        const ftMod = await getFileType();
        const ft = await ftMod.fileTypeFromBuffer(f.buffer);
        if (!ft || !ft.mime.startsWith("image/")) {
          logger.warn("Skipping non-image upload", { name: f.originalname });
          continue;
        }
        if (f.buffer.length > 10 * 1024 * 1024) {
          logger.warn("Skipping oversized upload", { name: f.originalname });
          continue;
        }

        const checksum = await computeChecksum(f.buffer);
        const sanitizedName = String(f.originalname)
          .replace(/[^a-zA-Z0-9.\-_]/g, "_")
          .substring(0, 100);
        const filename =
          slugify(path.basename(sanitizedName, path.extname(sanitizedName))) +
          "-" +
          Date.now() +
          path.extname(sanitizedName);
        let url = `/uploads/${sanitizedName}`;
        let s3Key;

        if (s3Configured) {
          try {
            const key = `sneakers/${existingSneaker.id}/${filename}`;
            logger.info("Uploading buffer to S3", { key });
            const uploadRes = await uploadBufferToS3(f.buffer, key, ft.mime);
            s3Key = uploadRes.key;
            url = uploadRes.url || getPublicUrl(uploadRes.key);
            logger.info("S3 upload succeeded", { url });
          } catch (uploadErr) {
            logger.error("Upload to storage failed", {
              message: uploadErr.message,
              file: f.originalname,
            });
            return res.status(502).json({
              error: "Upload to storage failed",
              message: uploadErr.message,
            });
          }
        } else {
          // Local fallback when S3 is not configured
          try {
            const localName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}${path.extname(sanitizedName)}`;
            const dest = path.join(__dirname, "..", "..", "uploads", localName);
            fs.writeFileSync(dest, f.buffer);
            url = `/uploads/${localName}`;
            logger.info("Buffered file written to disk", { dest, url });
          } catch (diskErr) {
            logger.error("Failed to write upload to disk", {
              message: diskErr.message,
            });
            return res.status(500).json({
              success: false,
              error: {
                code: "INTERNAL_ERROR",
                message: "Failed to store uploaded file",
              },
            });
          }
        }

        const scan = await scanBuffer(f.buffer, filename);
        inserts.push({
          url,
          filename: sanitizedName,
          s3Key,
          checksum,
          scanStatus: scan.status,
          sneakerId: existingSneaker.id,
        });
      }

      // perform database updates inside transaction to keep data consistent
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.sneaker.update({
          where: { id: existingSneaker.id },
          data: update,
        });
        for (const img of inserts) {
          await tx.sneakerImage.create({ data: img });
          logger.info("Inserted image record", { img });
        }
        return u;
      });

      const result = await prisma.sneaker.findUnique({
        where: { id: existingSneaker.id },
        include: { images: true, stocks: true, brand: true },
      });

      res.json(result);
    } catch (err) {
      logger.error("Error updating sneaker", { message: err.message });
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update sneaker",
        },
      });
    }
  },
);

// Delete sneaker and its images (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid sneaker ID" },
      });
    }

    // Verify sneaker exists
    const sneaker = await prisma.sneaker.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!sneaker) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Sneaker not found" },
      });
    }

    // Delete associated images
    for (const img of sneaker.images) {
      try {
        // Delete local file if exists
        if (img.url && img.url.startsWith("/uploads/")) {
          const filePath = path.join(__dirname, "..", "..", img.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        // Delete from S3 if s3Key exists
        if (img.s3Key) {
          try {
            await deleteObject(img.s3Key);
          } catch (s3Err) {
            logger.warn("Failed to delete S3 object", {
              s3Key: img.s3Key,
              message: s3Err.message,
            });
          }
        }
      } catch (delErr) {
        logger.warn("Failed to delete file", {
          url: img.url,
          message: delErr.message,
        });
      }
    }

    // Delete all image records
    await prisma.sneakerImage.deleteMany({ where: { sneakerId: id } });

    // Delete sneaker
    await prisma.sneaker.delete({ where: { id } });

    res.json({ success: true, message: "Sneaker deleted successfully" });
  } catch (err) {
    logger.error("Error deleting sneaker", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete sneaker" },
    });
  }
});

// Delete a single image (admin only)
router.delete("/:sneakerId/images/:imageId", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.sneakerId);
    const imageId = parseInt(req.params.imageId);

    if (isNaN(sneakerId) || sneakerId <= 0 || isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid sneaker or image ID",
        },
      });
    }

    // Verify image belongs to specified sneaker
    const img = await prisma.sneakerImage.findUnique({
      where: { id: imageId },
    });

    if (!img) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Image not found" },
      });
    }

    if (img.sneakerId !== sneakerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Image does not belong to this sneaker",
        },
      });
    }

    // Delete local file if exists
    try {
      if (img.url && img.url.startsWith("/uploads/")) {
        const filePath = path.join(__dirname, "..", "..", img.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (localErr) {
      logger.warn("Failed to delete local file", {
        url: img.url,
        message: localErr.message,
      });
    }

    // Delete from S3 if s3Key exists
    if (img.s3Key) {
      try {
        await deleteObject(img.s3Key);
      } catch (s3Err) {
        logger.warn(`Failed to delete S3 object: ${img.s3Key}`, {
          error: s3Err.message,
        });
      }
    }

    // Delete image record
    await prisma.sneakerImage.delete({ where: { id: imageId } });

    res.json({ success: true, message: "Image deleted successfully" });
  } catch (err) {
    logger.error("Error deleting image", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete image" },
    });
  }
});

// Register an image uploaded directly to S3 (admin only)
router.post("/:id/images/register", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.id);
    const { s3Key, filename, contentType, checksum, url } = req.body || {};

    if (isNaN(sneakerId) || sneakerId <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid sneaker ID" },
      });
    }

    // Validate required fields
    if (!s3Key || typeof s3Key !== "string" || !s3Key.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "S3 key is required" },
      });
    }

    if (!filename || typeof filename !== "string" || !filename.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Filename is required" },
      });
    }

    // Verify sneaker exists
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: sneakerId },
    });

    if (!sneaker) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Sneaker not found" },
      });
    }

    // log input for debugging
    logger.info("Image registration request body", {
      sneakerId,
      s3Key,
      filename,
      contentType,
      checksum,
      url,
    });

    let scanStatus = "pending";

    // if we have a storage client configured we can inspect the object
    const awsConfigured = isConfigured();

    if (awsConfigured) {
      try {
        if (headObject) {
          const meta = await headObject(s3Key);
          if (
            contentType &&
            meta.ContentType &&
            !meta.ContentType.startsWith(contentType.split("/")[0])
          ) {
            logger.warn("MIME type mismatch for S3 object", {
              s3Key,
              expectedContentType: contentType,
              actualContentType: meta.ContentType,
            });
          }
        }
      } catch (headErr) {
        logger.warn("Failed to head S3 object", {
          s3Key,
          message: headErr.message,
        });
      }
    } else {
      logger.info(
        "Skipping S3 object inspection because storage is not configured",
      );
    }

    // Construct correct image URL if not provided by client
    let imgUrl = url;
    if (!imgUrl) {
      if (process.env.AWS_S3_BUCKET) {
        if (process.env.AWS_S3_ENDPOINT) {
          const endpoint = process.env.AWS_S3_ENDPOINT.replace(/\/$/, "");
          imgUrl = `${endpoint}/${process.env.AWS_S3_BUCKET}/${s3Key}`;
        } else {
          imgUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${
            process.env.AWS_REGION || "us-east-1"
          }.amazonaws.com/${s3Key}`;
        }
      } else {
        // Fallback: construct local file URL from s3Key or filename
        const urlFilename =
          s3Key && s3Key.includes("/") ? s3Key.split("/").pop() : filename;
        imgUrl = `/uploads/${urlFilename}`;
      }
    }

    logger.info("Registering image for sneaker", {
      sneakerId,
      s3Key,
      url: imgUrl,
      awsConfigured,
    });

    // Validate checksum if provided and if storage available
    if (checksum && typeof checksum === "string" && awsConfigured) {
      try {
        const buf = await getObjectBuffer(s3Key);
        const actual = await computeChecksum(buf);

        if (actual !== checksum) {
          try {
            await deleteObject(s3Key);
          } catch (delErr) {
            logger.warn("Failed to delete mismatched S3 object", {
              s3Key,
              message: delErr.message,
            });
          }

          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Checksum mismatch - file may be corrupted",
            },
          });
        }

        const scan = await scanBuffer(buf, filename);

        const created = await prisma.sneakerImage.create({
          data: {
            url: imgUrl,
            filename: filename.substring(0, 255),
            s3Key,
            checksum,
            scanStatus: scan.status,
            sneakerId,
          },
        });

        return res.status(201).json(created);
      } catch (err) {
        logger.error("Checksum validation error", { message: err.message });
        return res.status(500).json({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to validate checksum",
          },
        });
      }
    }

    // No checksum or storage is not configured - create with pending status
    const createdNoChecksum = await prisma.sneakerImage.create({
      data: {
        url: imgUrl,
        filename: filename.substring(0, 255),
        s3Key,
        checksum: checksum && awsConfigured ? checksum : null,
        scanStatus,
        sneakerId,
      },
    });

    return res.status(201).json(createdNoChecksum);
  } catch (err) {
    logger.error("Image registration error", { message: err.message });
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to register image" },
    });
  }
});

// Update image display order (admin only)
router.post("/:id/images/order", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.id);
    const { order } = req.body;

    if (isNaN(sneakerId) || sneakerId <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid sneaker ID" },
      });
    }

    if (!Array.isArray(order)) {
      return res.status(400).json({
        error: "Order must be an array of image IDs",
      });
    }

    // Verify sneaker exists
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: sneakerId },
    });

    if (!sneaker) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Sneaker not found" },
      });
    }

    // Validate all IDs are valid integers
    const validIds = order
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id) && id > 0)
      .slice(0, 500); // Max 500 images per sneaker

    if (validIds.length !== order.length) {
      return res.status(400).json({
        error: "All image IDs must be positive integers",
      });
    }

    // Update order for each image
    const updates = validIds.map((imageId, idx) =>
      prisma.sneakerImage
        .update({
          where: { id: imageId },
          data: { order: idx },
        })
        .catch((err) => {
          logger.warn("Failed to update image order", {
            imageId,
            message: err.message,
          });
          return null;
        }),
    );

    await Promise.all(updates);

    res.json({ success: true, message: "Image order updated" });
  } catch (err) {
    logger.error("Error updating image order", { message: err.message });
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update image order",
      },
    });
  }
});

module.exports = router;
