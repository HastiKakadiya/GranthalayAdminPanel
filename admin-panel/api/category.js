var express = require('express');
var router = express.Router();
var categoriesModel = require("../models/categories.model");

router.post('/', async function (req, res, next) {
    if (req.body.messages === "get-categories-data") {
        let categoriesData = await categoriesModel.find({ is_delete: false, parent: undefined }, { name: 1, slug: 1, cover_image: 1 }).limit(22).lean();
        // console.log("categoriesData", categoriesData);
        res.status(200).json({ data: categoriesData, status: true, })
    } else {
        console.log("invalid messages");
    }
});

router.post("/parents-child-category", async (req, res) => {
    if (req.body.messages == "get-api-parents-child-category-data") {
        if (req.body.for === "products-page") {
            let categoriesData = await categoriesModel.find({ is_delete: false, used: { $ne: undefined } }).lean();
            res.json({ categoriesData, status: true })
        }
        if (req.body.for === "categories-page") {
            let categoriesData = await categoriesModel.find({ is_delete: false, sub_parent: { $ne: undefined } }).populate("parent").lean();
            res.json({ categoriesData, status: true })
        }
    }
})


router.post('/display', async function (req, res, next) {
    if (req.body.messages === "get-categories-data") {
        let categoriesData1 = await categoriesModel.find({ is_delete: false, used: true }, { name: 1, slug: 1, }).lean();
        let categoriesData2 = await categoriesModel.find({ is_delete: false, used: false }, { name: 1, slug: 1, }).lean();
        let categoriesData3 = await categoriesModel.find({ is_delete: false, parent: { $exists: true }, sub_parent: undefined }, { name: 1, slug: 1, parent: 1, sub_parent: 1 }).populate("parent").lean();
        let categoriesData4 = await categoriesModel.find({ is_delete: false, parent: { $exists: true }, sub_parent: { $exists: true } }, { name: 1, slug: 1, parent: 1, sub_parent: 1 }).lean();
        // console.log("categoriesData1", categoriesData1);
        // console.log("categoriesData2", categoriesData2);
        // console.log("categoriesData3", categoriesData3);
        // console.log("categoriesData4", categoriesData4);
        res.status(200).json({ data1: categoriesData1, data2: categoriesData2, data3: categoriesData3, data4: categoriesData4, status: true });
    } else {
        console.log("invalid messages");
    }
});

module.exports = router;
