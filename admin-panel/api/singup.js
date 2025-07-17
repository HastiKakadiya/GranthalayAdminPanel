var express = require('express');
var router = express.Router();
var { body, validationResult } = require("express-validator");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var Customer = require("../models/customer");
var request = require('request');
const otpGenerator = require('otp-generator')

var mOtp = null;
var mPhone = null;

router.post('/', async function (req, res) {
    const {
        username,
        email,
        phone,
        password,
        address
    } = req.body;
    try {

        const isAlreadyFound = await Customer.findOne({ email });
        const isAlreadyFoundContect = await Customer.findOne({ phone });
        if (isAlreadyFound != null) {
            res.status(200).send({ data: {}, message: "Email already registered.", success: false });
        } else if (isAlreadyFoundContect != null) {
            res.status(200).send({ data: {}, message: "Phone already registered.", success: false });
        } else {
            const customer = await Customer.create({ username, email, phone, password, address });
            res.status(200).send({ data: customer, message: "User registered successfully.", success: true });
        }
    } catch (error) {
        res.send(error);
    }

});

router.post("/otp", async (req, res) => {
    var { phone } = req.body;
    if (phone.length == 10 && !isNaN(phone)) {
        let checkPhone = await Customer.findOne({ is_delete: false, phone: phone }).lean();
        // console.log("checkPhone si",checkPhone);
        mOtp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
        if (!checkPhone) {
            let bodyData = {
                SenderId: "ENGEES",
                Message: `Your login OTP for Engees.in is - ${mOtp}`,
                MobileNumbers: phone,
                ApiKey: "CYgbZHmqONDG4eADb1xsFLYaXTyNfHwCoUhgsmSHiyY=",
                ClientId: "dc161d68-e5de-40d8-a2d6-99b56b86a5ec"
            }
            request.post({
                headers: { 'content-type': "application/json" },
                url: "http://sms.engees.in/api/v2/SendSMS",
                body: JSON.stringify(bodyData)
            }, async function (error, response, body) {
                if (error) {
                    console.log("error", error);
                    
                    res.status(400).json({ status: false, message: "Otp Not Send" });
                    return false
                }
                let parsedData = JSON.parse(body);
                // console.log("OTP IS ......... ",parsedData);
                // if(parsedData.token){
                //     res.status(200).json({data : parsedData, status : true});
                // }else{
                //     res.status(200).json({status : false});
                // }
            });

            // console.log(phone);
            // console.log("otp is befor:",mOtp);
            // console.log("otp is befor:",mPhone);
            // mOtp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets : false, specialChars: false });
            mPhone = phone;
            // console.log("mOtp is after:",mOtp);
            // console.log("mOtp is after:",mPhone);
            res.status(200).json({ status: true, otp: mOtp });
        } else {
            res.status(400).json({ status: false, message: "Phone Number is already exists " });
        }
    } else {
        res.status(400).json({ status: false, message: "Invalid Phone Number" });
    }
})

module.exports = router;
