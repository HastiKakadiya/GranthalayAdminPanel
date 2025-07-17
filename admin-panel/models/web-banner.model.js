const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let webBannerSchema = new mongoose.Schema({
  type : "String",
  path: "String",
  url : "String",
  is_delete : Boolean
},{timestamps : true});

webBannerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("web-banner", webBannerSchema);
