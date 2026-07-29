const express = require("express");

const authRouter = express.Router();
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const validator = require("validator");


authRouter.post("/signUp", async (req, res) => {
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
    res.status(201).send("User added successfully");
  } catch (err) {
    res.status(400).send("error : " + err.message);
  }
});

authRouter.post("/logIn", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!validator.isEmail(emailId)) {
      return res.status(400).send("Invalid email");
    }

    const user = await User.findOne({ emailId });

    if (!user) {
      return res.status(404).send("invalid credentails");
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentails");
    }
    const token = await user.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    return res.send("User login successful");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

authRouter.post("/logOut", async(req,res)=>{
  res.cookie("token",null,{
    expires: new Date(Date.now())
  })
  res.send("user logout")
})

module.exports = authRouter;
