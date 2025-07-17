var express = require('express');
var router = express.Router();
var { body, validationResult } = require("express-validator");
var request = require('request');
var Customer = require("../models/customer");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken")
var jwtcheck = require("../middleware/jwtcheck");
var getuser = require("../middleware/jwtcheck");
const otpGenerator = require('otp-generator')
var mOtp = null;


router.post('/', async function (req, res) {
    const {
        email,
        password
    } = req.body;
    try {

        const userFindByEmail = await Customer.findOne({ email });
        console.log(userFindByEmail);
        if (userFindByEmail != null) {
            const customer = await Customer.findOne({ email, password });
            if (customer == null) {
                res.status(200).send({ data: {}, message: "Password invalid.", success: false });
            } else {
                res.status(200).send({ data: customer, message: "User Found.", success: true });
            }
        } else {
            res.status(200).send({ data: {}, message: "User not found.", success: false });
        }
    } catch (error) {
        res.send(error);
    }

});

router.get("/customer/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id);

        if (customer == null) {
            res.status(200).send({ data: {}, message: "User not found.", success: false });
        } else {
            res.status(200).send({ data: customer, message: "User Found.", success: true });
        }
    } catch (error) {
        res.status(200).send({ data: {}, message: "User not found.", success: false });
        console.log(error);
    }
})

router.get("/getname", jwtcheck, async (req, res) => {
    let mainCheck = await Customer.findOne({ _id: req.userId }, { _id: 1, full_name: 1 }).lean();
    if (mainCheck) {

        res.status(200).json({ status: true, name: mainCheck.full_name });
    } else {
        res.status(200).json({ status: false });
    }
})
// router.post('/', async function (req, res, next) {
//     // console.log(req.body)

//     if (req.body.messages === "login-Process-Customer") {
//         var { username, password, } = req.body;
//         Customer.findOne({ $or: [{ username: username }, { email: username }] }).lean().then(async (data) => {
//             // console.log("data",data)
//             if (data) {
//                 const passwordCompare = await bcrypt.compare(password, data.password);
//                 if (passwordCompare) {
//                     const sendData = { myId: data._id };
//                     const jwtData = jwt.sign(sendData, process.env.AUTH_KEY);
//                     // console.log("jwtData", jwtData)
//                     res.status(200).json({ message: "login successfully", data: data, status: true, jwt: jwtData })
//                 } else {
//                     res.status(200).json({ message: "Invalid Password", status: false });
//                 }
//             } else {
//                 res.status(200).json({ message: "Invalid Username", status: false });
//             }
//         })
//     } else {
//         console.log("message is not valid");
//     }
// });
router.post('/get-number', async (req, res) => {
    // console.log("req.body",req.body)
    if (req.body.username) {
        let customerData = await Customer.findOne({ $or: [{ username: req.body.username }, { email: req.body.username }] }, { phone: 1 }).lean();
        // console.log("customerData",customerData, req.body);
        if (customerData) {
            res.json({ status: true, phone: customerData.phone, _id: customerData._id });
        } else {
            res.json({ status: false, message: "Invalid Username or Email" })
        }
    } else {
        res.json({ status: false, message: "Invalid Username or Email" })
    }
})
router.post('/otp', async (req, res) => {
    // console.log("req.body",req.body)
    if (req.body.username && req.body.phone && req.body.messages === "get-opt") {
        let customerData = await Customer.findOne({ $or: [{ username: req.body.username }, { email: req.body.username }], phone: req.body.phone }, { phone: 1 }).lean();
        // console.log("customerData",customerData, req.body);
        if (customerData) {
            mOtp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
            let bodyData = {
                SenderId: "ENGEES",
                Message: `Your login OTP for Engees.in is - ${mOtp}`,
                MobileNumbers: req.body.phone,
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
                    res.status(400).json({ status: false, message: "Otp not send please try after some time" });
                    return false
                }
                // let parsedData = JSON.parse(body);
                // console.log("OTP IS ......... ",parsedData);
                res.json({ status: true, otp: mOtp });
            });
        } else {
            res.json({ status: false, message: "Invalid Phone Number" })
        }
    } else {
        res.json({ status: false, message: "Invalid Phone Number" })
    }
})
router.post('/check-otp', async (req, res) => {
    // console.log("req.body",req.body)
    if (req.body.otp && req.body.messages === "check-otp") {
        if (mOtp === req.body.otp) {
            res.json({ status: true });
        } else {
            res.json({ status: false, message: "Invalid OTP" })
        }
    } else {
        res.json({ status: false, message: "Enter OTP" })
    }
})
router.post('/change-password', async (req, res) => {
    // console.log("req.body",req.body)
    if (req.body._id && req.body.password && req.body.conPassword && req.body.messages === "change-password") {
        if (req.body.password === req.body.conPassword) {
            const salt = await bcrypt.genSalt(10);
            const secPass = await bcrypt.hash(req.body.password, salt);
            Customer.updateOne({ _id: req.body._id }, { password: secPass }).then((data) => {
                if (data) {
                    res.json({ status: true, message: "New Password is Updated" });
                }
            }).catch((error) => {
                console.log("error in password update time", error);
            })
        } else {
            res.json({ status: false, message: "Conform New password and New Password is not Match" })
        }
    } else {
        res.json({ status: false, message: "Enter Conform New password and New Password" })
    }
})
module.exports = router;
