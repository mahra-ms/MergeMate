const express = require("express");

const profileRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const { validateEditProfileData } = require("../utils/validation");
const bcrypt = require("bcrypt");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;

    res.send(user);
  } catch (err) {
    res.status(400).send("error:" + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedUser = req.user;

    Object.keys(req.body).forEach((key) => {
      loggedUser[key] = req.body[key];
    });

    await loggedUser.save();

    res.status(200).json({
      message: `${loggedUser.firstName} profile updated successfully`,
      data: loggedUser,
    });
  } catch (err) {
    res.status(400).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
});

profileRouter.patch("/profile/changePassword", userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "curren tPassword, new Password and confirm New Passwod are required",
      });
    }
    if(newPassword!==confirmNewPassword){
      return res.status(400).json({
        message : "New Password and Confirm Password doesn't match"
      })
    }
    const user = req.user;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashNewPassword;
    await user.save();

    res.cookie("token", null,{
      expires: new Date(Date.now())
    })
    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = profileRouter;
