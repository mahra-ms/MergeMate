require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

const app = express();

const connectDb = require("./config/database");
const User = require("./models/user");
const { userAuth } = require("./middleware/auth");

const authRouter = require("./router/auth");
const requestRouter = require("./router/request");
const profileRouter = require("./router/profile");
const userRouter = require("./router/user");
const paymentRouter = require("./router/payment");
const chatRouter = require("./router/chat"); // <-- matches your actual filename
const initializeSocket = require("./utils/socket");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://dev-tinder-web-1xq9.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", requestRouter);
app.use("/", profileRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter); // this was missing before, so /chat/:targetUserId 404'd

app.get("/user", userAuth, async (req, res) => {
  const userEmail = req.body.emailId;
  try {
    const users = await User.find({ emailId: userEmail });
    if (users.length === 0) {
      return res.status(404).send("User Not Found");
    }
    res.send(users);
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.delete("/deleteUser", userAuth, async (req, res) => {
  const userId = req.body.userId;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.send("Deleted successfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

const server = http.createServer(app);
initializeSocket(server);

connectDb()
  .then(() => {
    console.log("Database connection established......");
    server.listen(3000, () => {
      console.log("Server has started");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!", err);
  });