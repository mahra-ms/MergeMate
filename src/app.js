const express = require("express");

const app = express();
 
const {adminAuth,userAuth} =require("./middleware/auth")

app.use("/admin",adminAuth);

app.get("/admin/getData", (req, res) => {
    res.send("Getting all the data");
});

app.get("/users", userAuth,(req, res) => {
    res.send("Hello from the user");
});

app.delete("/admin/deleteData", (req, res) => {
    res.send("Data is deleted");
});

app.listen(3000, () => {
    console.log("Server has started");
});