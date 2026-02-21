const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");
const { memoryUpload } = require("../utils/upload");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const fileType = require("file-type");
const { computeChecksum, scanBuffer } = require("../services/scanner");
const {
  uploadBufferToS3,
  deleteObject,
  headObject,
  getObjectBuffer,
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

    const sneakers = await prisma.sneaker.findMany({
      include: {
        images: {
          select: { id: true, url: true, order: true, filename: true },
        },
        stocks: true,
        brand: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.sneaker.count();

    res.json({
      data: sneakers,
      total,
      limit,
      offset,
    });
  } catch (err) {
    logger.error("Error fetching sneakers", { message: err.message });
    res.status(500).json({ error: "Failed to fetch sneakers" });
  }
});

// Get single sneaker by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "Invalid slug provided" });
    }

    const sneaker = await prisma.sneaker.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        stocks: true,
        brand: true,
      },
    });

    if (!sneaker) {
      return res.status(404).json({ error: "Sneaker not found" });
    }

    res.json(sneaker);
  } catch (err) {
    logger.error("Error fetching sneaker", { message: err.message });
    res.status(500).json({ error: "Failed to fetch sneaker" });
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
      return res.status(400).json({ error: modelValidation.error });
    }

    const priceValidation = validatePrice(data.price);
    if (!priceValidation.valid) {
      return res.status(400).json({ error: priceValidation.error });
    }

    // Brand resolution and validation
    let brandId = null;
    if (data.brandId) {
      const brandValidation = validateBrandId(data.brandId);
      if (!brandValidation.valid) {
        return res.status(400).json({ error: brandValidation.error });
      }
      brandId = brandValidation.value;
    } else if (data.brand) {
      const brand = await prisma.brand.findFirst({
        where: {
          OR: [
            {
              name: { equals: String(data.brand).trim(), mode: "insensitive" },
            },
            { slug: String(data.brand).toLowerCase().trim() },
          ],
        },
      });
      if (brand) brandId = brand.id;
    }

    if (!brandId) {
      return res
        .status(400)
        .json({ error: "Brand is required and must be valid" });
    }

    // Verify brand exists
    const brandRec = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brandRec) {
      return res.status(404).json({ error: "Specified brand does not exist" });
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
    res.status(500).json({ error: "Failed to create sneaker" });
  }
});

