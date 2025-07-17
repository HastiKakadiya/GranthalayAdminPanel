var express = require('express');
var router = express.Router();
var couponModel = require("../models/coupon.model");
var mongoose = require("mongoose");
var message = "";

router.get('/', async function(req, res, next) {
    if(req.session.count === NaN || req.session.count >= 0){
      let option = {
        sort : {_id : -1},
        page: 1,
        limit: 7,
      };
      couponModel.paginate({is_delete : false}, option, (error, result)=>{
      //  console.log("data",result);
       res.render("coupon",{message : message, couponsData : result});
       message = "";
     })
    }else{
      res.redirect("/admin");
    }
  });

  router.post('/', async function(req, res, next) {
    if(req.session.count === NaN || req.session.count >= 0){
      // console.log("req.body is",req.body);
      if (req.body.submit === "addCoupons") {
          const {name, number, type, startDate, endDate} = req.body;
          if (!isNaN(number) && number != '') {
            if(type == "percentage" && number > 100){
                message = "invalid number, percentage in under 100";
                res.redirect("/coupon");
            }else{
                let start = new Date(startDate);
                let end = new Date(endDate);
                end.setHours(23, 59, 59);
                  if(start < end) {
                    // console.log("req.body is:",req.body);
                    // console.log("req.body is:",start, end);
                    // console.log("start is:",start.getDate(), start.getHours(), start.getMinutes());
                    // console.log("end is:",end.getDate(), end.getHours(), end.getMinutes());
                    couponModel.create({ name : name, number : number, type : type, start, end, status : true,  is_delete : false }).then((data)=>{
                        // console.log("data", data);
                      message = "attributes added";
                      res.redirect("/coupon");
                    }).catch(error=>{
                      console.log("error in coupon add time",error);
                      message = "coupon name is already exists";
                      res.redirect("/coupon");
                  })
                }else{
                    message = "invalid date, end date should be greater then start date";
                    res.redirect("/coupon");
                }
            }

         } else {
            message = "invalid data"
            res.redirect("/coupon");
      }
    }
    if(mongoose.Types.ObjectId.isValid(req.body.submit)){
        const {name, number, type, startDate, endDate} = req.body;
        if (!isNaN(number) && number != '') {
            if(type == "percentage" && number > 100){
                message = "invalid number, percentage in under 100";
                res.redirect("/coupon");
            }else{
                let start = new Date(startDate);
                let end = new Date(endDate);
                end.setHours(23, 59, 59);
                  if(start < end) {
                    // console.log("req.body is:",req.body);
                    // console.log("req.body is:",start, end);
                    // console.log("start is:",start.getDate(), start.getHours(), start.getMinutes());
                    // console.log("end is:",end.getDate(), end.getHours(), end.getMinutes());
                    couponModel.updateOne({_id : req.body.submit},{name, number, type, start, end,}).then(data => {
                      // console.log("updated data is",data);
                      if(data.modifiedCount >= 1){
                        message = "coupon updated"
                        res.redirect("/coupon");
                      }
                    }).catch(error=>{
                      console.log("error in attributes update time",error);
                      console.log("error in coupon update time",error);
                      message = "coupon name is already exists";
                      res.redirect("/coupon");
                  })
                }else{
                    message = "invalid date, end date should be greater then start date";
                    res.redirect("/coupon");
                }
            }

       } else {
          message = "invalid data"
          res.redirect("/coupon");
    }  
}
    }else{
      res.redirect("/admin");
    }
  });
  router.post("/pagination", (req,res)=>{
    if(req.session.count === NaN || req.session.count >= 0){
      if(req.body.message === "paginations-coupons" && req.body.page){
        let option = {
          sort : {_id : -1},
          page: req.body.page,
          limit: 7,
        };
        couponModel.paginate({is_delete : false}, option, (error, result)=>{
        //  console.log("data",result);
         res.send(result);
       })
      }
    }
  })
  router.post("/search", async (req,res)=> {
    if(req.session.count === NaN || req.session.count >= 0){
      if(req.body.message === "search-coupon" && req.body.text !== ""){
        const re = new RegExp("^"+req.body.text,"i");
        // console.log("text is",re)
        couponModel.find({ name: { $regex: re }}).then((data)=>{
        // console.log("search",data);
        res.send(data);
      }).catch(error => {
        console.log("error",error);
      })
      }else{
        
      }
    }
  })
  router.post("/delete", async (req,res)=>{
    if(req.session.count === NaN || req.session.count >= 0){
      if(req.body.message === "delete-coupon" && req.body.id){
        couponModel.findByIdAndUpdate(req.body.id, {is_delete : true})
        .then( async (data) => {
          // console.log("delete data",data);
          res.send("done");
        })
      }
    }
    })
router.post("/edit", async (req,res)=>{
    if(req.session.count === NaN || req.session.count >= 0){
        if(req.body.message === "edit-coupon" && req.body.id){
        couponModel.findById(req.body.id).then((data)=>{
        // console.log("data",data);
        res.send(data);
        })
        }
    }
    })
  module.exports = router;