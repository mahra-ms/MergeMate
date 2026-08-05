const express = require("express");
const Chat = require("../models/chat");
const Message = require("../models/message");
const { userAuth } = require("../middleware/auth");


const chatRouter = express.Router();

chatRouter.get("/chat",userAuth, async (req, res) => {
  const { userId, targetUserId } = req.body;

  if (!userId || !targetUserId) {
    return res
      .status(400)
      .json({ error: "userId and targetUserId are required" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    })
      .populate({
        path: "sender",
        select: "firstName lastName photoUrl",
      })
      .sort({ createdAt: 1 });

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, targetUserId],
      });
    }

    res.status(200).json({ chat });
  } catch (err) {
    console.error("Error fetching/creating chat:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /chat/:targetUserId — chat history for the LOGGED IN user + target
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  // FIX: userAuth sets req.user (the user document), not req.userId.
  // If your middleware really does set req.userId, revert this line —
  // but check it, because this was almost certainly the bug.
  const userId = req.user?._id;
  const { targetUserId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, targetUserId],
      });
    }

    const messages = await Message.find({ chat: chat._id })
      .populate({
        path: "sender",
        select: "firstName lastName photoUrl",
      })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      chatId: chat._id,
      messages,
    });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = chatRouter;