// Update sneaker (admin only)
router.put(
  "/:id",
  adminAuth,
  memoryUpload.array("images", 16),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid sneaker ID" });
      }

      // Verify sneaker exists
      const existingSneaker = await prisma.sneaker.findUnique({
        where: { id },
      });
      if (!existingSneaker) {
        return res.status(404).json({ error: "Sneaker not found" });
      }

      const data = req.body;
      const update = {};

      // Update fields with validation
      if (data.modelName !== undefined) {
        const validation = validateModelName(data.modelName);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
        update.modelName = validation.value;
      }

      if (data.price !== undefined) {
        const validation = validatePrice(data.price);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
        update.price = validation.value;
      }

      if (data.brandId !== undefined) {
        const validation = validateBrandId(data.brandId);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
        const brand = await prisma.brand.findUnique({
          where: { id: validation.value },
        });
        if (!brand) {
          return res
            .status(404)
            .json({ error: "Specified brand does not exist" });
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

      // Update sneaker
      const sneaker = await prisma.sneaker.update({
        where: { id },
        data: update,
      });

      // Handle image uploads if files provided
      const files = req.files || [];
      for (const f of files) {
        try {
          // Validate file type
          const ft = await fileType.fromBuffer(f.buffer);
          if (!ft || !ft.mime.startsWith("image/")) {
            logger.warn(`Skipping non-image file: ${f.originalname}`);
            continue;
          }

          // Check file size (max 10MB)
          if (f.buffer.length > 10 * 1024 * 1024) {
            logger.warn(`Skipping oversized file: ${f.originalname}`);
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
          let s3Key = undefined;

          try {
            const key = `sneakers/${sneaker.id}/${filename}`;
            await uploadBufferToS3(f.buffer, key, ft.mime);
            s3Key = key;

            // Construct correct image URL
            if (process.env.AWS_S3_ENDPOINT) {
              const endpoint = process.env.AWS_S3_ENDPOINT.replace(/\/$/, "");
              url = `${endpoint}/${process.env.AWS_S3_BUCKET}/${key}`;
            } else {
              url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
            }
          } catch (uploadErr) {
            logger.warn("S3 upload failed, using local fallback", {
              message: uploadErr.message,
            });
            const localName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}${path.extname(sanitizedName)}`;
            const dest = path.join(__dirname, "..", "..", "uploads", localName);
            fs.writeFileSync(dest, f.buffer);
            url = `/uploads/${localName}`;
          }

          // Scan file for security
          const scan = await scanBuffer(f.buffer, filename);

          // Create image record
          await prisma.sneakerImage.create({
            data: {
              url,
              filename: sanitizedName,
              s3Key,
              checksum,
              scanStatus: scan.status,
              sneakerId: sneaker.id,
            },
          });
        } catch (fileErr) {
          logger.error(`Failed to process file: ${f.originalname}`, {
            error: fileErr.message,
          });
        }
      }

      const updated = await prisma.sneaker.findUnique({
        where: { id },
        include: { images: true, stocks: true, brand: true },
      });

      res.json(updated);
    } catch (err) {
      logger.error("Error updating sneaker", { message: err.message });
      res.status(500).json({ error: "Failed to update sneaker" });
    }
  },
);

// Delete sneaker and its images (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid sneaker ID" });
    }

    // Verify sneaker exists
    const sneaker = await prisma.sneaker.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!sneaker) {
      return res.status(404).json({ error: "Sneaker not found" });
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
    res.status(500).json({ error: "Failed to delete sneaker" });
  }
});

// Delete a single image (admin only)
router.delete("/:sneakerId/images/:imageId", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.sneakerId);
    const imageId = parseInt(req.params.imageId);

    if (isNaN(sneakerId) || sneakerId <= 0 || isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({ error: "Invalid sneaker or image ID" });
    }

    // Verify image belongs to specified sneaker
    const img = await prisma.sneakerImage.findUnique({
      where: { id: imageId },
    });

    if (!img) {
      return res.status(404).json({ error: "Image not found" });
    }

    if (img.sneakerId !== sneakerId) {
      return res
        .status(403)
        .json({ error: "Image does not belong to this sneaker" });
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
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Register an image uploaded directly to S3 (admin only)
router.post("/:id/images/register", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.id);
    const { s3Key, filename, contentType, checksum, url } = req.body;

    if (isNaN(sneakerId) || sneakerId <= 0) {
      return res.status(400).json({ error: "Invalid sneaker ID" });
    }

    // Validate required fields
    if (!s3Key || typeof s3Key !== "string" || !s3Key.trim()) {
      return res.status(400).json({ error: "S3 key is required" });
    }

    if (!filename || typeof filename !== "string" || !filename.trim()) {
      return res.status(400).json({ error: "Filename is required" });
    }

    // Verify sneaker exists
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: sneakerId },
    });

    if (!sneaker) {
      return res.status(404).json({ error: "Sneaker not found" });
    }

    let scanStatus = "pending";

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

    // Construct correct image URL if not provided
    let imgUrl = url;
    if (!imgUrl) {
      if (process.env.AWS_S3_BUCKET) {
        if (process.env.AWS_S3_ENDPOINT) {
          const endpoint = process.env.AWS_S3_ENDPOINT.replace(/\/$/, "");
          imgUrl = `${endpoint}/${process.env.AWS_S3_BUCKET}/${s3Key}`;
        } else {
          imgUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3Key}`;
        }
      } else {
        // Fallback: construct local file URL from s3Key or filename
        // For s3Key format like "sneakers/{id}/{filename}", extract just the filename
        const urlFilename = s3Key.includes("/")
          ? s3Key.split("/").pop()
          : filename;
        imgUrl = `/uploads/${urlFilename}`;
      }
    }

    // Validate checksum if provided
    if (checksum && typeof checksum === "string") {
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
            error: "Checksum mismatch - file may be corrupted",
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
        return res.status(500).json({ error: "Failed to validate checksum" });
      }
    }

    // No checksum - create with pending status
    const created = await prisma.sneakerImage.create({
      data: {
        url: imgUrl,
        filename: filename.substring(0, 255),
        s3Key,
        checksum: null,
        scanStatus,
        sneakerId,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    logger.error("Image registration error", { message: err.message });
    res.status(500).json({ error: "Failed to register image" });
  }
});

// Update image display order (admin only)
router.post("/:id/images/order", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.id);
    const { order } = req.body;

    if (isNaN(sneakerId) || sneakerId <= 0) {
      return res.status(400).json({ error: "Invalid sneaker ID" });
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
      return res.status(404).json({ error: "Sneaker not found" });
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
    res.status(500).json({ error: "Failed to update image order" });
  }
});

module.exports = router;
