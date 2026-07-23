const express =require("express");

const app = express();

app.use("/home",(req,res)=>{
    res.send("welcome t home page");
})
app.use("/",(req,res)=>{
    res.send("namaste duniya")
})

app.listen(3000,()=>{
    console.log("Server has started");
})