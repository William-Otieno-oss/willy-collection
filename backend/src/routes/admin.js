const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");

// ============ SIZES ============

// Get all sizes (admin only)
router.get("/sizes", adminAuth, async (req, res) => {
  try {
    const sizes = await prisma.size.findMany({
      include: { stocks: true },
      orderBy: { id: "asc" },
    });
    res.json(sizes);
  } catch (err) {
    logger.error("Error fetching sizes:", { message: err.message });
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

// Create size (admin only)
router.post("/sizes", adminAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Size name is required" });
    }

    const cleanName = name.trim().substring(0, 50);
    if (cleanName.length < 1) {
      return res.status(400).json({ error: "Size name cannot be empty" });
    }

    const size = await prisma.size.create({
      data: { name: cleanName },
    });

    res.status(201).json(size);
  } catch (err) {
    logger.error("Error creating size:", { message: err.message });
    res.status(500).json({ error: "Failed to create size" });
  }
});

// Update size (admin only)
router.put("/sizes/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid size ID" });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Size name is required" });
    }

    const cleanName = name.trim().substring(0, 50);
    if (cleanName.length < 1) {
      return res.status(400).json({ error: "Size name cannot be empty" });
    }

    const size = await prisma.size.update({
      where: { id },
      data: { name: cleanName },
    });

    res.json(size);
  } catch (err) {
    logger.error("Error updating size:", { message: err.message });
    res.status(500).json({ error: "Failed to update size" });
  }
});

// Delete size (admin only)
router.delete("/sizes/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid size ID" });
    }

    await prisma.size.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting size:", { message: err.message });
    res.status(500).json({ error: "Failed to delete size" });
  }
});

// ============ STOCKS ============

// Upsert multiple stocks for a sneaker (admin only)
router.post("/sneakers/:id/stocks", adminAuth, async (req, res) => {
  try {
    const sneakerId = parseInt(req.params.id);
    const { stocks } = req.body;

    if (isNaN(sneakerId) || sneakerId <= 0) {
      return res.status(400).json({ error: "Invalid sneaker ID" });
    }

    if (!Array.isArray(stocks)) {
      return res.status(400).json({ error: "Stocks must be an array" });
    }

    // Verify sneaker exists
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: sneakerId },
    });
    if (!sneaker) {
      return res.status(404).json({ error: "Sneaker not found" });
    }

    const results = [];

    for (const stock of stocks.slice(0, 200)) {
      // Max 200 stocks per request
      const sizeId = parseInt(stock.sizeId);
      const quantity = Math.max(0, parseInt(stock.quantity) || 0);

      if (isNaN(sizeId) || sizeId <= 0) {
        continue;
      }

      // Verify size exists
      const sizeExists = await prisma.size.findUnique({
        where: { id: sizeId },
      });
      if (!sizeExists) {
        continue;
      }

      const existing = await prisma.stock.findFirst({
        where: { sneakerId, sizeId },
      });

      if (existing) {
        const updated = await prisma.stock.update({
          where: { id: existing.id },
          data: { quantity },
        });
        results.push(updated);
      } else {
        const created = await prisma.stock.create({
          data: { sneakerId, sizeId, quantity },
        });
        results.push(created);
      }
    }

    res.json(results);
  } catch (err) {
    logger.error("Error managing stocks:", { message: err.message });
    res.status(500).json({ error: "Failed to manage stocks" });
  }
});

// ============ SITE SETTINGS ============

// Get all site settings (admin only)
router.get("/site-settings", adminAuth, async (req, res) => {
  try {
    const rows = await prisma.siteSettings.findMany();
    const obj = {};
    for (const r of rows) {
      obj[r.key] = r.value;
    }
    res.json(obj);
  } catch (err) {
    logger.error("Error fetching site settings:", { message: err.message });
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

// Update or create site setting (admin only)
router.post("/site-settings", adminAuth, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "Key is required" });
    }

    if (value === undefined || value === null) {
      return res.status(400).json({ error: "Value is required" });
    }

    const cleanKey = key.trim().substring(0, 255);
    const cleanValue = String(value).substring(0, 5000);

    if (cleanKey.length < 1) {
      return res.status(400).json({ error: "Key cannot be empty" });
    }

    const setting = await prisma.siteSettings.upsert({
      where: { key: cleanKey },
      create: { key: cleanKey, value: cleanValue },
      update: { value: cleanValue },
    });

    res.json(setting);
  } catch (err) {
    logger.error("Error updating site settings:", { message: err.message });
    res.status(500).json({ error: "Failed to update site settings" });
  }
});

module.exports = router;
