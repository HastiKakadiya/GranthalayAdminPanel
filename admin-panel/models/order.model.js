const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const AutoIncrement = require("mongoose-sequence")(mongoose); // ✅ this is required


let orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: Number,
            unique: true
        },
        invoiceId: { type: String, unique: true },
        coupon_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'coupons', 
        },
        status: { type: String, required: true },
        payment: { type: Boolean, default: false },
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
        is_delete: { type: Boolean, default: false },
        type: { type: String, required: true }, // 'COD', 'Online'
        order_items: [{ type: mongoose.Schema.Types.ObjectId, ref: "order_items" }],
        tracking_id: { type: mongoose.Schema.Types.ObjectId, ref: "order_tracks" },
        subTotal: { type: Number, required: true, min: 0 },
        // product_id: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
        shipping_charge_id: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingCharge" },
        totalCost: { type: Number, required: true, min: 0 },
        quantity: { type: Number, min: 0 },

    },
    { timestamps: true, strict: false }
);

orderSchema.plugin(AutoIncrement, { inc_field: 'orderNumber' });


orderSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("orders", orderSchema);
