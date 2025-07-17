const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let attributesSchema = new mongoose.Schema({
  name: "String",
  // slug: {type : "String", unique: true, index: true},
  parent :  { type: mongoose.Schema.Types.ObjectId, ref: "attributes" },
  description : "String",
  is_delete : Boolean
},{timestamps : true, strict : false});

attributesSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("attributes", attributesSchema);
