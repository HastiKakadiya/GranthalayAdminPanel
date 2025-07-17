var express = require('express');
var router = express.Router();
var couponModel = require("../models/coupon.model");
var customersModel = require("../models/customer");

var jwtcheck = require("../middleware/jwtcheck")

router.post("/find", jwtcheck, async (req, res) => {
    let mainCheck = await customersModel.findOne({ _id: req.userId }, { _id: 1 }).lean();
    if (mainCheck) {
        if (req.body.messages === "api-coupon-check" && req.body.coupon) {
            couponModel.findOne({ name: req.body.coupon }).then((data) => {
                // console.log("data is",data);
                if (data) {
                    let now = new Date();
                    let end = new Date(data.end)
                    let start = new Date(data.start);
                    // console.log("now",now);
                    // console.log("end",end);
                    // console.log("start",start);
                    if (now > start && now < end) {
                        res.status(200).json({ status: true, data: data });
                    } else {
                        res.json({ status: false, messages: "This Coupon is Invalid" })
                    }
                } else {
                    res.json({ status: false, messages: "This Coupon is Invalid" })
                }
            }).catch(error => {
                console.log("error in coupon find time", error);
                res.json({ status: false, messages: "This Coupon is Invalid" })
            })
        } else {
            console.log("invalid messages coupon find time");
        }
    } else {
        console.log("invalid token");
    }

})
router.post("/promo", async (req, res) => {
    // let mainCheck = await customersModel.findOne({ _id: req.userId }, { _id: 1 }).lean();
    // if (mainCheck) {
    // if(req.body.messages === "get-api-promo-code"){
    let d = new Date();
    d.setHours(0)
    d.setMinutes(0);
    d.setSeconds(0);
    console.log('d', d)
    let checkDate = d.toISOString();
    let list = await couponModel.find({ start: { $gte: checkDate } }).lean();
    console.log("list", list);
    res.status(200).json({ status: true, data: list });
    // }else{
    //     console.log("invalid peramiter");
    // }
    // } else {
    //     console.log("invalid token");
    // }
})

module.exports = router 