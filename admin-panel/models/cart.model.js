const mongoose = require("mongoose");
// const mongoosePaginate = require('mongoose-paginate-v2');

let cartSchema = new mongoose.Schema({
  customer_id : { type: mongoose.Schema.Types.ObjectId, ref: "customers" },
  product_id : { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  qty : Number,
  attributes : [{ type: mongoose.Schema.Types.ObjectId, ref: "attributes" }],
  is_delete : Boolean,
  purchase : Boolean 
},{timestamps : true});

module.exports = mongoose.model("carts", cartSchema);
