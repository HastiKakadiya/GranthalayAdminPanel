const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/products.model');
const Category = require('../models/categories.model');
const Attribute = require('../models/attributes.model');
const fs = require('fs');


const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Configure multer for image uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads/products/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

const upload = multer({ storage });

// GET product add form
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ parent: null, is_delete: false });
    const attributes = await Attribute.find({ parent: null, is_delete: false });


    res.render('product-add', { categories, attributes, message: null });
  } catch (error) {
    console.error("GET /product-add Error:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET subcategories by parent ID
router.get('/subcategories/:id', async (req, res) => {
  try {
    const subcats = await Category.find({ parent: req.params.id, is_delete: false });
    res.json(subcats);
  } catch (error) {
    console.error("Fetch Subcategories Error:", error);
    res.status(500).json([]);
  }
});

// GET child attributes by parent attribute ID
router.get('/attributes/:id', async (req, res) => {
  try {
    const children = await Attribute.find({ parent: req.params.id, is_delete: false });
    res.json(children);
  } catch (error) {
    console.error("Fetch Attributes Error:", error);
    res.status(500).json([]);
  }
});

// POST create new product
router.post('/', upload.fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'other_images', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log("Cover Image:", req.files['cover_image']);
    console.log("Other Images:", req.files['other_images']);

    const {
      title, short_description, full_description,
      assign_price, unassign_price, sku,
      parent_categories, sub_categories, child_categories,
      parent_attributes, child_attributes,
      total_stock, languages, status
    } = req.body;

    const slug = title.toLowerCase().replace(/\s+/g, '-');

    // const coverImage = req.files['cover_image']?.[0];
    // const otherImages = req.files['other_images']?.map(file => ({
    //   url: `/uploads/products/${file.filename}`,
    //   path: file.path
    // })) || [];



    const BASE_IMAGE_PATH = 'images/products/';
    const BASE_URL = 'http://localhost:8000/';

    // Assuming these are from req.files
    const coverImage = req.files?.cover_image?.[0];
    const otherImages = req.files?.other_images || [];

    const product = new Product({
      title,
      short_description,
      full_description,
      assign_price,
      unassign_price,
      slug,
      sku,
      status: status === 'true',
      is_active: true,
      parent_categories,
      sub_categories,
      child_categories: child_categories || null,
      parent_attributes,
      child_attributes,
      total_stock,
      languages: languages.split(',').map(lang => lang.trim()),
      cover_image: coverImage ? {
        path: `${BASE_IMAGE_PATH}${coverImage.filename}`,
        url: `${BASE_URL}${BASE_IMAGE_PATH}${coverImage.filename}`
      } : null,
    
      // ✅ Fixed other_images
      other_images: otherImages.length > 0 ? {
        path: otherImages.map(file => `${BASE_IMAGE_PATH}${file.filename}`),
        url: otherImages.map(file => `${BASE_URL}${BASE_IMAGE_PATH}${file.filename}`)
      } : { path: [], url: [] },
    });

    await product.save();
    res.redirect('/products'); // Redirect to product listing after insert
  } catch (error) {
    console.error("Product Insert Error:", error);
    res.status(500).send("Error inserting product");
  }
});

module.exports = router;
