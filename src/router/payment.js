const express = require("express");
const { userAuth } = require("../middleware/auth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

const paymentRouter = express.Router();

// Adjust this list to match the keys your membershipAmount() function supports
const VALID_PLANS = ["silver", "gold"];

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { plan } = req.body;

    if (!plan || !VALID_PLANS.includes(plan)) {
      return res.status(400).json({ message: "Invalid or missing plan" });
    }

    const amount = membershipAmount(plan);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Could not determine amount for plan" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        firstName: user.firstName,
        lastName: user.lastName,
        membershipType: plan,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    await Payment.create({
      userId: user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      notes: order.notes,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
});

// IMPORTANT: this route needs the RAW request body to verify the
// Razorpay signature, so express.raw() is used here instead of
// express.json(). This route (or this whole router) MUST be mounted
// BEFORE any global express.json() middleware in your main app file,
// or the raw body will already be consumed/parsed and signature
// verification will silently fail. e.g.:
//
//   app.use("/api", paymentRouter);   // <-- mounted first
//   app.use(express.json());          // <-- global parser after
//
paymentRouter.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];

      if (!webhookSignature) {
        return res.status(400).json({ msg: "missing signature" });
      }

      let isWebHookValid = false;
      try {
        isWebHookValid = validateWebhookSignature(
          req.body.toString(),
          webhookSignature,
          process.env.RAZORPAY_WEBHOOK_SECRET
        );
      } catch (sigErr) {
        return res.status(400).json({ msg: "signature verification error" });
      }

      if (!isWebHookValid) {
        return res.status(400).json({ msg: "webhook invalid" });
      }

      const payload = JSON.parse(req.body.toString());
      const paymentDetails = payload.payload.payment.entity;

      const payment = await Payment.findOne({
        orderId: paymentDetails.order_id,
      });

      if (!payment) {
        // Don't 404 here — Razorpay will keep retrying an unrecognized
        // order forever. Log it for investigation and ack with 200
        // so Razorpay stops retrying.
        console.error(
          `Webhook received for unknown orderId: ${paymentDetails.order_id}`
        );
        return res.status(200).json({ status: "ok" });
      }

      // Idempotency guard: if we've already processed this exact
      // payment id, skip re-processing (Razorpay may retry webhooks).
      if (payment.paymentId === paymentDetails.id) {
        return res.status(200).json({ status: "ok" });
      }

      payment.status = paymentDetails.status;
      payment.paymentId = paymentDetails.id;
      await payment.save();

      if (payload.event === "payment.captured") {
        const user = await User.findOne({ _id: payment.userId });
        if (user) {
          user.isPremium = true;
          user.membershipType = payment.notes.membershipType;
          await user.save();
        }
      }

      if (payload.event === "payment.failed") {
        // Optional: log the failure, notify the user, alert monitoring, etc.
        // Do NOT grant premium access here.
      }

      return res.status(200).json({ status: "ok" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user;
  if (user.isPremium) {
    return res.json({ isPremium: true });
  }
  return res.json({
    isPremium: false,
  });
});

module.exports = paymentRouter;