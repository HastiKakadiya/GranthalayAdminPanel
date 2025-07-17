const express = require("express");
const Customer = require("../models/customer"); // Import the customer model
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PDFDocument = require("pdfkit"); // Import pdfkit
const ExcelJS = require("exceljs");


// Route for fetching the customer report
router.get("/", async (req, res) => {
    if (req.session.count === NaN || req.session.count >= 0) {

        try {
            const { search, startDate, endDate, page = 1, limit = 10, sortBy, year, exportType } = req.query;

            // Construct the filter object
            let filter = {};

            // If there's a search query, filter by username, email, full name, or phone
            if (search) {
                const searchRegex = new RegExp(search, "i"); // Case-insensitive search
                filter.$or = [
                    { username: { $regex: searchRegex } },
                    { email: { $regex: searchRegex } },
                    { full_name: { $regex: searchRegex } },
                    { phone: { $regex: searchRegex } }  // Added phone number search
                ];
            }

            // If a date range is provided, filter by creation date
            // if (startDate && endDate) {
            //     filter.createdAt = {
            //         $gte: new Date(startDate),
            //         $lte: new Date(endDate),
            //     };
            // }
            if (startDate && endDate) {
                filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
            } else if (startDate) {
                filter.createdAt = { $gte: new Date(startDate) };  // Records from startDate onwards
            } else if (endDate) {
                filter.createdAt = { $lte: new Date(endDate) };  // Records up to endDate
            }

            // If a year is provided, filter by creation date for the specific year
            if (year) {
                filter.createdAt = {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                };
            }

            // Sorting logic
            let sort = {};
            if (sortBy === "desc") {
                sort = { createdAt: -1 }; // Descending order (most recent first)
            } else if (sortBy === "asc") {
                sort = { createdAt: 1 }; // Ascending order
            } else if (sortBy === "az") {
                sort = { full_name: 1 }; // A-Z (alphabetical order)
            } else if (sortBy === "za") {
                sort = { full_name: -1 }; // Z-A (reverse alphabetical order)
            }

            // Fetch the total number of customers with the applied filters
            const totalCustomers = await Customer.countDocuments({});
            const totalCustomersFound = await Customer.countDocuments(filter);

            // Fetch customers with pagination, filters, and sorting
            const customers = await Customer.paginate(filter, {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sort, // Apply sorting
            });

            // Calculate the number of new customers in the last 30 days
            const newCustomersLastMonth = await Customer.countDocuments({
                createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) },
            });

            // Fetch monthly customer data for chart analysis, considering the selected year
            const monthlyData = await Customer.aggregate([
                {
                    $match: filter, // Apply search and date range filters
                },
                {
                    $project: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                },
                {
                    $group: {
                        _id: { year: "$year", month: "$month" },
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 },
                },
            ]);
            // Ensure the reports directory exists
            const reportsDir = path.join(__dirname, "../public/reports");
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            if (exportType === "excel") {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("Customers");

                // Define headers
                worksheet.columns = [
                    { header: "ID", key: "_id", width: 25 },
                    { header: "Name", key: "full_name", width: 20 },
                    { header: "Email", key: "email", width: 25 },
                    { header: "Phone", key: "phone", width: 15 },
                    { header: "Created At", key: "createdAt", width: 20 }
                ];
                const allCustomers = await Customer.find(filter); // Fetch all customers based on filter

                allCustomers.forEach(customer => {
                    worksheet.addRow({
                        _id: customer._id.toString(),
                        full_name: customer.full_name,
                        email: customer.email,
                        phone: customer.phone,
                        createdAt: new Date(customer.createdAt).toLocaleString()
                    });
                });

                // Set file path
                const filePath = path.join(reportsDir, `granthalay-customer-report-${Date.now()}.xlsx`);

                // Save file
                await workbook.xlsx.writeFile(filePath);

                // Send file as download
                return res.download(filePath, "Granthalay-Customer-Report.xlsx", (err) => {
                    if (err) console.error(err);
                    fs.unlinkSync(filePath); // Delete file after download
                });
            }
            // Define month names
            const monthNames = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            // Format the data for the chart
            const chartLabels = monthlyData.map(data => `${monthNames[data._id.month - 1]} ${data._id.year}`); // Get month-year labels
            const chartData = monthlyData.map(data => data.count);

            // Generate a list of years available in the data
            const years = await Customer.aggregate([
                {
                    $project: { year: { $year: "$createdAt" } },
                },
                {
                    $group: { _id: "$year" },
                },
                {
                    $sort: { _id: 1 },
                },
            ]);

            // Extract the year values from the aggregation result
            const yearList = years.map(year => year._id);

            // Default to the current year if none is selected
            const selectedYear = year || null;

            // Render the EJS template with the filtered customer data
            res.render("customer-report", {
                totalCustomers,
                totalCustomersFound,
                totalRecords: totalCustomers, // Use totalCustomers instead of totalServiceProviders
                customers: customers.docs,
                search,
                startDate,
                endDate,
                page: parseInt(page),
                totalPages: customers.totalPages,
                newCustomersLastMonth, // Pass this to the view
                chartLabels, // Pass the chart labels (months/years)
                chartData, // Pass the chart data (customer counts)
                sortBy, // Pass the current sort option to the view
                years: yearList, // Pass the years array to the view
                selectedYear, // Pass the selected year to the view
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching customer data");
        }
    } else {
        res.redirect("/admin");
    }
});


router.get('/download-pdf', async (req, res) => {
    try {
        // Dummy customer data (Replace with actual customer data from DB)
        const customers = [
            { username: "john_doe", full_name: "John Doe", email: "john@example.com", phone: "1234567890", createdAt: "2024-03-01" },
            { username: "jane_doe", full_name: "Jane Doe", email: "jane@example.com", phone: "9876543210", createdAt: "2024-03-05" },
            // Add more customer data here
        ];

        // Create a PDF document
        const doc = new PDFDocument();
        const filePath = path.join(__dirname, 'customer-report.pdf');
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Title
        doc.fontSize(20).text('Customer Report Analysis', { align: 'center' });
        doc.moveDown(2);

        // Table Headers
        doc.fontSize(12).text('No.', 50, doc.y, { width: 50, align: 'left' });
        doc.text('Username', 100, doc.y, { width: 150, align: 'left' });
        doc.text('Full Name', 250, doc.y, { width: 150, align: 'left' });
        doc.text('Email', 400, doc.y, { width: 200, align: 'left' });
        doc.text('Phone', 600, doc.y, { width: 100, align: 'left' });
        doc.text('Created At', 700, doc.y, { width: 100, align: 'left' });

        doc.moveDown();

        // Add customer data to PDF
        customers.forEach((customer, index) => {
            doc.text(index + 1, 50, doc.y, { width: 50, align: 'left' });
            doc.text(customer.username, 100, doc.y, { width: 150, align: 'left' });
            doc.text(customer.full_name, 250, doc.y, { width: 150, align: 'left' });
            doc.text(customer.email, 400, doc.y, { width: 200, align: 'left' });
            doc.text(customer.phone, 600, doc.y, { width: 100, align: 'left' });
            doc.text(new Date(customer.createdAt).toLocaleDateString(), 700, doc.y, { width: 100, align: 'left' });
            doc.moveDown();
        });

        // Finalize the document
        doc.end();

        stream.on('finish', function () {
            res.download(filePath, 'customer-report.pdf', (err) => {
                if (err) console.error(err);
                fs.unlinkSync(filePath); // Delete file after sending
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
});
module.exports = router;
