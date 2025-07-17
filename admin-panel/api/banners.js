var express = require('express');
var router = express.Router();
var webBannersModel = require("../models/web-banner.model");

// router.post('/', async function (req, res, next) {
//     // if (req.body.messages === "get-banner-data") {
//     webBannersModel.find({}).then((data) => {
//         // console.log("product data is",data);
//         res.status(200).json({ data: data, status: true })
//     }).catch(error => { console.log("web banners find time", error) })
//     // } else {
//     // console.log("invalid messages or slug");
//     // }
// });

router.post('/web', async function (req, res, next) {
    // if (req.body.messages === "get-banner-data") {
    webBannersModel.find({}).then((data) => {
        // console.log("product data is",data);
        res.status(200).json({ data: data, status: true })
    }).catch(error => {
        res.status(200).json({ data: {}, status: false })

        console.log("web banners find time", error)
    })
    // } else {
    //     console.log("invalid messages or slug");
    // }
});
module.exports = router;