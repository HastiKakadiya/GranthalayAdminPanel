  var express = require("express");
var router = express.Router();
var wishlistModel = require("../models/wishlist.model");
var jwtcheck = require("../middleware/jwtcheck");
var customersModel = require("../models/customer");

router.post("/", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    if (req.body.productId) {
      if (req.body.productId) {
        let check = await wishlistModel.findOne({
          customers_id: req.userId,
          products: req.body.productId,
        });
        console.log("check is ", req.body);
        if (check) {
          console.log("check have in if condition");
          res.status(200).json({ status: true });
        } else {
          wishlistModel
            .create({ customer_id: req.userId, product_id: req.body.productId })
            .then((data) => {
              console.log("data save", data);
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
  if (mainCheck) {
    if ((req.body.messages === "api-data-check-data", req.body.id)) {
      let check = await wishlistModel
        .findOne(
          {
            customers_id: req.userId,
            product_id: req.body.id,
            is_delete: false,
          },
          { _id: 1 }
        )
        .lean();
      // console.log("check is ",check);
      if (check) {
        // console.log("check have in if");
        res.status(200).json({ have: true });
      } else {
        // console.log("check have in else");
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
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    if (
      (req.body.messages === "get-update-customer_id-with-products-api",
      req.body.ids)
    ) {
      if (req.body.ids.length > 0) {
        wishlistModel
          .updateMany(
            { customer_id: req.userId, product_id: req.body.ids },
            { is_delete: true }
          )
          .lean()
          .then((data) => {
            // console.log("data is ",data);
            if (data.modifiedCount) {
              res.status(200).json({ status: true });
            }
          })
          .catch((error) =>
            console.log("error in wishlist update time ", error)
          );
      } else {
        console.log("ids is 0 in wishlist update time");
      }
    } else {
      console.log("invalid messages or slug in wishlist data check time");
    }
  } else {
    console.log("invalid token");
  }
});
router.post("/create", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
      wishlistModel
        .create({
          customer_id: req.userId,
          product_id: req.body.productId,
          is_delete: false,
        })
        .then((data) => {
          // console.log("data save", data)
          res.status(200).json({ status: true });
        })
        .catch((error) =>
          console.log("error have in wishlist create time", error)
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
    wishlistModel
      .find({ customer_id: req.userId })
      .populate({ path: "product_id", match: { is_delete: false } })
      .then((data) => {
        console.log("Find Data is :", data)
        if (data.length > 0) {
          res.status(200).json({ status: true, data: data });
        }
      })
      .catch((error) =>
        console.log("error have in wishlist ids give time", error)
      );
  } else {
    console.log("invalid token");
  }
});
router.post("/get-id", jwtcheck, async (req, res) => {
  let mainCheck = await customersModel
    .findOne({ _id: req.userId }, { _id: 1 })
    .lean();
  if (mainCheck) {
    if (req.body.messages === "get-customer_id-with-products-api") {
      wishlistModel
        .find({ customer_id: req.userId, is_delete: false }, { product_id: 1 })
        .then((data) => {
          // console.log("Find Data is :", data)
          if (data.length > 0) {
            let arr = [];
            for (let i = 0; i < data.length; i++) {
              arr[i] = data[i].product_id;
            }
            res.status(200).json({ status: true, ids: arr });
          }
        })
        .catch((error) =>
          console.log("error have in wishlist ids give time", error)
        );
    } else {
      console.log("invalid messages or slug in wishlist ids give time");
    }
  } else {
    console.log("invalid token");
  }
});

module.exports = router;
