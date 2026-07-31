const express = require("express");

const userRouter = express.Router();

const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const user = require("../models/user");

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", [
      "firstName",
      "lastName",
      "age",
      "gender",
      "photoUrl",
      "about",
      "skills",
    ]);
    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).json({
      message: "Erroor " + err.message,
    });
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", [
        "firstName",
        "lastName",
        "age",
        "gender",
        "photoUrl",
        "about",
        "skills",
      ])
      .populate("toUserId", [
        "firstName",
        "lastName",
        "age",
        "gender",
        "photoUrl",
        "about",
        "skills",
      ]);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });
    res.json({
      data: data,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error : " + err.message,
    });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1
    let limit = parseInt(req.query.limit) || 10

    limit = limit>50?50 : limit
    const skip = (page -1)*limit


    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUserFromFeed = new Set();
    connectionRequests.forEach((request) => {
      hideUserFromFeed.add(request.fromUserId.toString());
      hideUserFromFeed.add(request.toUserId.toString());
    });

    const users = await user
      .find({
        $and: [
          { _id: { $nin: Array.from(hideUserFromFeed) } },
          { _id: { $ne: loggedInUser._id } },
        ],
      })
      .select("firstName lastName age gender photoUrl about skills")
      .skip(skip)
      .limit(limit)

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(400).json({
      message: "ERROR : " + err.message,
    });
  }
});
module.exports = userRouter;
