    const mongoose = require("mongoose");
    const mongoosePaginate = require("mongoose-paginate-v2");


    let orderItemSchema = new mongoose.Schema(
        {
            orderID: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
            productID: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 },
            subtotal: { type: Number, required: true, min: 0 }, // Calculated as quantity * price
            status: { type: String, required: true, enum: ["Pending", "Shipped", "Delivered", "Returned"] },
        },
        { timestamps: true }
    );

    orderItemSchema.plugin(mongoosePaginate);

    module.exports = mongoose.model("order_items", orderItemSchema);
