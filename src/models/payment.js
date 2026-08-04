const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Razorpay Order ID
    orderId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash"],
    },

    // Razorpay Payment ID (after successful payment)
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // ✅ fixes duplicate null error
    },

    status: {
      type: String,
      default: "pending",
    },

    description: {
      type: String,
      trim: true,
    },

    receipt: {
      type: String,
    },

    notes: {
      type: Object,
    },

    paidAt: {
      type: Date,
    },
    isPremium: {
        type: Boolean,
        default : false,
    },
    membershipType:{
        type: String,
    },
    membershipValidity : {
        type :String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);