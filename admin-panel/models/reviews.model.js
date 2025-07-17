const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const ReviewSchema = new mongoose.Schema({
    description: String,
    rate: Number,
    product_id: String,
    customer_id: String,
    createdAt: { type: Date, default: Date.now },  // Ensure Date type
    updatedAt: { type: Date, default: Date.now },  // Ensure Date type
});

ReviewSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Review", ReviewSchema);
