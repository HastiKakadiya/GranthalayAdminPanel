var express = require("express");
var router = express.Router();
var reviewsModel = require("../models/reviews.model");
var productModel = require("../models/products.model");

// Reviews List Page
router.get("/", async function (req, res, next) {
    if (req.session.count >= 0) {
        let option = { sort: { createdAt: -1 }, page: 1, limit: 10 };
        reviewsModel.paginate({ is_delete: false }, option, (error, result) => {
            res.render("reviews", { 
                message: "", 
                data: result.totalPages 
            });
        });
    } else {
        res.redirect("/admin");
    }

});

// Pagination with Filters
router.post("/pagination", (req, res) => {
  if (req.session.count >= 0) {
      let searchQuery = { is_delete: false };

      // Search Logic (supports exact match for MongoDB ID and partial match for other fields)
      if (req.body.search) {
          if (req.body.search.match(/^[0-9a-fA-F]{24}$/)) {
              searchQuery.$or = [
                  { _id: req.body.search },
                  { product_id: req.body.search },
                  { customer_id: req.body.search }
              ];
          } else {
              let searchRegex = new RegExp(req.body.search, "i");
              searchQuery.$or = [
                  { description: searchRegex },
                  { product_id: searchRegex },
                  { customer_id: searchRegex }
              ];
          }
      }

      // Filter by rating
      if (req.body.rate) {
          searchQuery.rate = Number(req.body.rate);
      }

      // 🛠 Fix Sorting (Ensure Correct Date Sorting)
      let sortOrder = req.body.sortBy === "asc" ? 1 : -1;
      let sortOption = { createdAt: sortOrder };

      let page = parseInt(req.body.page) || 1;
      let limit = parseInt(req.body.limit) || 10;
      let option = { sort: sortOption, page, limit };

      reviewsModel.paginate(searchQuery, option, (error, result) => {
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


module.exports = router;
