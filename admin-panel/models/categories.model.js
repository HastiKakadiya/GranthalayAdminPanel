const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let categoriesSchema = new mongoose.Schema({
  name: "String",
  slug: {type : "String", unique: true, index: true},
  parent : { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  sub_parent : { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  gst : Number,
  description : "String",
  cover_image : {
    url : String,
    path : String,
},
  is_delete : Boolean,
  used : Boolean
},{timestamps : true, strict : false});


// ✅ Virtual field to get subcategories
categoriesSchema.virtual("subcategories", {
  ref: "categories", 
  localField: "_id", 
  foreignField: "parent"
});

categoriesSchema.set("toObject", { virtuals: true });
categoriesSchema.set("toJSON", { virtuals: true });

categoriesSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("categories", categoriesSchema);
