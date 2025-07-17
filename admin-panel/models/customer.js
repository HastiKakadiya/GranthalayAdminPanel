const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let customerSchema = new mongoose.Schema({
  username: { type: String },
  full_name: String,
  email: { type: String, unique: true },
  phone: { type: String },  
  address: {
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" }
  },
  createdAt: Date,
  updatedAt: Date,
  password: String,
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },  
}, { timestamps: true, strict: false });

customerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("customers", customerSchema);
