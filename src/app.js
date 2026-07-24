const express = require("express");
const app = express();

const { adminAuth, userAuth } = require("./middleware/auth");

const connectDb = require("./config/database");

const User = require("./models/user")

app.post("/signIN",async(req,res)=>{

    const user = new User({
        fristName:"Ms",
        lastName : "Dhoni",
        emailId : "Dhoni07@gmail.com",
        password : "ms07d"

    })
    try{
        await user.save()
        res.send("user Added successfully")
    }
    catch(err){
        res.status(400).send("error"+ err.message)
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

  