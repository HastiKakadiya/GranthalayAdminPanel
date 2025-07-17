const mongoose = require("mongoose");
// const mongoosePaginate = require('mongoose-paginate-v2');

let wishlistSchema = new mongoose.Schema({
  customer_id : { type: mongoose.Schema.Types.ObjectId, ref: "customers" },
  product_id : { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  is_delete : Boolean
},{timestamps : true});

// wishlistSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("wishlists", wishlistSchema);
