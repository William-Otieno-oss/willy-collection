const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");

// Helper to validate category input
function validateCategoryName(name) {
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

// Get all categories with mega-menu items (public)
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        megaMenuItems: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    res.json(categories);
  } catch (err) {
    logger.error("Error fetching categories:", { message: err.message });
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get featured categories only (public)
router.get("/featured", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { featured: true },
      include: {
        megaMenuItems: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    res.json(categories);
  } catch (err) {
    logger.error("Error fetching featured categories:", {
      message: err.message,
    });
    res.status(500).json({ error: "Failed to fetch featured categories" });
  }
});

// Get single category by slug (public)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "Invalid slug" });
    }

    const category = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      include: {
        megaMenuItems: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    logger.error("Error fetching category:", { message: err.message });
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Create category (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, slug, icon, description, order, featured } = req.body;

    const validName = validateCategoryName(name);
    if (!validName) {
      return res.status(400).json({
        error: "Category name is required and must be a non-empty string",
      });
    }

    const finalSlug = slug ? validateSlug(slug) : validateSlug(validName);

    if (!finalSlug) {
      return res.status(400).json({ error: "Invalid slug" });
    }

    const category = await prisma.category.create({
      data: {
        name: validName,
        slug: finalSlug,
        icon:
          icon && typeof icon === "string"
            ? icon.trim().substring(0, 100)
            : null,
        description:
          description && typeof description === "string"
            ? description.trim().substring(0, 500)
            : null,
        order: Math.max(0, parseInt(order) || 0),
        featured: featured === true || featured === "true",
      },
      include: { megaMenuItems: true },
    });

    res.status(201).json(category);
  } catch (err) {
    logger.error("Error creating category:", { message: err.message });
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update category (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Verify category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    const { name, slug, icon, description, order, featured } = req.body;
    const update = {};

    if (name !== undefined) {
      const validName = validateCategoryName(name);
      if (!validName) {
        return res
          .status(400)
          .json({ error: "Category name must be a non-empty string" });
      }
      update.name = validName;
    }

    if (slug !== undefined) {
      const validSlug = validateSlug(slug);
      if (!validSlug) {
        return res.status(400).json({ error: "Invalid slug" });
      }
      update.slug = validSlug;
    }

    if (icon !== undefined) {
      update.icon =
        icon && typeof icon === "string" ? icon.trim().substring(0, 100) : null;
    }

    if (description !== undefined) {
      update.description =
        description && typeof description === "string"
          ? description.trim().substring(0, 500)
          : null;
    }

    if (order !== undefined) {
      update.order = Math.max(0, parseInt(order) || 0);
    }

    if (featured !== undefined) {
      update.featured = featured === true || featured === "true";
    }

    const category = await prisma.category.update({
      where: { id },
      data: update,
      include: { megaMenuItems: true },
    });

    res.json(category);
  } catch (err) {
    logger.error("Error updating category:", { message: err.message });
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete category (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting category:", { message: err.message });
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Add mega-menu item to category (admin only)
router.post("/:categoryId/mega-menu", adminAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const { title, link, icon, order } = req.body;

    if (isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Menu title is required" });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const item = await prisma.megaMenuItem.create({
      data: {
        title: title.trim().substring(0, 255),
        link:
          link && typeof link === "string"
            ? link.trim().substring(0, 2048)
            : null,
        icon:
          icon && typeof icon === "string"
            ? icon.trim().substring(0, 100)
            : null,
        order: Math.max(0, parseInt(order) || 0),
        categoryId,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    logger.error("Error creating mega-menu item:", { message: err.message });
    res.status(500).json({ error: "Failed to create mega-menu item" });
  }
});

// Update mega-menu item (admin only)
router.put("/mega-menu/:itemId", adminAuth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({ error: "Invalid menu item ID" });
    }

    const { title, link, icon, order } = req.body;
    const update = {};

    if (title !== undefined) {
      if (!title || typeof title !== "string") {
        return res
          .status(400)
          .json({ error: "Menu title must be a non-empty string" });
      }
      update.title = title.trim().substring(0, 255);
    }

    if (link !== undefined) {
      update.link =
        link && typeof link === "string"
          ? link.trim().substring(0, 2048)
          : null;
    }

    if (icon !== undefined) {
      update.icon =
        icon && typeof icon === "string" ? icon.trim().substring(0, 100) : null;
    }

    if (order !== undefined) {
      update.order = Math.max(0, parseInt(order) || 0);
    }

    const item = await prisma.megaMenuItem.update({
      where: { id: itemId },
      data: update,
    });

    res.json(item);
  } catch (err) {
    logger.error("Error updating mega-menu item:", { message: err.message });
    res.status(500).json({ error: "Failed to update mega-menu item" });
  }
});

// Delete mega-menu item (admin only)
router.delete("/mega-menu/:itemId", adminAuth, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({ error: "Invalid menu item ID" });
    }

    await prisma.megaMenuItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting mega-menu item:", { message: err.message });
    res.status(500).json({ error: "Failed to delete mega-menu item" });
  }
});

module.exports = router;
