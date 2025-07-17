var express = require("express");
var router = express.Router();
var productModel = require("../models/products.model");
var categoryModel = require("../models/categories.model")

router.get("/", async function (req, res, next) {
  if (isNaN(req.session.count) || req.session.count >= 0) {
      try {
          let option = {
              sort: { _id: -1 },
              page: 1,
              limit: 7,
              populate: [
                  { path: "parent_categories", select: "name" },
                  { path: "sub_categories", select: "name" },
              ],
              lean: true,
          };

          let productsData = await productModel.paginate({ is_delete: false }, option);
          let categories = await categoryModel.find({}).populate("subcategories").lean();

          // console.log("Categories Data:", JSON.stringify(categories, null, 2));

          res.render("products", { 
              message: "", 
              productsData, 
              categories // Send categories to EJS
          });

      } catch (error) {
          console.error("Error fetching products or categories:", error);
          res.status(500).send("Internal Server Error");
      }
  } else {
      res.redirect("/admin");
  }
});
router.get("/filter", async (req, res) => {
  try {
      let query = { is_delete: false };
      if (req.query.subcategory) {
          query.sub_categories = req.query.subcategory;
      }

      let option = {
          sort: { _id: -1 },
          page: 1,
          limit: 7,
          populate: [
              { path: "parent_categories", select: "name" },
              { path: "sub_categories", select: "name" }
          ],
          lean: true
      };

      let productsData = await productModel.paginate(query, option);
      res.json({ productsData });

  } catch (error) {
      console.error("Error filtering products:", error);
      res.status(500).send("Internal Server Error");
  }
});



router.post("/pagination", async (req, res) => {
  if (isNaN(req.session.count) || req.session.count >= 0) {
    if (req.body.message === "paginations-products" && req.body.page) {
      try {
        let options = {
          sort: { _id: -1 },
          page: parseInt(req.body.page) || 1,
          limit: 7,
          populate: [
            { path: "parent_categories", select: "name" },
            { path: "sub_categories", select: "name" },
          ],
          lean: true, // Convert Mongoose documents to plain objects
        };

        let productsData = await productModel.paginate({ is_delete: false }, options);
        
        res.json(productsData);
      } catch (error) {
        console.error("Pagination error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    } else {
      res.status(400).json({ error: "Invalid Request" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});


router.post("/delete", async (req, res) => {
  try {
    if (isNaN(req.session.count) || req.session.count < 0) {
      return res.status(401).send("Unauthorized. Please login first.");
    }


    if (req.body.message === "pro-delete" && req.body.id) {
      let result = await productModel.updateOne({ _id: req.body.id }, { is_delete: true });

      if (result.modifiedCount > 0) {
        return res.status(200).send("done");
      } else {
        return res.status(400).send("Failed to delete product.");
      }
    } else {
      return res.status(400).send("Invalid request.");
    }
  } catch (error) {
    console.error("Error during product deletion:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/search", async (req, res) => {
  try {
      let searchQuery = req.query.q ? req.query.q.trim() : "";
      
      let filter = { is_delete: false };
      if (searchQuery) {
          filter.$or = [
              { title: { $regex: searchQuery, $options: "i" } }, // Case-insensitive title search
              { "parent_categories.name": { $regex: searchQuery, $options: "i" } }, 
              { "sub_categories.name": { $regex: searchQuery, $options: "i" } }
          ];
      }

      let options = {
          sort: { _id: -1 },
          page: 1,
          limit: 7,
          populate: [
              { path: "parent_categories", select: "name" },
              { path: "sub_categories", select: "name" }
          ],
          lean: true
      };

      let productsData = await productModel.paginate(filter, options);

      res.json({ productsData }); // Send JSON response for AJAX
  } catch (error) {
      console.error("Error during search:", error);
      res.status(500).send("Internal Server Error");
  }
});



module.exports = router;
