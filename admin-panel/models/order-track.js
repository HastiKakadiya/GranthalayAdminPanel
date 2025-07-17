const mongoose = require("mongoose");

let orderTrackSchema = new mongoose.Schema(
    {
        orderID: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
        orderItemID: { type: mongoose.Schema.Types.ObjectId, ref: "order_items" }, // Optional
        status: { type: String, required: true, enum: ["Processing", "Shipped", "Out for Delivery", "Delivered"] },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }, // Admin/User reference
        updatedAt: { type: Date, default: Date.now },
        remarks: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("order_tracks", orderTrackSchema);
