const socketIO = require("socket.io");
const Chat = require("../models/chat");
const Message = require("../models/message");

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://byte-social.onrender.com",
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinChat", ({ userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on(
      "sendMessage",
      async ({ firstname, userId, targetUserId, message }) => {
        try {
          const roomId = [userId, targetUserId].sort().join("_");

          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = await Chat.create({
              participants: [userId, targetUserId],
            });
          }

          const newMessage = await Message.create({
            chat: chat._id,
            sender: userId,
            content: message,
          });

          chat.lastMessage = newMessage._id;
          await chat.save();

          const messageData = {
            id: newMessage._id.toString(),
            chatId: chat._id,
            senderId: userId,
            firstname,
            text: message,
            status: newMessage.status, // now reliably "sent"
            createdAt: newMessage.createdAt,
            time: new Date(newMessage.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          io.to(roomId).emit("messageReceived", messageData);
        } catch (err) {
          console.error("Error sending message:", err);
          socket.emit("messageError", {
            success: false,
            error: "Failed to send message",
          });
        }
      }
    );

    socket.on("messageSeen", async ({ userId, targetUserId, messageId }) => {
      try {
        const roomId = [userId, targetUserId].sort().join("_");

        await Message.findByIdAndUpdate(messageId, { status: "seen" });

        io.to(roomId).emit("messagesSeen", { messageIds: [messageId] });
      } catch (err) {
        console.error("Error marking message as seen:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = initializeSocket;