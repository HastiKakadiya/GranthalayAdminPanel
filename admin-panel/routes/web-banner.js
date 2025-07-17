var express = require('express');
var router = express.Router();
var webBannerModel = require("../models/web-banner.model");
var mongoose = require("mongoose")
var multer = require("multer");
var path = require("path");
var message = ""

const storege = multer.diskStorage({
    destination: "./public/images/web-banner/",
    filename: (req, file, cb) => {
      cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage: storege,
  });

router.get('/', async function(req, res, next) {
  if(req.session.count === NaN || req.session.count >= 0){
    let parentAttributes = await webBannerModel.find({type : "web", is_delete : false},{name : 1}).lean();
    let option = {
      page: 1,
      limit: 5,
    };
    webBannerModel.paginate({is_delete : false,  type : "web"}, option, (error, result)=>{
    //  console.log("data",result);
     res.render("web-banner",{message : message, webBannerData : result});
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
    if (req.file && req.body.submit === "addWebBanner") {
        const {path} = req.file;
        let replacePath = path.replace(/\\/g, "/");;
        let splitPath = replacePath.split("public/")[1];
        // console.log("splitPath",process.env.DOMAIN_URL + splitPath);
        const realPath = process.env.DOMAIN_URL + splitPath;
        // console.log("env",realPath)
        webBannerModel.create({url : realPath, path : splitPath, type : "web", is_delete : false }).then((data)=>{
            message = "banner added";
            res.redirect("/web-banner");
          }).catch(error=>{
            console.log("error in banner add time",error);
            message = "duplicate data";
            res.redirect("/web-banner");
        })
    } else {
      // console.log("have in if", mongoose.Types.ObjectId.isValid(req.body.submit),req.body.submit);
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
          webBannerModel.updateOne({_id : submit},{path : splitPath, url : realPath}).then(data => {
            // console.log("updated data is",data);
            if(data.modifiedCount >= 1){
              message = "attributes updated"
              res.redirect("/web-banner");
            }else{
              message = "Invalid data";
              res.redirect("/web-banner");
            }
          }).catch(error=>{
            console.log("error in attributes update time",error);
        })
        }else{
        //   webBannerModel.updateOne({_id : submit},{position}).then(data => {
        //     console.log("updated data is",data);
        //     if(data.modifiedCount >= 1){
        //       message = "attributes updated"
        //       res.redirect("/web-banner");
        //     }else{
        //       message = "Invalid data";
        //       res.redirect("/web-banner");
        //     }
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
  if(req.body.message === "delete-web-banner" && req.body.id){
    webBannerModel.findByIdAndUpdate(req.body.id, {is_delete : true,})
    .then( async (data) => {
      // console.log("delete data",data);
      res.send("done");
    })
  }
}
})

router.post("/edit", async (req,res)=>{
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "edit-web-banner" && req.body.id){
    webBannerModel.findById(req.body.id).then((data)=>{
      // console.log("data",data);
      res.send(data);
    })
    }
  }
})

// router.post("/search", async (req,res)=> {
//   if(req.session.count === NaN || req.session.count >= 0){
//     if(req.body.message === "search-attributes" && req.body.text !== ""){
//       const re = new RegExp("^"+req.body.text,"i");
//       console.log("text is",re)
      
//       attributesModel.find({ name: { $regex: re }}).then((data)=>{
//       console.log("search",data);
//       res.send(data);
//     }).catch(error => {
//       console.log("error",error);
//     })
//     }else{
      
//     }
//   }
// })

router.post("/pagination", (req,res)=>{
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "paginations-web-banner" && req.body.page){
      let option = {
        page: req.body.page,
        limit: 5,
      };
      webBannerModel.paginate({is_delete : false}, option, (error, result)=>{
      //  console.log("data",result);
       res.send(result);
     })
    }
  }
})
module.exports = router;
