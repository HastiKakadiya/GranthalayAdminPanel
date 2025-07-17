var express = require("express");
var router = express.Router();
var orderModel = require("../models/order.model");
let ejs = require("ejs");
let pdf = require("html-pdf");
let path = require("path");
var mongoose = require("mongoose");
var shippingChargeModel = require("../models/shipping-charge"); // Ensure correct model import
const orderItemModel = require("../models/order-items"); // adjust path if needed
const productModel = require("../models/products.model"); // for product details

router.get("/:_id", async function (req, res) {
    if (mongoose.Types.ObjectId.isValid(req.params._id)) {
        try {
            let orderData = await orderModel.findById(req.params._id)
                .populate("customer_id")
                .populate("shipping_charge_id")
                .lean();

            // Fetch order items related to this order
            const orderItems = await orderItemModel.find({ _id: { $in: orderData.order_items } })
            .populate("productID")
                .lean();

            res.render("order-details", { message: "", data: orderData, order: orderData, orderItems });
        } catch (error) {
            console.error("Error fetching order:", error);
            res.status(500).send("Server Error");
        }
    } else {
        res.redirect("/order");
    }
});

router.post("/update-payment", async (req, res) => {
    try {
      const { orderId, newPaymentStatus } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: "Invalid Order ID" });
      }
  
      const result = await orderModel.updateOne(
        { _id: orderId },
        { $set: { payment: newPaymentStatus, updatedAt: new Date() } }
      );
  
      if (result.modifiedCount > 0) {
        return res.json({ success: true });
      } else {
        return res.json({ success: false, message: "No changes made. Order not found or already updated." });
      }
    } catch (error) {
      console.error("❌ Error updating payment status:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
  


// ✅ Update Order Status API
router.post("/update-status", async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid Order ID" });
        }

        const result = await orderModel.updateOne(
            { _id: new mongoose.Types.ObjectId(orderId) },
            { $set: { status: newStatus, updatedAt: new Date() } }
        );

        if (result.modifiedCount > 0) {
            return res.json({ success: true, message: "Order status updated successfully" });
        } else {
            return res.json({ success: false, message: "No changes made. Order not found or status is the same." });
        }
    } catch (error) {
        console.error("❌ Error updating order:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});



// ✅ Handle order submission
router.post("/", async function (req, res, next) {
    if (req.session.count === NaN || req.session.count >= 0) {
        if (mongoose.Types.ObjectId.isValid(req.body.submit)) {
            let orderData = await orderModel.findOne({ _id: req.body.submit })
                .populate("customer_id")
                .populate("shipping_charge_id")
                .lean();

            if (!orderData) {
                console.log("Order not found.");
                return res.redirect("/order");
            }

            if (orderData.shipping_charge_id) {
                let shippingData = await shippingChargeModel.findById(orderData.shipping_charge_id).lean();
                orderData.shipping_charge_id = shippingData;
            }

            let text = orderData.createdAt;
            let d = new Date(text);
            let month = d.getMonth() + 1;
            let date = d.getDate() + "/" + month + "/" + d.getFullYear();
            console.log("Formatted Date:", date);

            ejs.renderFile(path.join(__dirname, '../views', "invoice.ejs"), { data: orderData, date: date }, async (err, data) => {
                if (err) {
                    console.log("Error rendering file:", err);
                    res.send(false);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": { "height": "20mm" },
                        "footer": { "height": "20mm" },
                    };
                    pdf.create(data, options).toFile("pdf/invoice.pdf", function (err, data) {
                        if (err) {
                            console.log("Error creating PDF:", err);
                            res.redirect("/order");
                        } else {
                            setTimeout(() => {
                                res.download("pdf/invoice.pdf");
                            }, 2000);
                        }
                    });
                }
            });
        } else {
            res.redirect("/order");
        }
    } else {
        res.redirect("/admin");
    }
});

// ✅ Generate invoice page
router.get("/:id/invoice/get", async function (req, res, next) {
    if (req.session.count === NaN || req.session.count >= 0) {
        console.log("req.params.id", req.params.id)
        let orderData = await orderModel.findById(req.params.id).populate("customer_id").lean();
        console.log("orderData is", orderData);
        let text = orderData.createdAt;
        let d = new Date(text);
        let month = d.getMonth() + 1;
        let date = d.getDate() + "/" + month + "/" + d.getFullYear();
        res.render("invoice", { message: "", data: orderData, date: date });
    } else {
        res.redirect("/admin");
    }
});

module.exports = router;
