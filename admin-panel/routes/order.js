var express = require("express");
var router = express.Router();
const Order = require("../models/order.model");
const OrderItem = require("../models/order-items");
const Product = require("../models/products.model");
const Customer = require("../models/customer");
const Coupon = require("../models/coupon.model"); // Adjust the path as per your project structure

const ShippingCharge = require("../models/shipping-charge"); // Add this if not already


router.get('/', async (req, res) => {
    try {
        const perPage = 10;
        const page = parseInt(req.query.page) || 1;

        let query = {};
        let search = req.query.search ? req.query.search.trim() : '';
        let paymentStatus = req.query.paymentStatus;
        let paymentMethod = req.query.paymentMethod;

        if (paymentStatus) {
            query["orderDetails.payment"] = paymentStatus === "paid" ? true : false;
        }

        if (paymentMethod) {
            query["orderDetails.type"] = paymentMethod;
        }

        const aggregate = [
            {
                $lookup: {
                    from: "orders",
                    localField: "orderID",
                    foreignField: "_id",
                    as: "orderDetails"
                }
            },
            {
                $unwind: {
                    path: "$orderDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productID",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "customers",
                    localField: "orderDetails.customer_id",
                    foreignField: "_id",
                    as: "customerDetails"
                }
            },
            {
                $unwind: {
                    path: "$customerDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    customerEmail: "$customerDetails.email",
                    customerPhone: "$customerDetails.phone",
                    productName: "$productDetails.name",
                    payment_status: "$orderDetails.payment",
                    payment_method: "$orderDetails.type"
                }
            },
            {
                $match: {
                    ...query,
                    ...(search
                        ? {
                            $or: [
                                { "customerDetails.email": { $regex: search, $options: "i" } },
                                { "customerDetails.phone": { $regex: search, $options: "i" } },
                                { "orderDetails.orderNumber": { $regex: search, $options: "i" } },
                                { "productDetails.name": { $regex: search, $options: "i" } }
                            ]
                        }
                        : {})
                }
            }
        ];

        const totalItems = await OrderItem.aggregate([...aggregate, { $count: "total" }]);
        const total = totalItems.length > 0 ? totalItems[0].total : 0;

        aggregate.push({ $skip: (page - 1) * perPage });
        aggregate.push({ $limit: perPage });

        const orderItems = await OrderItem.aggregate(aggregate);

        res.render('order', {
            orderItems,
            current: page,
            totalPages: Math.ceil(total / perPage),
            pages: Math.ceil(total / perPage),
            search,
            paymentStatus,
            paymentMethod,
        });
    } catch (err) {
        console.error("Error in GET /orders:", err);
        res.status(500).send("Internal Server Error");
    }
});


