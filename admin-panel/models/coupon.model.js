const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let couponSchema = new mongoose.Schema({
  name: {type : String, unique: true, index: true},
  number: Number,
  type : String,
  start : Date,
  end : Date,
  status : Boolean,
  is_delete : Boolean,
},{timestamps : true, strict : false});

couponSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("coupons", couponSchema);
