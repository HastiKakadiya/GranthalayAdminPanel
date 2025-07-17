var express = require("express");
var router = express.Router();
var categoriesModel = require("../models/categories.model");
var attributeModel = require("../models/attributes.model");
var productsModel = require("../models/products.model");
var mongoose = require("mongoose")
var path = require("path");
var multer = require("multer");

const storege = multer.diskStorage({
    destination: "./public/images/products/",
    filename: (req, file, cb) => {
        cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storege,
});
var id = "";
router.get("/", async function (req, res, next) {
    if (req.session.count !== undefined && req.session.count >= 0) {
        const id = req.url.split("=")[1];
        if (mongoose.Types.ObjectId.isValid(id)) {
            let parentCategoriesData = await categoriesModel.find({ is_delete: false, parent: undefined }).lean();
            let attributeData = await attributeModel.find({ is_delete: false, parent: undefined }).lean();
            let product = await productsModel.findOne({ is_delete: false, _id: id }).lean();

            res.render("products-details", {
                message: "",
                parentCategories: parentCategoriesData,
                parentAttribute: attributeData,
                product: product  // 🔥 changed from "productsData"
            });
        } else {
            res.redirect("/products");
        }
    } else {
        res.redirect("/admin");
    }
});



router.post("/", upload.fields([{ name: "cover_photo" }, { name: "other_photo" }]), async (req, res) => {
    // console.log("/ post calling");
    if (req.session.count === NaN || req.session.count >= 0) {
        // console.log("req.body is ",req.body);
        // console.log("req.files is ",req.files);
        var { title, short_description, full_description, assign_price, categories, attribute, slug, unassign_price, gst } = req.body;
        let check = req.body.slug.match(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/)
        // console.log("check is :",check);
        // console.log("mongoose.Types.ObjectId.isValid(req.body.child_categories) ",mongoose.Types.ObjectId.isValid(req.body.child_categories[0]));
        // const {path} = req.file;
        // let replacePath = path.replace(/\\/g, "/");;
        // let splitPath = replacePath.split("public/")[1];
        // console.log("splitPath",process.env.DOMAIN_URL + splitPath);
        // const realPath = process.env.DOMAIN_URL + splitPath;
        if (check && req.body.sku && req.body.assign_price && !isNaN(req.body.assign_price && req.body.height && req.body.length && req.body.weight && req.body.sku)) {
            let productsData = await productsModel.findOne({ is_delete: false, _id: id }, { other_image: 1, cover_image: 1 }).lean();
            // console.log("req.body ........................ ",req.body);
            var data = {
                title: req.body.title,
                slug: req.body.slug,
                assign_price: req.body.assign_price,
                unassign_price: req.body.unassign_price,
                short_description: req.body.short_description,
                full_description: req.body.full_description,
                sku: req.body.sku,
                status: req.body.status,
                parent_categories: req.body.categories,
                sub_categories: req.body.sub_categories,
                child_categories: req.body.child_categories,
                parent_attributes: req.body.attributes,
                child_attributes: req.body.child_attributes,
                cover_image: {
                    path: productsData.cover_image.path,
                    url: productsData.cover_image.url,
                },
                other_image: {
                    path: productsData.other_image.path,
                    url: productsData.other_image.url,
                },
                new_arrivals: req.body.new_arrivals == "true" ? true : false,
                best_selling: req.body.best_selling == "true" ? true : false,
                hot_release: req.body.hot_release == "true" ? true : false,
                top_selling: req.body.top_selling == "true" ? true : false,
                is_delete: false,
            }
            if (req.files) {
                let coverPhotoSplitPath = "", coverPhotoRealPath = "";
                let otherPhotoSplitPath = [], otherPhotoRealPath = [];

                if (req.files.cover_photo) {
                    let coverPhotoPath = req.files.cover_photo[0].path;
                    let replacePath = coverPhotoPath.replace(/\\/g, "/");;
                    coverPhotoSplitPath = replacePath.split("public/")[1];
                    // console.log("coverPhotoSplitPath",process.env.DOMAIN_URL + coverPhotoSplitPath);
                    coverPhotoRealPath = process.env.DOMAIN_URL + coverPhotoSplitPath;
                    data.cover_image.path = coverPhotoSplitPath;
                    data.cover_image.url = coverPhotoRealPath;
                }

                if (req.files.other_photo) {
                    for (let i = 0; i < req.files.other_photo.length; i++) {
                        let ohterPhotoPath = req.files.other_photo[i].path;
                        let replacePath = ohterPhotoPath.replace(/\\/g, "/");;
                        otherPhotoSplitPath[i] = replacePath.split("public/")[1];
                        // console.log("otherPhotoSplitPath[i]",process.env.DOMAIN_URL + otherPhotoSplitPath[i]);
                        otherPhotoRealPath[i] = process.env.DOMAIN_URL + otherPhotoSplitPath[i];
                    }
                    data.other_image.path = otherPhotoSplitPath;
                    data.other_image.url = otherPhotoRealPath;

                }
                // console.log("coverPhotoSplitPath", coverPhotoSplitPath)
                // console.log("coverPhotoRealPath", coverPhotoRealPath)
                // console.log("otherPhotoSplitPath", otherPhotoSplitPath)
                // console.log("otherPhotoRealPath", otherPhotoRealPath)
            }
            productsModel.updateOne({ _id: id }, data).then((data) => {
                // console.log("data is ",data);
                res.redirect("/products");
            }).catch(error => {
                console.log("error", error);
            })
        } else {

        }

    } else {
        res.redirect("/admin");
    }
})

router.post("/get-category", async (req, res) => {
    // console.log("sub-find callig",req.body);
    if (req.session.count === NaN || req.session.count >= 0) {
        if (req.body.message === "getId" && id != "") {
            let productsData = await productsModel.findOne({ is_delete: false, _id: id }, { parent_categories: 1, sub_categories: 1, child_categories: 1 }).lean();
            res.status(200).send(productsData);
        }
    }
});
router.post("/get-attributes", async (req, res) => {
    // console.log("sub-find callig",req.body);
    if (req.session.count === NaN || req.session.count >= 0) {
        if (req.body.message === "getId" && id != "") {
            let productsData = await productsModel.findOne({ is_delete: false, _id: id }, { child_attributes: 1, parent_attributes: 1 }).lean();
            res.status(200).send(productsData);
        }
    }
});
router.post("/child-find", async (req, res) => {
    // console.log("child-find callig",req.body);
    if (req.session.count === NaN || req.session.count >= 0) {
        if (req.body.message === "child-find" && req.body.id) {
            let childCategories = await categoriesModel.find({ sub_parent: req.body.id, is_delete: false }).lean();
            // console.log("childCategories is :",childCategories)
            res.status(200).send(childCategories);
        } else {
            console.log("have in elese");
        }
    }
});

router.get("/product-details/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const product = await Product.findById(id)
            .populate("parent_categories")
            .populate("subcategories")
            .populate("child_categories")
            .populate("attributes");

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("products-details", {
            product
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


module.exports = router;
