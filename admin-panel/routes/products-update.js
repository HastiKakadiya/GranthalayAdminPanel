const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");

const categoriesModel = require("../models/categories.model");
const attributeModel = require("../models/attributes.model");
const productsModel = require("../models/products.model");

// Multer config
const storage = multer.diskStorage({
  destination: "./public/images/products/",
  filename: (req, file, cb) => {
    const uniqueName = file.originalname.split(".")[0] + "-" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET: Edit product page by ID
// router.get("/edit/:id", async (req, res) => {
//   if (typeof req.session.count !== "number" || req.session.count < 0) {
//     return res.redirect("/admin");
//   }

//   const id = req.params.id;
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     console.log("Invalid product ID:", id);
//     return res.redirect("/products");
//   }

//   try {
//     const subCategories = await categoriesModel.find({
//       is_delete: false,
//       parent: { $ne: null },
//       sub_parent: { $in: [null, undefined] }
//     }).lean();

//     // ✅ Fetch child categories (children of subcategories)
//     const childCategories = await categoriesModel.find({
//       is_delete: false,
//       sub_parent: { $ne: null }
//     }).lean();

//     const attributes = await attributeModel.find({ is_delete: false }).lean();
//     const parentAttributes = attributes.filter(attr => !attr.parent);
//     const childAttributes = attributes.filter(attr => attr.parent);
//     const subcategories = await categoriesModel.find({ parent: { $ne: null } }); // get subcategories

//     const parentCategories = await categoriesModel.find({ is_delete: false, parent: undefined }).lean();
//     const childcategories = await Category.find({ parent: { $ne: null } }).lean();

//     const productsData = await productsModel.findOne({
//       _id: id,
//       is_delete: false,
//     }).lean();

//     if (!productsData) return res.redirect("/products");

//     res.render("products-update", {
//       message: "",
//       productsData,
//       parentCategories,
//       subCategories: [],
//       subcategories,
//       childCategories: [],
//       parentAttributes,
//       childcategories,
//       childAttributes,
//       attributes,
//     });
//   } catch (error) {
//     console.error("GET /products-update/edit/:id error:", error);
//     return res.redirect("/products");
//   }
// });


router.get("/edit/:id", async (req, res) => {
  if (typeof req.session.count !== "number" || req.session.count < 0) {
    return res.redirect("/admin");
  }

  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log("Invalid product ID:", id);
    return res.redirect("/products");
  }

  try {
    // Parent Categories (no parent field)
    const parentCategories = await categoriesModel.find({
      is_delete: false,
      parent: { $exists: false }
    }).lean();

    // Subcategories (parent exists, sub_parent doesn't)
    const subcategories = await categoriesModel.find({
      is_delete: false,
      parent: { $ne: null },
      sub_parent: { $in: [null, undefined] }
    }).lean();

    // Child categories (sub_parent exists)
    const childcategories = await categoriesModel.find({
      is_delete: false,
      sub_parent: { $ne: null }
    }).lean();

    // Attributes
    const attributes = await attributeModel.find({ is_delete: false }).lean();
    const parentAttributes = attributes.filter(attr => !attr.parent);
    const childAttributes = attributes.filter(attr => attr.parent);

    // Product
    const productsData = await productsModel.findOne({
      _id: id,
      is_delete: false,
    }).lean();

    if (!productsData) return res.redirect("/products");
    const success = req.session.success;
    delete req.session.success;
    res.render("products-update", {
      success: req.query.success || "",
      message: "",
      failure: req.query.failure || "",
      productsData,
      success,
      parentCategories,
      subcategories,
      childcategories,
      parentAttributes,
      childAttributes,
      attributes,
    });
  } catch (error) {
    console.error("GET /products-update/edit/:id error:", error);
    return res.redirect("/products");
  }
});

// POST: Get subcategories by parent category
router.post("/parent-find", async (req, res) => {
  const { id, message } = req.body;
  if (req.session.count >= 0 && message === "sub-find" && id) {
    try {
      const subcategories = await categoriesModel.find({
        parent: id,
        sub_parent: { $in: [null, undefined] },
        is_delete: false
      }).lean();
      res.status(200).json(subcategories);
    } catch (error) {
      console.error("Subcategory fetch error:", error);
      res.status(500).json([]);
    }
  } else {
    res.status(400).json([]);
  }
});

// POST: Get child categories
router.post("/child-find", async (req, res) => {
  const { id, message } = req.body;
  if (req.session.count >= 0 && message === "child-find" && id) {
    try {
      const childcategories = await categoriesModel.find({
        sub_parent: id,
        is_delete: false
      }).lean();
      res.status(200).json(childcategories);
    } catch (error) {
      console.error("Child category fetch error:", error);
      res.status(500).json([]);
    }
  } else {
    res.status(400).json([]);
  }
});

// GET: Subcategories & Child categories via dynamic routes
router.get('/get-subcategories/:categoryId', async (req, res) => {
  try {
    const subcategories = await categoriesModel.find({ parent: req.params.categoryId }).lean();
    res.json({ success: true, subcategories });
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get('/get-childcategories/:subcategoryId', async (req, res) => {
  try {
    const childcategories = await categoriesModel.find({ parent: req.params.subcategoryId }).lean();
    res.json({ success: true, childcategories });
  } catch (err) {
    console.error('Error fetching child categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST: Update product
router.post("/edit/:id", upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "other_image" }
]), async (req, res) => {
  if (typeof req.session.count !== "number" || req.session.count < 0) return res.redirect("/admin");

  const productId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    console.log("Invalid product ID:", productId);
    return res.redirect("/products");
  }

  const existingProduct = await productsModel.findById(productId).lean();

  const {
    title, slug, short_description, full_description,
    assign_price, unassign_price, sku, status,
    categories, sub_categories, child_categories,
    total_stock, languages,
    parent_attributes, child_attributes,
    new_arrivals, best_selling, hot_release, top_selling
  } = req.body;

  const parentCategories = Array.isArray(categories) ? categories : [categories].filter(Boolean);
  const subCategories = Array.isArray(sub_categories) ? sub_categories : [sub_categories].filter(Boolean);
  const childCategories = Array.isArray(child_categories) ? child_categories : [child_categories].filter(Boolean);

  const updatedData = {
    title,
    slug: slug.trim(),
    short_description,
    full_description,
    assign_price: parseInt(assign_price),
    unassign_price: parseInt(unassign_price),
    sku,
    status: ['true', 'Active'].includes(req.body.status),
    parent_categories: parentCategories,
    sub_categories: subCategories,
    child_categories: childCategories,
    total_stock,
    languages: Array.isArray(languages) ? languages : [languages],
    parent_attributes: Array.isArray(parent_attributes) ? parent_attributes : [parent_attributes].filter(Boolean),
    child_attributes: Array.isArray(child_attributes) ? child_attributes : [child_attributes].filter(Boolean),
    new_arrivals: new_arrivals === 'on',
    best_selling: best_selling === 'on',
    hot_release: hot_release === 'on',
    top_selling: top_selling === 'on',
    is_delete: false,
  };

  // ✅ Handle Cover Image
  if (req.files["cover_image"]?.length > 0) {
    const cover = req.files["cover_image"][0];
    const coverPath = cover.path.replace(/\\/g, "/").split("public/")[1];
    updatedData.cover_image = {
      path: coverPath,
      url: process.env.DOMAIN_URL + coverPath,
    };
  } else {
    updatedData.cover_image = existingProduct?.cover_image || {};
  }

  // ✅ Handle Other Images
  if (req.files["other_image"]?.length > 0) {
    const otherPaths = req.files["other_image"].map(file => file.path.replace(/\\/g, "/").split("public/")[1]);
    const otherUrls = req.files["other_image"].map(file => process.env.DOMAIN_URL + file.path.replace(/\\/g, "/").split("public/")[1]);

    updatedData.other_image = {
      path: otherPaths,
      url: otherUrls,
    };
  } else {
    updatedData.other_image = existingProduct?.other_image || { path: [], url: [] };
  }

  try {
    await productsModel.findByIdAndUpdate(productId, updatedData);
    req.session.success = 'Product Updated successfully!';
    res.redirect(`/products-update/edit/${productId}?success=Product updated successfully`);
  } catch (error) {
    console.error("Error updating product:", error);
    res.redirect(`/products-update/edit/${productId}?failure=Something went wrong while updating`);
  }
});


// POST: Get categories for selected product
router.post("/get-category", async (req, res) => {
  if (typeof req.session.count !== "number" || req.session.count < 0) return;
  const { id, message } = req.body;
  if (message === "getId" && mongoose.Types.ObjectId.isValid(id)) {
    const result = await productsModel.findOne({ _id: id, is_delete: false }, {
      parent_categories: 1,
      sub_categories: 1,
      child_categories: 1,
    }).lean();
    return res.status(200).json(result);
  }
  res.status(400).json({ error: "Invalid request" });
});

// POST: Get attributes for selected product
router.post("/get-attributes", async (req, res) => {
  if (typeof req.session.count !== "number" || req.session.count < 0) return;
  const { id, message } = req.body;
  if (message === "getId" && mongoose.Types.ObjectId.isValid(id)) {
    const result = await productsModel.findOne({ _id: id, is_delete: false }, {
      parent_attributes: 1,
      child_attributes: 1,
    }).lean();
    return res.status(200).json(result);
  }
  res.status(400).json({ error: "Invalid request" });
});

module.exports = router;
