const express = require("express");
const router = express.Router();
const prisma = require("../db");
const logger = require("../middleware/logger");
const { adminAuth } = require("../middleware/auth");

// Validate email format
function validateEmail(email) {
  if (!email || typeof email !== "string") return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = email.trim().toLowerCase().substring(0, 254);
  if (!emailRegex.test(cleaned)) return null;
  return cleaned;
}

// Validate customer name
function validateCustomerName(name) {
  if (!name || typeof name !== "string") return null;
  const cleaned = name.trim().substring(0, 255);
  if (cleaned.length < 2) return null;
  return cleaned;
}

// Validate phone number
function validatePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  const cleaned = phone.trim().substring(0, 50);
  if (cleaned.length < 7) return null;
  return cleaned;
}

// Validate order items
function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.sneakerId === "number" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        item.price >= 0 &&
        item.quantity > 0 &&
        item.quantity <= 100,
    )
    .slice(0, 100); // Max 100 items per order
}

// Create order (public endpoint)
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      location,
      delivery,
      paymentMethod,
      items,
    } = req.body;

    // Validate required fields
    const name = validateCustomerName(customerName);
    if (!name) {
      return res.status(400).json({ error: "Invalid customer name" });
    }

    const validEmail = validateEmail(email);
    if (!validEmail) {
      return res.status(400).json({ error: "Valid email address is required" });
    }

    const validPhone = validatePhone(phone);
    if (!validPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const validItems = validateOrderItems(items);
    if (!validItems) {
      return res.status(400).json({ error: "Invalid order items" });
    }

    if (typeof location !== "string" || !location.trim()) {
      return res.status(400).json({ error: "Location is required" });
    }

    const cleanLocation = location.trim().substring(0, 500);

    if (typeof delivery !== "string" || !delivery.trim()) {
      return res.status(400).json({ error: "Delivery method is required" });
    }

    const cleanDelivery = delivery.trim().substring(0, 100);

    if (typeof paymentMethod !== "string" || !paymentMethod.trim()) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    const cleanPaymentMethod = paymentMethod.trim().substring(0, 100);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        customerName: name,
        phone: validPhone,
        location: cleanLocation,
        delivery: cleanDelivery,
        paymentMethod: cleanPaymentMethod,
        items: {
          create: validItems.map((item) => ({
            sneakerId: item.sneakerId,
            sneakerName: (item.sneakerName || "").toString().substring(0, 255),
            size: (item.size || "").toString().substring(0, 20),
            color: (item.color || "").toString().substring(0, 100),
            price: Math.max(0, parseFloat(item.price) || 0),
            quantity: Math.min(100, Math.max(1, parseInt(item.quantity) || 1)),
          })),
        },
      },
      include: { items: true },
    });

    logger.info("Order created successfully", {
      orderId: order.id,
      itemCount: validItems.length,
    });

    res.status(201).json(order);
  } catch (err) {
    logger.error("Order creation error", { message: err.message });
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get all orders (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.order.count();

    logger.info("Orders retrieved", {
      userId: req.user.id,
      count: orders.length,
      total,
    });

    res.json({
      data: orders,
      total,
      limit,
      offset,
    });
  } catch (err) {
    logger.error("Error fetching orders", {
      message: err.message,
      userId: req.user.id,
    });
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get single order by ID (admin only)
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      logger.warn("Order not found", { orderId: id, userId: req.user.id });
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    logger.error("Error fetching order", {
      message: err.message,
      orderId: id,
      userId: req.user.id,
    });
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Update order status (admin only)
router.put("/:id/status", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    const cleanStatus = status.trim().substring(0, 50);
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: cleanStatus },
      include: { items: true },
    });

    logger.info("Order status updated", {
      orderId: id,
      newStatus: cleanStatus,
      userId: req.user.id,
    });

    res.json(order);
  } catch (err) {
    logger.error("Error updating order", {
      message: err.message,
      orderId: id,
      userId: req.user.id,
    });
    res.status(500).json({ error: "Failed to update order" });
  }
});

module.exports = router;
