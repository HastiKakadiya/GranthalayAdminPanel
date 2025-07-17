const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

let schema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    short_description: { type: String, required: true },
    full_description: { type: String, required: true },
    assign_price: { type: Number, required: true },
    unassign_price: { type: Number, required: true },

    parent_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "categories" }],
    sub_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "categories" }],
    child_categories: [{ type: mongoose.Schema.Types.ObjectId, required: false, default: null }],
    parent_attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: "attributes" }],
    child_attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: "attributes" }],

    slug: { type: String, unique: true, index: true, required: true },
    sku: { type: String, required: true, index: true },
    status: { type: Boolean, required: true },
    total_stock: { type: Number, required: true },
    languages: [{ type: String }],
    cover_image: {
        url: { type: String, required: true },
        path: { type: String, required: true },
    },
    other_images: [{
        url: { type: Array, required: true },
        path: { type: Array, required: true }
    }],
    is_delete: { type: Boolean, default: false },
}, { timestamps: true, strict: false });

schema.plugin(mongoosePaginate);
module.exports = mongoose.model("products", schema);