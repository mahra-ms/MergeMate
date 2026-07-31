const mongoose = require("mongoose");
const { applyTimestamps } = require("./user");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "User",
      require: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "User",
      require: true,
    },
    status: {
      type: String,
      require: true,
      enum: {
        values: ["ignored", "interested", "accepted", "rejected"],
        message: `{VALUE} is incorrect status type`,
      },
    },
  },
  {
    timestamps: true,
  },
);

connectionRequestSchema.index({fromUserId : 1, toUserId : 1})

const ConnectionRequestModel = new mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema,
);
module.exports = ConnectionRequestModel;
