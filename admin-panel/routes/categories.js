var express = require('express');
var router = express.Router();
var categoriesModel = require("../models/categories.model");
var mongoose = require("mongoose");
var path = require("path");
var multer = require("multer");
var message = ""

router.get('/', async function(req, res, next) {
  if(req.session.count === NaN || req.session.count >= 0){
    let parentCategories = await categoriesModel.find({ is_delete : false ,parent : undefined },{name : 1}).lean();
    let option = {
      sort : {_id : -1},
      populate : ["parent", "sub_parent"],
      page: 1,
      limit: 7,
    };
    categoriesModel.paginate({is_delete : false}, option, (error, result)=>{
    //  console.log("data",result);
     res.render("categories",{message : message, parent : parentCategories,categoriesData : result});
     message = "";
   })
  }else{
    res.redirect("/admin");
  }
});

const storege = multer.diskStorage({
  destination: "./public/images/categories/",
  filename: (req, file, cb) => {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storege,
});

router.post('/', upload.single("cover_photo"), async function(req, res, next) {
  if(req.session.count === NaN || req.session.count >= 0){
    // console.log("req.body is",req.body);
    // console.log("req.file",req.file);
    if (req.body.submit === "addCategories") {
        const {name, slug, parent, subParent, gst, description} = req.body;
        // console.log("slug :",slug.charAt(0))
        // console.log("mongoose.Types.ObjectId.isValid(subParent)",mongoose.Types.ObjectId.isValid(subParent))
        let check = req.body.slug.match(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/)
        // console.log("check is :",check);
        if ( name ) {
          if(check) {
            if(mongoose.Types.ObjectId.isValid(parent) === true && mongoose.Types.ObjectId.isValid(subParent) === false){
                categoriesModel.create({ name : name, slug : slug, parent : parent,  description : description, is_delete : false }).then((data)=>{
                  message = "categories added";
                  res.redirect("/categories");
                  categoriesModel.updateOne({_id : parent},{used : true}).then(data => {}).catch(error=> {console.log("categories add time update error",error)})
                }).catch(error=>{
                  console.log("error in categories add time",error);
                  message = "duplicate data";
                  res.redirect("/categories");
              })
            }else if (mongoose.Types.ObjectId.isValid(subParent) === true && mongoose.Types.ObjectId.isValid(parent) === true) {
              categoriesModel.create({ name : name, slug : slug, parent : parent, sub_parent : subParent, description : description, is_delete : false }).then((data)=>{
                message = "categories added";
                res.redirect("/categories");
                // categoriesModel.updateOne({_id : subParent},{used : true}).then(data => {console.log("parent update is",data)}).catch(error=> {console.log("categories add time update error",error)})
              }).catch(error=>{
                console.log("error in categories add time",error);
                message = "duplicate data";
                res.redirect("/categories");
            })
            }else{
              if(req.file){
                // console.log("req.file",req.file);
                let coverPhotoSplitPath = "", coverPhotoRealPath = "";
                  let coverPhotoPath = req.file.path;
                  let replacePath = coverPhotoPath.replace(/\\/g, "/");;
                  coverPhotoSplitPath = replacePath.split("public/")[1];
                  // console.log("coverPhotoSplitPath",process.env.DOMAIN_URL + coverPhotoSplitPath);
                  coverPhotoRealPath = process.env.DOMAIN_URL + coverPhotoSplitPath;
                  categoriesModel.create({ name : name, cover_image : { path : coverPhotoSplitPath, url : coverPhotoRealPath }, slug : slug, gst : gst, description : description, is_delete : false, used : false }).then((data)=>{
                    message = "categories added";
                    res.redirect("/categories");
                  }).catch(error=>{
                    console.log("error in categories add time",error);
                    message = "duplicate data";
                    res.redirect("/categories");
                })

              }else{
                // console.log("have in image else")
                categoriesModel.create({ name : name, slug : slug, gst : gst, description : description, is_delete : false, used : false }).then((data)=>{
                  message = "categories added";
                  res.redirect("/categories");
                }).catch(error=>{
                  console.log("error in categories add time",error);
                  message = "duplicate data";
                  res.redirect("/categories");
              })
              }

            }
          }else {
            message = "invalid data in slug";
            res.redirect("/categories");
          }
         
       } else {
          message = "invalid data"
          res.redirect("/categories");
    }
    }
    if(mongoose.Types.ObjectId.isValid(req.body.submit)){
      const {name, slug, parent, subParent, gst, description} = req.body;
      // console.log("req.body is",req.body);
      if(req.file){
        // console.log("req.file have in update if",req.file);
        let coverPhotoSplitPath = "", coverPhotoRealPath = "";
          let coverPhotoPath = req.file.path;
          let replacePath = coverPhotoPath.replace(/\\/g, "/");;
          coverPhotoSplitPath = replacePath.split("public/")[1];
          // console.log("coverPhotoSplitPath",process.env.DOMAIN_URL + coverPhotoSplitPath);
          coverPhotoRealPath = process.env.DOMAIN_URL + coverPhotoSplitPath;
          categoriesModel.updateOne({_id : req.body.submit},{name, slug, cover_image : { path : coverPhotoSplitPath, url : coverPhotoRealPath },  gst, description}).then(data => {
            // console.log("updated data is",data);
            if(data.modifiedCount >= 1) {
              message = "categories updated"
              res.redirect("/categories");
            }
            }).catch(error=>{
              console.log("error in categories update time",error);
          })
      }else{
        // console.log("have in update else");
        categoriesModel.updateOne({_id : req.body.submit},{name, slug, gst, description}).then(data => {
          // console.log("updated data is",data);
          if(data.modifiedCount >= 1){
            message = "categories updated"
            res.redirect("/categories");
          }
          }).catch(error=>{
            console.log("error in categories update time",error);
        })
      }
    }
  }else{
    res.redirect("/admin");
  }
});


router.post("/sub-parent", async (req,res)=>{
if(req.session.count === NaN || req.session.count >= 0){
  if(req.body.message === "get-sub-parent" && req.body.id){
      let subParentCategories = await categoriesModel.find({is_delete : false, parent : req.body.id, sub_parent : undefined },{name : 1}).lean();
      // console.log("subParentCategories",subParentCategories)
      res.status(200).json({subParent : subParentCategories});
  }
}
});

router.post("/delete", async (req,res)=>{
if(req.session.count === NaN || req.session.count >= 0){
  if(req.body.message === "delete-categories" && req.body.id){
    categoriesModel.findByIdAndUpdate(req.body.id, {is_delete : true})
    .then( async (data) => {
      // console.log("delete data",data);
      if(data.parent === "select-parent"){
       let update = await categoriesModel.updateMany({is_delete : false, parent : data.name},{is_delete : true}).lean()
      //  let find = await categoriesModel.find({is_delete : false, parent : data.name}).lean()
        // console.log("data is",data);
        // console.log("find is",update);
        // console.log("select-parent in if");
      }

      if(mongoose.Types.ObjectId.isValid(data.parent)) {
        let find = await categoriesModel.find({is_delete : false, parent : data.parent, sub_parent : undefined}).lean()
        // console.log("find in deleteing time",find);
            if(find == [] || find == null || find == "") {
              // console.log("in if")
              categoriesModel.updateOne({_id : data.parent},{used : false}).then(data => {}).catch(error=> {console.log("categories add time update error",error)})
            }
      }

      if(data.sub_parent === "select-sub-parent"){
       let update = await categoriesModel.updateMany({is_delete : false, sub_parent : data.name},{is_delete : true}).lean()
      //  console.log("sub_parent is",update);
      //  console.log("select-sub-parent in if");
       res.send("done");
      }else{
        res.send("done");
      //  console.log("select-sub-parent in else");
      }

    })
  }
}
})

router.post("/edit", async (req,res)=>{
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "edit-categories" && req.body.id){
    categoriesModel.findById(req.body.id).populate("parent").populate("sub_parent").then((data)=>{
      // console.log("data",data);
      res.send(data);
    })
    }
  }
})

router.post("/search", async (req,res)=> {
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "search-categories" && req.body.text !== ""){
      const re = new RegExp("^"+req.body.text,"i");
      // console.log("text is",re)
      categoriesModel.find({ name: { $regex: re }}).populate("parent").populate("sub_parent").then((data)=>{
      // console.log("search",data);
      res.send(data);
    }).catch(error => {
      console.log("error",error);
    })
    }else{
      
    }
  }
})

router.post("/pagination", (req,res)=>{
  if(req.session.count === NaN || req.session.count >= 0){
    if(req.body.message === "paginations-categories" && req.body.page){
      let option = {
        sort : {_id : -1},
        populate : ["parent", "sub_parent"],
        page: req.body.page,
        limit: 7,
      };
     categoriesModel.paginate({is_delete : false}, option, (error, result)=>{
      //  console.log("data",result);
       res.send(result);
     })
    }
  }
})
module.exports = router;
