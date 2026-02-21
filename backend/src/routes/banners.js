const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");

// Helper to validate banner input
function validateBannerInput(data) {
  const errors = {};

  if (!data.title || typeof data.title !== "string") {
    errors.title = "Title is required";
  } else if (data.title.trim().length < 1) {
    errors.title = "Title cannot be empty";
  }

  if (data.imageUrl && typeof data.imageUrl !== "string") {
    errors.imageUrl = "Invalid image URL";
  }

  if (data.link && typeof data.link !== "string") {
    errors.link = "Invalid link";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// Get all active banners (public)
router.get("/", async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    res.json(banners);
  } catch (err) {
    logger.error("Error fetching banners:", { message: err.message });
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

// Get single banner by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid banner ID" });
    }

    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    res.json(banner);
  } catch (err) {
    logger.error("Error fetching banner:", { message: err.message });
    res.status(500).json({ error: "Failed to fetch banner" });
  }
});

// Create banner (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const errors = validateBannerInput(req.body);
    if (errors) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });
    }

    const {
      title,
      subtitle,
      description,
      imageUrl,
      link,
      ctaText,
      order,
      active,
    } = req.body;

    const banner = await prisma.banner.create({
      data: {
        title: title.trim().substring(0, 255),
        subtitle:
          subtitle && typeof subtitle === "string"
            ? subtitle.trim().substring(0, 255)
            : null,
        description:
          description && typeof description === "string"
            ? description.trim().substring(0, 2000)
            : null,
        imageUrl:
          imageUrl && typeof imageUrl === "string"
            ? imageUrl.trim().substring(0, 2048)
            : "",
        link:
          link && typeof link === "string"
            ? link.trim().substring(0, 2048)
            : null,
        ctaText:
          ctaText && typeof ctaText === "string"
            ? ctaText.trim().substring(0, 100)
            : "Shop Now",
        order: Math.max(0, parseInt(order) || 0),
        active: active !== false,
      },
    });

    res.status(201).json(banner);
  } catch (err) {
    logger.error("Error creating banner:", { message: err.message });
    res.status(500).json({ error: "Failed to create banner" });
  }
});

// Update banner (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid banner ID" });
    }

    // Verify banner exists
    const existingBanner = await prisma.banner.findUnique({ where: { id } });
    if (!existingBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    const {
      title,
      subtitle,
      description,
      imageUrl,
      link,
      ctaText,
      order,
      active,
    } = req.body;

    const update = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length < 1) {
        return res
          .status(400)
          .json({ error: "Title must be a non-empty string" });
      }
      update.title = title.trim().substring(0, 255);
    }

    if (subtitle !== undefined) {
      update.subtitle =
        subtitle && typeof subtitle === "string"
          ? subtitle.trim().substring(0, 255)
          : null;
    }

    if (description !== undefined) {
      update.description =
        description && typeof description === "string"
          ? description.trim().substring(0, 2000)
          : null;
    }

    if (imageUrl !== undefined) {
      update.imageUrl =
        imageUrl && typeof imageUrl === "string"
          ? imageUrl.trim().substring(0, 2048)
          : "";
    }

    if (link !== undefined) {
      update.link =
        link && typeof link === "string"
          ? link.trim().substring(0, 2048)
          : null;
    }

    if (ctaText !== undefined) {
      update.ctaText =
        ctaText && typeof ctaText === "string"
          ? ctaText.trim().substring(0, 100)
          : "Shop Now";
    }

    if (order !== undefined) {
      update.order = Math.max(0, parseInt(order) || 0);
    }

    if (active !== undefined) {
      update.active = active === true || active === "true";
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: update,
    });

    res.json(banner);
  } catch (err) {
    logger.error("Error updating banner:", { message: err.message });
    res.status(500).json({ error: "Failed to update banner" });
  }
});

// Delete banner (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid banner ID" });
    }

    await prisma.banner.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting banner:", { message: err.message });
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

module.exports = router;
