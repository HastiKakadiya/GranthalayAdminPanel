const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');


let shippingSchema = new mongoose.Schema({
    country: { type: String, required: true, default: "India" }, // Country field for international scalability
    state: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },  // Added city for more precise shipping calculations
    area: { type: String, required: true },  // More specific location inside the city/district
    pincode: { type: String, required: true, index: true }, // Indexed for faster lookup
    shipping_charge: { type: Number, required: true, min: 0 }, // Cannot be negative
    delivery_time: { type: String, required: true }, // e.g., "2-5 business days"
    cod_available: { type: Boolean, default: false }, // Whether Cash on Delivery is available
    min_order_value: { type: Number, default: 0 }, // Minimum order value for free/discounted shipping
    max_weight_limit: { type: Number, default: 10 }, // Weight limit in kg before additional charges
    additional_weight_charge: { type: Number, default: 0 }, // Charge per extra kg
    is_active: { type: Boolean, default: true }, // To enable/disable specific area-based charges
    is_delete: { type: Boolean, default: false }, 

}, { timestamps: true });
shippingSchema.plugin(mongoosePaginate);    

module.exports = mongoose.model("ShippingCharge", shippingSchema, "shipping_charges"); 
