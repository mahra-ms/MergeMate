const express = require("express");
const app = express();

const {  userAuth } = require("./middleware/auth");
const connectDb = require("./config/database");
const User = require("./models/user");
const user = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cookieParser());

app.post("/signUp", async (req, res) => {
  try {
    // validation
    validateSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;

    // password encrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // new user
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });
    await user.save();
    res.send("user Added successfully");
  } catch (err) {
    res.status(400).send("error : " + err.message);
  }
});

app.post("/logIn", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId)) {
      return res.status(400).send("Invalid email");
    }

    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(404).send("nvalid credentails");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentails");
    }
    const token = await jwt.sign({_id: user._id},"helloWorld")
    res.cookie("token", token);
    return res.send("User login successful");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/profile", userAuth, async(req,res)=>{
    try{
        const user = req.user;

        res.send(user )
    }
    catch(err){
        res.status(400).send("error:"+ err.message)
    }
})

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

app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.delete("/user", async (req, res) => {
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

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;

  try {
    const Allowed_Updates = [
      "firstName",
      "userId",
      "photoUrl",
      "about",
      "gender",
      "age",
      "skills",
    ];
    const isUpdateAllowed = Object.keys(data).every((k) =>
      Allowed_Updates.includes(k),
    );
    if (!isUpdateAllowed) {
      throw new Error("update is not allowed");
    }
    if (data?.skills.length > 10) {
      throw new Error("SKILLS CANNOT BE MORE THAN 10");
    }
    const user = await User.findByIdAndUpdate({ _id: userId }, data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send("data is updated");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

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
