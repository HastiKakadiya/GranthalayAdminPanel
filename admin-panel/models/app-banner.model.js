const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let appBannerSchema = new mongoose.Schema({
  type : "String",
  path: "String",
  url : "String",
  is_delete : Boolean
},{timestamps : true});

appBannerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("app-banner", appBannerSchema);
