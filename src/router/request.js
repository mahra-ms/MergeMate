const express = require("express");

const requestRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const {toUserId,status} = req.params;

      const toUser = await User.findById(toUserId)
      if(!toUser){
        res.status(404).json({
            message:"user not found"
        })
      }
      

      const allowedStatus = ["ignored", "interested"]
      if(!allowedStatus.includes(status)){
        return res.status(404).json({
            message : "Invalid status type :" + status,
        })
      }
      // prevent sending request to yourself
      if (fromUserId.toString() === toUserId) {
        return res.status(400).json({
          message: "You cannot send a request to yourself",
        });
      }

      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or:[
            {fromUserId,toUserId},
            {fromUserId: toUserId, toUserId: fromUserId}
        ]
      })
      if(existingConnectionRequest){
        return res.status(400).json({
            message:"connection request already exsits"
        })
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      res.status(201).json({
        message: req.user.firstName +" "+  status + " in " + toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).json({
        message: "Error :" + err.message,
      });
    }
  },
);

module.exports = requestRouter;
