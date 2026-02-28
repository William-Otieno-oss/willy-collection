const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");

// Helper to validate brand input
function validateBrandName(name) {
  if (!name || typeof name !== "string") return null;
  const cleaned = name.trim().substring(0, 255);
  if (cleaned.length < 1) return null;
  return cleaned;
}

function validateSlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  const cleaned = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 255);
  if (cleaned.length < 1) return null;
  return cleaned;
}

// List all brands (public)
router.get("/", async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { order: "asc" },
    });
    res.json(brands);
  } catch (err) {
    logger.error("Error fetching brands:", { message: err.message });
    res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch brands" },
      });
  }
});

// Get single brand by slug (public)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "VALIDATION_FAILED", message: "Invalid slug" },
        });
    }

    const brand = await prisma.brand.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      include: { sneakers: true },
    });

    if (!brand) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Brand not found" },
        });
    }

    res.json(brand);
  } catch (err) {
    logger.error("Error fetching brand:", { message: err.message });
    res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch brand" },
      });
  }
});

// Create brand (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, slug, description, imageUrl, order, featured } = req.body;

    const validName = validateBrandName(name);
    if (!validName) {
      return res
        .status(400)
        .json({
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Brand name is required and must be a non-empty string",
          },
        });
    }

    const finalSlug = slug ? validateSlug(slug) : validateSlug(validName);
    if (!finalSlug) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "VALIDATION_FAILED", message: "Invalid slug" },
        });
    }

    const created = await prisma.brand.create({
      data: {
        name: validName,
        slug: finalSlug,
        description:
          description && typeof description === "string"
            ? description.trim().substring(0, 1000)
            : null,
        imageUrl:
          imageUrl && typeof imageUrl === "string"
            ? imageUrl.trim().substring(0, 2048)
            : null,
        order: Math.max(0, parseInt(order) || 0),
        featured: featured === true || featured === "true",
      },
    });

    res.status(201).json(created);
  } catch (err) {
    logger.error("Error creating brand:", { message: err.message });
    res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create brand" },
      });
  }
});

// Update brand (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "VALIDATION_FAILED", message: "Invalid brand ID" },
        });
    }

    // Verify brand exists
    const existingBrand = await prisma.brand.findUnique({ where: { id } });
    if (!existingBrand) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Brand not found" },
        });
    }

    const { name, slug, description, imageUrl, order, featured } = req.body;
    const update = {};

    if (name !== undefined) {
      const validName = validateBrandName(name);
      if (!validName) {
        return res
          .status(400)
          .json({
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Brand name must be a non-empty string",
            },
          });
      }
      update.name = validName;
    }

    if (slug !== undefined) {
      const validSlug = validateSlug(slug);
      if (!validSlug) {
        return res
          .status(400)
          .json({
            success: false,
            error: { code: "VALIDATION_FAILED", message: "Invalid slug" },
          });
      }
      update.slug = validSlug;
    }

    if (description !== undefined) {
      update.description =
        description && typeof description === "string"
          ? description.trim().substring(0, 1000)
          : null;
    }

    if (imageUrl !== undefined) {
      update.imageUrl =
        imageUrl && typeof imageUrl === "string"
          ? imageUrl.trim().substring(0, 2048)
          : null;
    }

    if (order !== undefined) {
      update.order = Math.max(0, parseInt(order) || 0);
    }

    if (featured !== undefined) {
      update.featured = featured === true || featured === "true";
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: update,
    });

    res.json(updated);
  } catch (err) {
    logger.error("Error updating brand:", { message: err.message });
    res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update brand" },
      });
  }
});

// Delete brand (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "VALIDATION_FAILED", message: "Invalid brand ID" },
        });
    }

    await prisma.brand.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting brand:", { message: err.message });
    res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete brand" },
      });
  }
});

module.exports = router;
