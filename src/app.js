const express = require("express");
const app = express();

const { adminAuth, userAuth } = require("./middleware/auth");

const connectDb = require("./config/database");

const User = require("./models/user");
const user = require("./models/user");

app.use(express.json())

app.post("/signIN",async(req,res)=>{

    const user = new User(req.body)
    try{
        await user.save()
        res.send("user Added successfully")
    }
    catch(err){
        res.status(400).send("error"+ err.message)
    }
})

app.get("/user", async(req,res)=>{
    const userEmail = req.body.emailId;

    try{
        const users = await User.find({emailId : userEmail})
        if(users.length ===0){
            res.status(404).send("User Not Found")
        }
        res.send(users);

    }
    catch(err){
        res.status(400).send("something went wrong")
    }
})

app.get("/feed",async(req,res)=>{
    try{
        const users = await User.find({})
        res.send(users)
    }
    catch(err){
        res.status(400).send("something went wrong") 
    }
})

app.delete("/user", async(req,res)=>{
    const userId = req.body.userId

    try{
        const user = await User.findByIdAndDelete(userId)

        if(!user){
            return res.status(404).send("User not found");
        }
        res.send("is delete succefully")
    }
    catch(err){
        res.status(400).send("something went wrong")
    }
    
})

app.patch("/user", async(req,res)=>{
    const userId = req.body.userId
    const data = req.body;
    try{
        await User.findByIdAndUpdate({_id : userId},data);
        res.send("data is updated");

    }
    catch(err){
        res.status(400).send(err);
    }
})

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

  