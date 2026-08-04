require("dotenv").config();
const express = require("express");
const cors = require("cors")
const cookieParser = require("cookie-parser");

const app = express();


const connectDb = require("./config/database");
const User = require("./models/user");
const user = require("./models/user");
 
const bcrypt = require("bcrypt");
const validator = require("validator");

const jwt = require('jsonwebtoken');
const {  userAuth } = require("./middleware/auth");


const authRouter = require("./router/auth");
const requestRouter = require("./router/request");
const profileRouter = require("./router/profile")
const userRouter = require("./router/user");
const paymentRouter = require("./router/payment");




app.use(cors({
  origin: "http://localhost:5173", // Vite React app
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


app.use("/", authRouter);
app.use("/", requestRouter);
app.use("/", profileRouter);
app.use("/", userRouter)
app.use("/", paymentRouter)






app.get("/user", userAuth, async (req, res) => {
  const userEmail = req.body.emailId;

  try {
    const users = await User.find({ emailId: userEmail });
    if (users.length === 0) {
      res.status(404).send("User Not Found");
    }
    res.send(users);
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

// app.get("/feed", async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.send(users);
//   } catch (err) {
//     res.status(400).send("something went wrong");
//   }
// });

app.delete("/deleteUser", async (req, res) => {
  const userId = req.body.userId;

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }
    res.send("is delete succefully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

// app.patch("/user/:userId", async (req, res) => {
//   const userId = req.params?.userId;
//   const data = req.body;

//   try {
//     const Allowed_Updates = [
//       "firstName",
//       "userId",
//       "photoUrl",
//       "about",
//       "gender",
//       "age",
//       "skills",
//     ];
//     const isUpdateAllowed = Object.keys(data).every((k) =>
//       Allowed_Updates.includes(k),
//     );
//     if (!isUpdateAllowed) {
//       throw new Error("update is not allowed");
//     }
//     if (data?.skills.length > 10) {
//       throw new Error("SKILLS CANNOT BE MORE THAN 10");
//     }
//     const user = await User.findByIdAndUpdate({ _id: userId }, data, {
//       returnDocument: "after",
//       runValidators: true,
//     });
//     res.send("data is updated");
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });

connectDb()
  .then(() => {
    console.log("Database connection established......");

    app.listen(3000, () => {
      console.log("Server has started");
    });
  })
  .catch((err) => {
    console.error("Database cannot be conneted!!");
  });
