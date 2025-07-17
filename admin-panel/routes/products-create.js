var express = require("express");
var router = express.Router();
var categoriesModel = require("../models/categories.model");
var attributeModel = require("../models/attributes.model");
var productsModel = require("../models/products.model");
var mongoose = require("mongoose");
var path = require("path");
var multer = require("multer");
require("dotenv").config();

var MESSAGE = null;

// Multer setup
const storage = multer.diskStorage({
  destination: "./public/images/products/",
  filename: (req, file, cb) => {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {  
      cb(new Error("Only image files are allowed"));
    }
  },
});

// GET: Product create form
router.get("/", async function (req, res, next) {
  if (!isNaN(req.session.count)) {
    const attributes = await attributeModel.find({ is_delete: false }).lean();
    const parentAttributes = attributes.filter(attr => !attr.parent);
    const childAttributes = attributes.filter(attr => attr.parent);

    const parentCategories = await categoriesModel.find({ is_delete: false, parent: undefined }).lean();
    // req.session.success = 'Product created successfully!';
    // res.redirect('/products-create');
    const success = req.session.success;
    delete req.session.success;

    res.render("products-create", {
      message: "",
      success: req.query.success || "",
      failure: req.query.failure || "",
      parentAttributes,
      childAttributes,
      parentCategories,
      success,
      subCategories: [],
      childCategories: [],
      attributes,
      product: {},
      message: MESSAGE,
    });

    MESSAGE = null;
  } else {
    res.redirect("/admin");
  }
});

// POST: Create new product
router.post('/', upload.fields([{ name: 'cover_photo' }, { name: 'other_photo' }]), async (req, res) => {
  if (!isNaN(req.session.count)) {
    const {
      title, slug, short_description, full_description,
      assign_price, unassign_price, sku, status,
      categories, sub_categories, child_categories,
      total_stock, languages,
      parent_attributes, child_attributes,
      new_arrivals, best_selling, hot_release, top_selling
    } = req.body;

    try {
      const parentCategories = Array.isArray(categories) ? categories : [categories].filter(Boolean);
      const subCategories = Array.isArray(sub_categories) ? sub_categories : [sub_categories].filter(Boolean);
      const childCategories = Array.isArray(child_categories) ? child_categories : [child_categories].filter(Boolean);

      await productsModel.create({
        title,
        slug: slug.trim(),
        short_description,
        full_description,
        assign_price: parseInt(assign_price),
        unassign_price: parseInt(unassign_price),
        sku,
        status: status === 'true',

        parent_categories: parentCategories,
        sub_categories: subCategories,
        child_categories: childCategories,

        total_stock,
        languages: Array.isArray(languages) ? languages : [languages],

        parent_attributes: Array.isArray(parent_attributes) ? parent_attributes : [parent_attributes].filter(Boolean),
        child_attributes: Array.isArray(child_attributes) ? child_attributes : [child_attributes].filter(Boolean),

        cover_image: {
          path: req.files?.cover_photo ? req.files.cover_photo[0].path.replace(/\\/g, '/').split('public/')[1] : '',
          url: req.files?.cover_photo ? process.env.DOMAIN_URL + req.files.cover_photo[0].path.replace(/\\/g, '/').split('public/')[1] : '',
        },
        other_image: {
          path: req.files?.other_photo ? req.files.other_photo.map(file => file.path.replace(/\\/g, '/').split('public/')[1]) : [],
          url: req.files?.other_photo ? req.files.other_photo.map(file => process.env.DOMAIN_URL + file.path.replace(/\\/g, '/').split('public/')[1]) : [],
        },

        new_arrivals: new_arrivals === 'on',
        best_selling: best_selling === 'on',
        hot_release: hot_release === 'on',
        top_selling: top_selling === 'on',
        is_delete: false,
      });
      req.session.success = 'Product created successfully!';
      // res.redirect('/products-create');

      res.redirect('/products-create?success=Product created successfully');
    } catch (error) {
      console.error('Create error:', error);
      res.redirect('/products-create?failure=Something went wrong while creating the product');
    }
  } else {
    res.redirect('/admin');
  }
});

// POST: Get subcategories by parent category
router.post("/parent-find", async (req, res) => {
  try {
    const { id, message } = req.body;

    // Ensure user is logged in and request is valid
    if (req.session.count >= 0 && message === "sub-find" && id) {
      const subcategories = await categoriesModel.find({
        parent: id,
        sub_parent: { $in: [null, undefined] }, // explicitly no sub_parent
        is_delete: false
      }).lean();

      res.status(200).json(subcategories);
    } else {
      res.status(400).json({ error: "Invalid request parameters" });
    }
  } catch (error) {
    console.error("Subcategory fetch error:", error);
    res.status(500).json({ error: "Server error while fetching subcategories" });
  }
});

router.post("/sub-find", async (req, res) => {
  try {
    if (req.session.count >= 0 && req.body.message === "sub-find" && req.body.id) {
      const subCategories = await categoriesModel.find({
        parent: req.body.id,
        sub_parent: undefined,
        is_delete: false
      }).lean();
      res.status(200).json(subCategories);
    }
  } catch (error) {
    console.error("Subcategory fetch error:", error);
    res.status(500).json([]);
  }
});

// POST: Get child categories
router.post("/child-find", async (req, res) => {
  try {
    if (req.session.count >= 0 && req.body.message === "child-find" && req.body.id) {
      const childCategories = await categoriesModel.find({
        sub_parent: req.body.id,
        is_delete: false
      }).lean();
      res.status(200).json(childCategories);
    }
  } catch (error) {
    console.error("Child category fetch error:", error);
    res.status(500).json([]);
  }
});

// GET: Message fetch
router.get("/message", (req, res) => {
  if (!isNaN(req.session.count)) {
    res.json({ message: MESSAGE });
  }
});

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

module.exports = router;
