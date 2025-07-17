var express = require("express");
var router = express.Router();
var jwtcheck = require("../middleware/jwtcheck");
const async = require("async");
var request = require("request");
var customersModel = require("../models/customer");
var cartModel = require("../models/cart.model");
var orderModel = require("../models/order.model");
const Razorpay = require("razorpay");
var crypto = require("crypto");

router.post("/check", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    if (req.body.messages === "get-update-user-data") {
      let cart = await cartModel
        .find({ customer_id: req.userId, is_delete: false }, { _id: 1 })
        .lean();
      let wishlist = await wishlistModel
        .find({ customer_id: req.userId, is_delete: false }, { _id: 1 })
        .lean();
      // console.log("cart",cart, cart.length);
      res
        .status(200)
        .json({ status: true, cart: cart.length, wishlist: wishlist.length });
    } else {
      console.log("invalid messages or slug in wishlist ids give time");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/auth", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    request.post(
      {
        headers: { "content-type": "application/json" },
        url: "https://apiv2.shiprocket.in/v1/external/auth/login",
        body: JSON.stringify({
          email: "nilkeshmalviya2a@gmail.com",
          password: "nilcart@123",
        }),
      },
      async function (error, response, body) {
        if (error) {
          console.log("error in auth api", error);
          return false;
        }
        let parsedData = JSON.parse(body);
        // console.log("parsedData for auth pincode ",parsedData);
        if (parsedData.token) {
          res.status(200).json({ data: parsedData, status: true });
        } else {
          res.status(200).json({ status: false });
        }
      }
    );
  } else {
    console.log("invalid token");
  }
});
router.get("/list", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    let cartData = await orderModel
      .find({ customer_id: req.userId, payment: false, is_delete: false })
      .sort({ _id: -1 })
      .lean();
    console.log("cartData is :", cartData[0]);
    if (cartData) {
      res.status(200).json({ orderItem: cartData[0], status: true });
    } else {
      console.log("add to cart first");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/products", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    let cartData = await cartModel
      .find({ customer_id: req.userId, purchase: false, is_delete: false })
      .populate({ path: "product_id", match: { is_delete: false } })
      .populate([
        {
          path: "attributes",
          populate: { path: "parent", model: "attributes" },
        },
      ])
      .lean();
    //    console.log("cartData is :",cartData);
    if (cartData.length > 0) {
      let fCartData = [];
      for (let i = 0; i < cartData.length; i++) {
        if (cartData[i].product_id) {
          fCartData.push(cartData[i]);
        }
      }
      res.status(200).json({ cart: fCartData, status: true });
    } else {
      console.log("add to cart first");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/conform-order", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    console.log("if in ......... ", req.body);
    const { order_id, payment_id, signature, _id, products_id } = req.body;
    if (req.body.message === "update-order-conform") {
      let body = order_id + "|" + payment_id;
      var generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");
      //   console.log("sig received " ,signature);
      //   console.log("sig generated " ,generated_signature);
      var response = { signatureIsValid: "false" };
      if (generated_signature == signature) {
        orderModel
          .findOneAndUpdate(
            { _id: _id },
            { order_id, payment_id, signature, payment: true }
          )
          .then(async (data) => {
            // console.log("update data  is:",data);
            if (data) {
              for (let i = 0; i < products_id.length; i++) {
                let cartUpdate = await cartModel
                  .deleteOne({
                    customer_id: req.userId,
                    product_id: products_id[i],
                  })
                  .lean();
              }
              shipingApi(req.body.shiproketToken, data, true, _id);
              res.status(200).json({ status: true });
            }
          })
          .catch((error) => {
            console.log("error in checkout update time ", error);
          });
      } else {
        res.json({ status: false });
      }
    } else {
      console.log("invalid paramiters");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/pin-code", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    // console.log("req.body",req.body)
    if (
      req.body.messages === "get-pin-code-api-data" &&
      req.body.shiproketToken &&
      req.body.pincode
    ) {
      request.get(
        {
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer" + req.body.shiproketToken,
          },
          url: "https://apiv2.shiprocket.in/v1/external/open/postcode/details",
          body: JSON.stringify({ postcode: req.body.pincode }),
        },
        async function (error, response, body) {
          if (error) {
            console.log("error", error);
            return false;
          }
          let parsedData = JSON.parse(body);
          // console.log(parsedData);
          if (parsedData.success) {
            res.status(200).json({ data: parsedData, status: true });
          } else {
            res.status(200).json({ status: false });
          }
        }
      );
    } else {
      console.log("invalid peramiter");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/add-order", jwtcheck, async (req, res) => {
  // console.log("req.body",req.body);
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    let amount = 0;
    req.body.data.forEach(element => {
      amount += element.assign_price
    });
    orderModel
      .create({
        status: "in-process",
        customer_id: req.userId,
        payment: false,
        type: "COD",
        cart: req.body.data,
        is_delete: false,
        totalCost: amount
      })
      .then((data) => {
        // console.log("data",data);
        // console.log("createOrder",order);
        res.status(200).json({
          _id: data._id,
        });
      })
      .catch((error) => {
        console.log("error in order create time", error);
      });
  } else {
    console.log("invalid token");
  }
});
const shipingApi = async (shiproketToken, data, payment, _id) => {
  let other = { height: 0, length: 0, breadth: 0, weight: 0, order_items: [] };
  let = [];
  (async () => {
    for (let i = 0; i < data.cart.length; i++) {
      // console.log("i", i);
      other.order_items.push({
        name: data.cart[i].product_id.title,
        sku: data.cart[i].product_id.sku,
        units: data.cart[i].qty,
        selling_price: data.cart[i].product_id.assign_price,
      });
      other.height =
        other.height +
        data.cart[i].product_id.shipping.height * data.cart[i].qty;
      other.length =
        other.length +
        data.cart[i].product_id.shipping.length * data.cart[i].qty;
      other.breadth =
        other.breadth +
        data.cart[i].product_id.shipping.breadth * data.cart[i].qty;
      other.weight =
        other.weight +
        data.cart[i].product_id.shipping.weight * data.cart[i].qty;
    }
  })();
  // console.log("rewq.body is",data);
  // console.log("req.body.shiproketToken",shiproketToken);
  var options = {
    method: "POST",
    url: "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer" + shiproketToken,
    },
    body: JSON.stringify({
      order_id: data._id,
      order_date: data.updatedAt,
      pickup_location: "Primary",
      channel_id: "",
      comment: "",
      billing_customer_name: data.billingDetails.firstName,
      billing_last_name: data.billingDetails.lastName,
      billing_address: data.billingDetails.address,
      billing_address_2: data.billingDetails.address2,
      billing_city: data.billingDetails.city,
      billing_pincode: data.billingDetails.pincode,
      billing_state: data.billingDetails.state,
      billing_country: data.billingDetails.country,
      billing_email: data.billingDetails.email,
      billing_phone: data.billingDetails.phone,
      shipping_is_billing: data.shipingOther ? false : true, // form react side true = false and false = true
      shipping_customer_name: data.shipingOther
        ? data.shipingDetails.firstName
        : data.billingDetails.firstName,
      shipping_last_name: data.shipingOther
        ? data.shipingDetails.lastName
        : data.billingDetails.lastName,
      shipping_address: data.shipingOther
        ? data.shipingDetails.address
        : data.billingDetails.address,
      shipping_address_2: data.shipingOther
        ? data.shipingDetails.address2
        : data.billingDetails.address2,
      shipping_city: data.shipingOther
        ? data.shipingDetails.city
        : data.billingDetails.city,
      shipping_pincode: data.shipingOther
        ? data.shipingDetails.pincode
        : data.billingDetails.pincode,
      shipping_country: data.shipingOther
        ? data.shipingDetails.country
        : data.billingDetails.country,
      shipping_state: data.shipingOther
        ? data.shipingDetails.state
        : data.billingDetails.state,
      shipping_email: data.shipingOther
        ? data.shipingDetails.email
        : data.billingDetails.email,
      shipping_phone: data.shipingOther
        ? data.shipingDetails.phone
        : data.billingDetails.phone,
      order_items: other.order_items,
      payment_method: payment == true ? "Prepaid" : "COD",
      shipping_charges: data.shipingCost,
      total_discount: data.discount,
      sub_total: data.subTotal,
      length: other.length,
      breadth: other.breadth,
      height: other.height,
      weight: other.weight,
    }),
  };
  // console.log("optionss",JSON.parse(options.body));
  // console.log("other",other)
  request(options, async function (error, response) {
    if (error) {
      // throw new Error(error);
      // console.log("JSON.parse(error);",JSON.parse(error));
      return JSON.parse(error);
    }
    const resData = JSON.parse(response.body);
    let updateShipingData = await orderModel.updateOne(
      { _id: _id },
      { shiprocketData: resData }
    );
    // console.log("updateShipingData",updateShipingData)
    // console.log("resData",resData)
    return resData;
  });
};
router.post("/add-order-cash", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    if (req.body.messages === "get-api-add-order-data-cash") {
      orderModel
        .create({
          status: "in-process",
          customer_id: req.userId,
          payment: false,
          type: "COD",
          product_id: req.body.data.products_id,
          billingDetails: req.body.data.billingDetails,
          shipingOther: req.body.data.shipingOther,
          shipingDetails: req.body.data.shipingDetails,
          subTotal: req.body.data.subTotal,
          shipingCost: req.body.data.shipingCost,
          discount: req.body.data.couponVal,
          cart: req.body.data.cart,
          // totalCost : req.body.data.totalCost,
          is_delete: false,
        })
        .then(async (data) => {
          // console.log("data in create cod time",data);
          for (let i = 0; i < req.body.data.products_id.length; i++) {
            let cartUpdate = await cartModel
              .deleteOne({
                customer_id: req.userId,
                product_id: req.body.data.products_id[i],
              })
              .lean();
          }
          shipingApi(req.body.data.shiproketToken, data, false, data._id);
          res.status(200).json({ status: true });
          // res.status(200).send(true);
        })
        .catch((error) => {
          console.log("error in order create time", error);
        });
    } else {
      console.log("invalid peramiter");
    }
  } else {
    console.log("invalid token");
  }
});
// router.post("/order-status", jwtcheck, async (req,res)=>{
//     let mainCheck = await customersModel.findOne({_id : req.userId},{_id : 1}).lean();
//     if(mainCheck){
//         if(req.body.messages === "get-api-data-order-status" && req.body.order_id && req.body.shiproketToken){
//             var options = {
//                 'method': 'POST',
//                 'url': `https://apiv2.shiprocket.in/v1/external/courier/track?order_id=${req.body.order_id}`,
//                 'headers': {
//                   'Content-Type': 'application/json',
//                   "Authorization" : "Bearer" + req.body.shiproketToken
//                 },
//                 body: JSON.stringify({
//                   "order_id": data._id,
//                 })
//             };
//             request(options, async function (error, response) {
//                 if (error){
//                     // throw new Error(error);
//                     console.log("JSON.parse(error);",JSON.parse(error));
//                     return JSON.parse(error);
//                 }
//                 const resData = JSON.parse(response.body);
//                 // console.log("updateShipingData",updateShipingData)
//                 console.log("resData",resData)
//                 return resData;
//               });
//         }else{
//             console.log("invalid peramiter");
//         }
//     }else{
//         console.log("invalid token");
//     }
// })

module.exports = router;
