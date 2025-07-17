var express = require('express');
var router = express.Router();
var appBannerModel = require("../models/app-banner.model");
var mongoose = require("mongoose")
var multer = require("multer");
var path = require("path");
var message = ""

const storege = multer.diskStorage({
    destination: "./public/images/app-banner/",
    filename: (req, file, cb) => {
      cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage: storege,
  });

router.get('/', async function(req, res, next) {
  if(req.session.count === NaN || req.session.count >= 0){
    let parentAttributes = await appBannerModel.find({type : "app", is_delete : false},{name : 1}).lean();
    let option = {
      page: 1,
      limit: 5,
    };
    appBannerModel.paginate({is_delete : false, type : "app"}, option, (error, result)=>{
    //  console.log("data",result);
     res.render("app-banner",{message : message, appBannerData : result});
     message = "";
   })
  }else{
    res.redirect("/admin");
  }
});

router.post('/',upload.single('banner'), async function(req, res, next) {
  if(req.session.count === NaN || req.session.count >= 0){
    // console.log("req.body is",req.body);
    // console.log(" req.files is", req.file);
    if (req.file && req.body.submit === "addAppBanner") {
        const {path} = req.file;
        let replacePath = path.replace(/\\/g, "/");;
        let splitPath = replacePath.split("public/")[1];
        // console.log("splitPath",process.env.DOMAIN_URL + splitPath);
        const realPath = process.env.DOMAIN_URL + splitPath;
        // console.log("env",realPath)
        appBannerModel.create({url : realPath, path : splitPath, type : "app", is_delete : false }).then((data)=>{
            message = "banner added";
            res.redirect("/app-banner");
          }).catch(error=>{
            console.log("error in banner add time",error);
            message = "duplicate data";
            res.redirect("/app-banner");
        })
    } else {
      if (mongoose.Types.ObjectId.isValid(req.body.submit)) {
        const { submit } = req.body;
        // console.log("this is second if");
        // console.log("req.body is",req.body);
        // console.log("req.file is",req.file);
        if(req.file){
          const {path} = req.file;
          let replacePath = path.replace(/\\/g, "/");
          let splitPath = replacePath.split("public/")[1];
          const realPath = process.env.DOMAIN_URL + splitPath;
          appBannerModel.updateOne({_id : submit},{ path : splitPath, url : realPath}).then(data => {
            // console.log("updated data is",data);
            if(data.modifiedCount >= 1){
              message = "attributes updated"
              res.redirect("/app-banner");
            }else{
                message = "Invalid data";
                res.redirect("/app-banner");
              }
          }).catch(error=>{
            console.log("error in attributes update time",error);
        })
        }else{
        //   appBannerModel.updateOne({_id : submit},{position}).then(data => {
        //     console.log("updated data is",data);
        //     if(data.modifiedCount >= 1){
        //       message = "attributes updated"
        //       res.redirect("/app-banner");
        //     }else{
        //         message = "Invalid data";
        //         res.redirect("/app-banner");
        //       }
        //   }).catch(error=>{
        //     console.log("error in attributes update time",error);
        // })
        }

    }
  }

  }else{
    res.redirect("/admin");
  }
});

router.post("/delete", async (req,res)=>{
if(req.session.count === NaN || req.session.count >= 0){
  if(req.body.message === "delete-app-banner" && req.body.id){
    appBannerModel.findByIdAndUpdate(req.body.id, {is_delete : true, position : null})
    .then( async (data) => {
      // console.log("delete data",data);
      res.send("done");
    })
  }
}
})

router.post("/edit", async (req,res)=>{
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "edit-app-banner" && req.body.id){
    appBannerModel.findById(req.body.id).then((data)=>{
      // console.log("data",data);
      res.send(data);
    })
    }
  }
})

router.post("/pagination", (req,res)=>{
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "paginations-app-banner" && req.body.page){
      let option = {
        page: req.body.page,
        limit: 5,
      };
      appBannerModel.paginate({is_delete : false}, option, (error, result)=>{
      //  console.log("data",result);
       res.send(result);
     })
    }
  }
})
module.exports = router;
