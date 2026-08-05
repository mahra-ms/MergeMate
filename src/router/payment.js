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

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { plan } = req.body;

    const options = {
      amount: membershipAmount(plan) * 100,
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
// express.json(). This must not run after a global express.json()
// middleware, or the raw body will already be consumed/parsed.
paymentRouter.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];

      const isWebHookValid = validateWebhookSignature(
        req.body.toString(),
        webhookSignature,
        process.env.RAZORPAY_WEBHOOK_SECRET
      );

      if (!isWebHookValid) {
        return res.status(400).json({ msg: "webhook invalid" });
      }

      const payload = JSON.parse(req.body.toString());
      const paymentDetails = payload.payload.payment.entity;

      const payment = await Payment.findOne({
        orderId: paymentDetails.order_id,
      });

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      payment.status = paymentDetails.status;
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

paymentRouter.get("/premium/verify", userAuth, async(req, res) =>{
    const user = req.user
    if(user.isPremium){
        return res.json({isPremium: true})
    }
    return res.json({
        isPremium : false
    })
})

module.exports = paymentRouter;