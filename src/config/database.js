const mongoose = require("mongoose")

const connectDb = async ()=>{
    await mongoose.connect(
        "mongodb+srv://namasteNodejs:m8WMWjO7sarNPzJX@cluster0.cuk3o2l.mongodb.net/devTinder"
    )

}

module.exports = connectDb;