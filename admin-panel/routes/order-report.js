const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const fs = require('fs');
const path = require('path');
const PDFDocument = require("pdfkit"); // Import pdfkit
const ExcelJS = require("exceljs");
const ShippingCharges = require("../models/shipping-charge");

router.get('/', async (req, res) => {
    try {
        const { year, startDate, endDate, search, sortBy, page = 1, exportType } = req.query; // Destructure query parameters from the request
        const selectedYear = year || ""; // Default to empty (Select Year)
        const limit = 10; // Number of orders per page
        const skip = (parseInt(page) - 1) * limit; // Calculate the number of orders to skip for pagination

        let filter = {};

        // Handle date filters
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Handle year filter (without overwriting the existing date filter)
        if (year && year !== "") {
            const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
            const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);
            filter.createdAt = filter.createdAt || {};
            filter.createdAt.$gte = filter.createdAt.$gte ? new Date(Math.max(filter.createdAt.$gte, yearStart)) : yearStart;
            filter.createdAt.$lte = filter.createdAt.$lte ? new Date(Math.min(filter.createdAt.$lte, yearEnd)) : yearEnd;
        }

        // Filter by search term
        if (search) {
            let searchConditions = [];
        
            // Only match orderNumber if it's a number
            if (!isNaN(search)) {
                searchConditions.push({ orderNumber: Number(search) });
                searchConditions.push({ totalCost: { $eq: Number(search) } });
            }
        
            searchConditions.push(
                { type: new RegExp(search, "i") },
                { "customer_id.full_name": new RegExp(search, "i") },
                { "customer_id.email": new RegExp(search, "i") },
                { "customer_id.phone": new RegExp(search, "i") }
            );
        
            if (mongoose.isValidObjectId(search)) {
                searchConditions.push({ _id: new ObjectId(search) });
            }
        
            filter.$or = searchConditions;
        }
        

        // Sort orders
        let sortOptions = {};
        if (sortBy === "desc") {
            sortOptions.createdAt = -1; // Most recent first
        } else if (sortBy === "asc") {
            sortOptions.createdAt = 1; // Oldest first
        }

        // Fetch total records for pagination
        const totalRecords = await Order.countDocuments(filter); // Filtered total number of orders
        const totalPages = Math.ceil(totalRecords / limit); // Calculate total pages

        // Ensure the reports directory exists
        const reportsDir = path.join(__dirname, "../public/reports");
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        if (exportType === "excel") {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Orders");

            // Define headers
            worksheet.columns = [
                { header: "ID", key: "_id", width: 25 },
                { header: "Total Order Items", key: "totalOrderItems", width: 20 },
                { header: "Customer ID", key: "customer_id", width: 25 },
                { header: "Customer Name", key: "customer_name", width: 30 },
                { header: "Status", key: "status", width: 15 },
                { header: "Type", key: "type", width: 15 },
                { header: "Payment", key: "payment", width: 15 },
                { header: "Shipping Charge", key: "shipping_charge", width: 20 },
                { header: "State", key: "state", width: 20 },
                { header: "City", key: "city", width: 20 },
                { header: "Area", key: "area", width: 20 },
                { header: "Total Cost", key: "totalCost", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 }
            ];

            // Fetch orders with required details
            const allOrders = await Order.find(filter)
                .populate({
                    path: "order_items",
                    select: "productID price subtotal status", // Select fields from order_items
                    populate: {
                        path: "productID",
                        select: "title", // Populate product title from products
                    }
                })
                .populate({
                    path: "customer_id",
                    select: "full_name" // Fetch Customer Full Name
                })
                .populate({
                    path: "shipping_charge_id",
                    select: "shipping_charge state city area pincode" // Fetch only necessary fields
                });

            allOrders.forEach(order => {
                order.totalOrderItems = order.order_items.length; // Save total order items

                const shipping = order.shipping_charge_id || {};
                order.shipping_charge = shipping.shipping_charge || "N/A";
                order.shipping_state = shipping.state || "N/A";
                order.shipping_city = shipping.city || "N/A";
                order.pincode = shipping.pincode || "N/A";
                order.shipping_area = shipping.area || "N/A";
                order.order_items.forEach(item => {
                    worksheet.addRow({
                        _id: order._id.toString(),
                        orderNumber: order.orderNumber,
                        totalOrderItems: order.totalOrderItems, // Add totalOrderItems here
                        customer_id: order.customer_id ? order.customer_id._id.toString() : "N/A",
                        customer_name: order.customer_id ? order.customer_id.full_name : "N/A",
                        status: order.status,
                        type: order.type,
                        payment: order.payment ? "Paid" : "Unpaid",
                        shipping_charge: order.shipping_charge,
                        state: order.shipping_state,
                        city: order.shipping_city,
                        area: order.shipping_area,
                        pincode: order.pincode,
                        totalCost: order.totalCost.toFixed(2),
                        createdAt: new Date(order.createdAt).toLocaleString()
                    });
                });
            });

            // Set file path
            const filePath = path.join(reportsDir, `granthalay-order-report-${Date.now()}.xlsx`);

            // Save file
            await workbook.xlsx.writeFile(filePath);

            // Send file as download
            return res.download(filePath, "Granthalay-Order-Report.xlsx", (err) => {
                if (err) console.error(err);
                fs.unlinkSync(filePath); // Delete file after download
            });
        }


        // Fetch orders with customer details
        let orders = await Order.find(filter)
            .populate("customer_id", "full_name email phone")
            .populate("shipping_charge_id", "shipping_charge pincode state city area")
            .sort(sortOptions)
            .skip(skip) // Skip the appropriate number of orders for pagination
            .limit(limit); // Limit the number of orders per page

        // Generate chart data based on filtered results
        let monthlyCounts = new Array(12).fill(0);
        orders.forEach(order => {
            let month = new Date(order.createdAt).getMonth();
            monthlyCounts[month]++;
            const shipping = order.shipping_charge_id || {};
            order.shipping_charge = shipping.shipping_charge || "N/A";
            order.shipping_state = shipping.state || "N/A";
            order.shipping_city = shipping.city || "N/A";
            order.shipping_area = shipping.area || "N/A";
            order.pincode = shipping.pincode || "N/A";
            order.totalOrderItems = order.order_items ? order.order_items.length : 0;
        });

        let chartData = orders.length > 0 ? monthlyCounts : new Array(12).fill(0); // Ensure chart data is not undefined
        let chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        const years = [...new Set(orders.map(order => new Date(order.createdAt).getFullYear()))]
            .filter(year => year <= currentYear); // Exclude future years
        // Exclude future years
        const totalOrder = await Order.countDocuments({});

        res.render("order-report", {
            orders,
            totalRecords: totalOrder,
            search,
            totalPages,
            startDate,
            endDate,
            selectedYear: year || new Date().getFullYear(),
            sortBy,
            chartData,
            years, // ✅ This is the missing line
            chartLabels,
            years: years, // Ensure years is passed here
            currentPage: parseInt(page) // Pass the current page number for pagination
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/download-pdf', async (req, res) => {
    try {
        const orders = await Order.find().populate("customer_id shipping_charge_id");

        const doc = new PDFDocument();
        const filePath = path.join(__dirname, 'order-report.pdf');
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Title
        doc.fontSize(20).text('Order Report', { align: 'center' });
        doc.moveDown(2);

        // Table Headers
        doc.fontSize(12).text('No.', 50, doc.y, { width: 40, align: 'left' });
        doc.text('Customer ID', 210, doc.y, { width: 120, align: 'left' });
        doc.text('Status', 330, doc.y, { width: 80, align: 'left' });
        doc.text('Type', 410, doc.y, { width: 80, align: 'left' });
        doc.text('Payment', 490, doc.y, { width: 80, align: 'left' });
        doc.text('Shipping ID', 570, doc.y, { width: 100, align: 'left' });
        doc.text('Total Cost', 670, doc.y, { width: 100, align: 'left' });

        doc.moveDown();

        // Add order data to PDF
        orders.forEach((order, index) => {
            doc.text(index + 1, 50, doc.y, { width: 40, align: 'left' });
            doc.text(order.customer_id?._id?.toString() || "N/A", 210, doc.y, { width: 120, align: 'left' });
            doc.text(order.status, 330, doc.y, { width: 80, align: 'left' });
            doc.text(order.type, 410, doc.y, { width: 80, align: 'left' });
            doc.text(order.payment ? "Paid" : "Unpaid", 490, doc.y, { width: 80, align: 'left' });
            doc.text(order.shipping_charge_id?._id?.toString() || "N/A", 570, doc.y, { width: 100, align: 'left' });
            doc.text(order.totalCost.toFixed(2), 670, doc.y, { width: 100, align: 'left' });
            doc.moveDown();
        });

        doc.end();

        stream.on('finish', function () {
            res.download(filePath, 'order-report.pdf', (err) => {
                if (err) console.error(err);
                fs.unlinkSync(filePath);
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
});


module.exports = router;
