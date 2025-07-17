const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let loginsSchema = new mongoose.Schema({
  
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    image: { type: String, default: "" } // <-- Add this

},{timestamps : true});

loginsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("users", loginsSchema);
