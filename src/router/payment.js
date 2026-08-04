const express = require("express");
const { userAuth } = require("../middleware/auth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constants");

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

module.exports = paymentRouter;
