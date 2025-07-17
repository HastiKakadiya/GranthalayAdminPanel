var express = require('express');
var router = express.Router();
var customerModel = require("../models/customer");

// Customer List Page
router.get("/", async function (req, res, next) {
    if (req.session.count >= 0) {
        let option = { sort: { createdAt: -1 }, page: 1, limit: 10 };
        customerModel.paginate({}, option, (error, result) => {
            res.render("customers", { 
                message: "", 
                data: result.docs, 
                totalPages: result.totalPages,
                currentPage: result.page
            });
        });
    } else {
        res.redirect("/admin");
    }
});

// Pagination with Filters
router.post("/pagination", (req, res) => {
    if (req.session.count >= 0) {
        let searchQuery = {};

        if (req.body.search) {
            if (req.body.search.match(/^[0-9a-fA-F]{24}$/)) {
                searchQuery._id = req.body.search; // Direct match for MongoDB _id
            }
            else{
                let searchRegex = new RegExp(req.body.search, "i");
                searchQuery.$or = [
                    { full_name: searchRegex },
                    { username: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ];
            }
        }
        if (req.body.blockStatus) {
            searchQuery.isBlocked = req.body.blockStatus === "true";
        }

        let sortOption = { createdAt: req.body.sortBy === "asc" ? 1 : -1 };
        let page = parseInt(req.body.page) || 1;
        let limit = parseInt(req.body.limit) || 10;
        let option = { sort: sortOption, page, limit };

        customerModel.paginate(searchQuery, option, (error, result) => {
            res.send({
                docs: result.docs,
                totalPages: result.totalPages,
                currentPage: result.page,
                hasNextPage: result.page < result.totalPages,
                hasPrevPage: result.page > 1,
            });
        });
    }
});

// Toggle Block/Unblock
router.post("/toggle-block", async (req, res) => {
    try {
        let customer = await customerModel.findById(req.body.id);
        if (!customer) return res.status(404).send({ success: false, message: "Customer Not Found" });

        customer.isBlocked = req.body.isBlocked;
        await customer.save();

        res.send({ success: true, isBlocked: customer.isBlocked });
    } catch (error) {
        console.error("Error toggling block status:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
});


module.exports = router;
