var express = require("express");
var router = express.Router();
var cartModel = require("../models/cart.model");
var jwtcheck = require("../middleware/jwtcheck");
var customersModel = require("../models/customer");
var wishlistModel = require("../models/wishlist.model");

router.post("/", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  // console.log("mainCheck", mainCheck);
  if (mainCheck) {
    if (req.body.productId) {
      if (req.body.productId.length > 0) {
        let check = await cartModel.findOne({ customers_id: req.userId });
        // console.log("check is ",check);
        if (check) {
          // console.log("check have in if condition");
        } else {
          cartModel
            .create({ customers_id: req.userId, products: req.body.productId })
            .then((data) => {
              // console.log("data save", data)
              res.status(200).json({ status: true });
            })
            .catch((error) =>
              console.log("error have in wishlist create time", error)
            );
        }
      }
    } else {
      console.log("invalid messages or slug in wishlist create time");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/data-check", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  // console.log("mainCheck", mainCheck);

  if (mainCheck) {
    if ((req.body.messages === "data-check-data", req.body.id)) {
      let check = await cartModel
        .findOne(
          {
            customer_id: req.userId,
            product_id: req.body.id,
            attributes: req.body.attributes,
            is_delete: false,
            purchase: false,
          },
          { _id: 1, qty: 1, customer_id: 1 }
        )
        .lean();
      if (check) {
        // console.log("check have in if");
        cartModel
          .updateOne({ _id: check._id }, { qty: check.qty + req.body.qty })
          .lean()
          .then((data) => {
            // console.log("data update is",data);
            res.status(200).json({ have: true });
          })
          .catch((error) => {
            console.log("in cart data-check api is update time ", error);
          });
      } else {
        console.log("check have in else");
        res.status(200).json({ have: false });
      }
    } else {
      console.log("invalid messages or slug in wishlist data check time");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/update-id", jwtcheck, async (req, res) => {
  // console.log("req.body is:",req.body);
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  // console.log("mainCheck", mainCheck);
  if (mainCheck) {
    if (req.body.ids) {
      // if(req.body.ids.length > 0 && req.body.attrId.length > 0){
      // console.log("req.bosy",req.body);
      cartModel
        .updateMany(
          {
            customer_id: req.userId,
            product_id: req.body.ids,
            is_delete: false,
            purchase: false,
          },
          { is_delete: true }
        )
        .lean()
        .then((data) => {
          // console.log("data is ",data);
          if (data.modifiedCount) {
            res.status(200).json({ status: true });
          }
        })
        .catch((error) => console.log("error in cart update time ", error));

      // }else{
      //     console.log("ids is 0 in cart update time")
      // }
    } else {
      console.log("invalid messages or slug in cart data check time");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/create", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  // console.log("mainCheck", mainCheck);

  if (mainCheck) {
    if (req.body.id) {
      // console.log("req.body is:",req.body);
      cartModel
        .create({
          customer_id: req.userId,
          product_id: req.body.id,
          qty: (req.body.qty = 1),
          is_delete: false,
          purchase: false,
        })
        .then((data) => {
          // console.log("data save", data)
          res.status(200).json({ status: true });
        })
        .catch((error) =>
          console.log("error have in wishlist create time", error)
        );
    } else {
      console.log("invalid messages or slug in wishlist data check time");
    }
  } else {
    console.log("invalid token in create");
  }
});
router.post("/update-qty", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  // console.log("mainCheck", mainCheck);

  if (mainCheck) {
    console.log("req.body is:", req.body);
    if ((req.body.id, req.body.qty)) {
      if (req.body.qty > 0) {
        cartModel
          .updateOne(
            {
              customer_id: req.userId,
              product_id: req.body.id,
              is_delete: false,
              purchase: false,
            },
            { qty: req.body.qty }
          )
          .lean()
          .then((data) => {
            console.log("data is ", data);
            if (data.modifiedCount) {
              res.status(200).json({ status: true });
            }
          })
          .catch((error) => console.log("error in cart update time ", error));
      } else {
        res.status(200).json({ status: false, messages: "Quantity can not be decrease further" });

        console.log("qty is 0 in cart update time");
      }
    } else {
      res.status(200).json({ status: false, messages: "qty mini 1" });
      console.log("invalid messages or slug in wishlist data check time");
    }
  } else {
    console.log("invalid token");
  }
});
router.get("/get-id", jwtcheck, async (req, res) => {
  console.log("in get-id");
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  // console.log("mainCheck", mainCheck);
  if (mainCheck) {
    cartModel
      .find(
        { customer_id: req.userId, is_delete: false, purchase: false },
        { product_id: 1, attributes: 1, qty: 1 }
      )
      .lean()
      .then((data) => {
        console.log("Find Data is :", data);
        if (data.length > 0) {
          let arr = [];
          let qty = [];
          for (let i = 0; i < data.length; i++) {
            arr[i] = data[i].product_id;
            qty[i] = data[i].qty;
          }
          console.log("arr", arr);
          res.status(200).json({ status: true, ids: arr, qty: qty });
        }
      })
      .catch((error) =>
        console.log("error have in wishlist ids give time", error)
      );
  } else {
    console.log("invalid token in get-id");
  }
});
router.post("/length", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    if (req.body.messages === "get-wishlist-cart-length-api") {
      let cart = await cartModel
        .find(
          { customer_id: req.userId, is_delete: false, purchase: false },
          { _id: 1 }
        )
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

module.exports = router;