// ------------------------------
// POST /pagination Route
// ------------------------------
router.post("/pagination", async (req, res) => {
    let { page = 1, search = "", paymentStatus, paymentMethod } = req.body;
    let perPage = 10;
    let query = { is_delete: false };

    try {
        if (search.trim()) {
            const numericSearch = Number(search);
            const isNumeric = !isNaN(numericSearch);

            const matchingCustomers = await Customer.find({
                $or: [
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ]
            }).select("_id").lean();

            const customerIds = matchingCustomers.map(c => c._id);

            query.$or = [
                ...(isNumeric ? [{ orderNumber: numericSearch }] : []),
                { customer_id: { $in: customerIds } }
            ];
        }

        if (paymentStatus) {
            query["payment"] = paymentStatus === "paid" ? true : false;
        }

        if (paymentMethod) {
            query["type"] = paymentMethod;
        }

        let totalRecords = await Order.countDocuments(query);

        let orders = await Order.find(query)
            .select("orderNumber payment type totalCost createdAt customer_id status")
            .populate("customer_id", "phone email")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        res.json({
            docs: orders,
            totalPages: Math.ceil(totalRecords / perPage),
            currentPage: page,
            limit: perPage,
        });
    } catch (error) {
        console.error("Pagination Error:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/invoice/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Get order with populated customer and shipping_charge
        const order = await Order.findById(orderId)
            .populate("customer_id", "username full_name email address phone")  // Populating the full_name and email
            .populate("shipping_charge_id") // 💡 Shipping charge data
            .populate("coupon_id", "name number") // Populating the coupon details
            .lean();

        if (!order) return res.status(404).send("Order not found");

        // Step 1: Fetch the order items IDs from the order
        const orderItemIds = order.order_items; // Array of ObjectIds

        // Step 2: Fetch the order item details by their IDs
        const orderItems = await OrderItem.find({ '_id': { $in: orderItemIds } })
            .populate("productID", "title short_description assign_price cover_image")
            .lean();

        // Format the order items
        const formattedOrderItems = orderItems.map((item) => {
            const product = item.productID || {};
            return {
                name: product.title || "Unknown",
                description: product.short_description || "N/A",
                rate: product.assign_price || 0,
                qty: item.quantity || 1,
                price: item.price || 0,
                productImage: product.cover_image?.path
                    ? `http://localhost:4000/${product.cover_image.path}`
                    : "https://via.placeholder.com/150",
            };
        });

        // 💡 Calculate subtotal: item price * quantity
        const subtotal = formattedOrderItems.reduce((sum, item) => sum + (item.price * item.qty || 0), 0);

        // 💡 Get shipping charge value
        const shippingCharge = order.shipping_charge_id?.shipping_charge || 0;

        // 💡 Initial total calculation (including shipping)
        // const totalAmount = subtotal + shippingCharge;

        // if (order.coupon_id && order.coupon_id.number) {
        //     totalAmount -= order.coupon_id.number; // Subtract coupon value from totalAmount
        // }


        // Fetch full coupon details if coupon is applied
        let couponValue = 0;

        if (order.coupon_id && order.coupon_id._id) {
            const coupon = await Coupon.findById(order.coupon_id).lean();
            if (coupon && coupon.type === 'rupees' && coupon.number > 0) {
                couponValue = coupon.number;
            }
        }

        let totalAmount = subtotal + shippingCharge - couponValue;


        // 💡 Amount Paid and Balance Due logic
        // const amountPaid = order.paymentStatus === 'Paid' ? totalAmount : 0; // Assuming paymentStatus indicates if the amount is paid
        // const balanceDue = order.paymentStatus === 'Paid' ? 0 : totalAmount;


        // Update the order with subtotal and total cost
        await Order.findByIdAndUpdate(orderId, {
            $set: {
                subTotal: subtotal,
                totalCost: totalAmount,
            }
        });
        


        const isPaid = order.payment === true;
        const amountPaid = isPaid ? totalAmount : 0; // Assuming paymentStatus indicates if the amount is paid
        const balanceDue = isPaid ? 0 : totalAmount;


        const customer = order.customer_id || {};
        const customerAddress = customer.address || {};
        const shipping = order.shipping_charge_id || {};
        const couponName = order.coupon_id && order.coupon_id.name ? order.coupon_id.name : "0 - No Coupon Applied";


        // Format the order data
        const formattedOrder = {
            id: order._id,
            invoiceId: order.invoiceId,
            coupon: order?.coupon_id?.name || "0 - No Coupon Applied",
            // couponAmount: couponValue || 0

            date: order.createdAt?.toISOString().split("T")[0] || "N/A",
            username: customer.username || "N/A",
            full_name: customer.full_name || "N/A", // Full name now fetched correctly
            email: customer.email || "N/A", // Email now fetched correctly
            customer: {
                address: {
                    area: customerAddress.area || "N/A",
                    pincode: customerAddress.pincode || "N/A",
                    city: customerAddress.city || "N/A",
                    state: customerAddress.state || "N/A",
                    country: customerAddress.country || "India"
                }
            },
            shipping: {
                area: shipping.area || "N/A",
                city: shipping.city || "N/A",
                district: shipping.district || "N/A",
                state: shipping.state || "N/A",
                pincode: shipping.pincode || "N/A",
                country: shipping.country || "India"
            },
            phone: customer.phone || "N/A", // Customer phone fetched correctly
            paymentStatus: isPaid ? "Paid" : "Pending",
            amountPaid: amountPaid,
            balanceDue: balanceDue,
            subtotal: subtotal,
            shippingCharge: shippingCharge,
            totalAmount: totalAmount,
            couponName: order?.coupon_id?.name || "No Coupon Applied",
            couponNumber: couponValue || 0,
        };

        // Render the invoice page with order and items
        res.render("invoice", {
            order: formattedOrder,
            orderItems: formattedOrderItems
        });

    } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).send("Server Error");
    }
});





module.exports = router;
