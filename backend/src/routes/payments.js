const express = require("express");
const router = express.Router();
const axios = require("axios");
const prisma = require("../db");
const logger = require("../middleware/logger");

// base URL depends on sandbox vs production
const config = require("../config");

const LIPANA_BASE =
  config.LIPANA_ENV === "sandbox"
    ? "https://sandbox-api.sapawoverse.co.ke/lipana-pay/api/v1/express/stk/push"
    : "https://api.sapawoverse.co.ke/lipana-pay/api/v1/express/stk/push";

// developer notice if credentials missing
if (!config.LIPANA_TOKEN || !config.LIPANA_SHORTCODE) {
  logger.warn(
    "Lipana credentials not set in environment; MPESA route will fail",
  );
}

// initiate an MPESA STK push via Lipana API
router.post("/mpesa", async (req, res) => {
  try {
    let { orderId, mpesaNumber, amount, items, customerName, phone, location } =
      req.body;
    if (!mpesaNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Missing MPESA number" });
    }

    let order;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
      amount = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    } else {
      // create provisional order record
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "No items" });
      }
      if (!amount) {
        amount = items.reduce(
          (sum, it) => sum + (it.price || 0) * (it.quantity || 0),
          0,
        );
      }
      order = await prisma.order.create({
        data: {
          customerName: customerName || "",
          phone: phone || "",
          location: location || "",
          delivery: "mpesa",
          paymentMethod: "mpesa",
          status: "Pending",
          items: {
            create: items.map((it) => ({
              sneakerId: it.sneakerId || 0,
              sneakerName: it.sneakerName || "",
              size: it.size || "",
              color: it.color || "",
              price: it.price || 0,
              quantity: it.quantity || 1,
            })),
          },
        },
        include: { items: true },
      });
      orderId = order.id;
    }

    const amountToCharge = amount;

    // check for required Lipana credentials
    if (!config.LIPANA_TOKEN || !config.LIPANA_SHORTCODE) {
      return res.status(400).json({
        success: false,
        message:
          "Lipana payment gateway not configured. Add LIPANA_TOKEN and LIPANA_SHORTCODE to .env",
      });
    }

    // build Lipana payload (fields per their docs)
    const lipanaPayload = {
      BusinessShortCode: config.LIPANA_SHORTCODE,
      PartyA: mpesaNumber,
      Amount: amountToCharge,
      PartyB: config.LIPANA_SHORTCODE,
      PhoneNumber: mpesaNumber,
      CallBackURL: config.LIPANA_CALLBACK_URL,
      AccountReference: String(orderId),
      TransactionDesc: `Order ${orderId}`,
    };

    const lipanaResp = await axios.post(LIPANA_BASE, lipanaPayload, {
      headers: {
        Authorization: `Bearer ${config.LIPANA_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    // save payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        mpesaNumber,
        amount,
        checkoutRequestId: lipanaResp.data.CheckoutRequestID,
        status: "pending",
      },
    });

    // return both the checkout request id (for polling) and the order
    // id so the frontend can keep track of the pending order.
    res.json({
      success: true,
      checkoutRequestId: payment.checkoutRequestId,
      orderId,
    });
  } catch (err) {
    const errorDetail = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      hasCreds: !!(process.env.LIPANA_TOKEN && process.env.LIPANA_SHORTCODE),
    };
    logger.error("MPESA payment initiation error", errorDetail);
    res.status(500).json({
      success: false,
      message: "Failed to start payment",
      detail:
        process.env.NODE_ENV === "development"
          ? `${err.message} (see server logs)`
          : "Failed to start payment",
    });
  }
});

// callback endpoint for Lipana to notify us of STK result
router.post("/mpesa/callback", async (req, res) => {
  // Note: in production you should verify the request signature
  try {
    const data = req.body;
    const { CheckoutRequestID, ResultCode } = data;
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
    });
    if (!payment) {
      return res.status(404).send("not found");
    }
    if (ResultCode === 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "paid" },
      });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "Paid" },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
    }
    res.send("OK");
  } catch (err) {
    logger.error("MPESA callback error", { message: err.message });
    res.status(500).send("error");
  }
});

// public status endpoint so UI can poll until the payment completes.
router.get("/mpesa/status/:checkoutRequestId", async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    if (!checkoutRequestId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing checkoutRequestId" });
    }

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId },
    });
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    res.json({
      success: true,
      status: payment.status,
      orderId: payment.orderId,
    });
  } catch (err) {
    logger.error("Error fetching payment status", { message: err.message });
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

module.exports = router;
