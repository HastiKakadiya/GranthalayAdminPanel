var express = require('express');
var router = express.Router();
var attributesModel = require("../models/attributes.model");

router.post('/', async function (req, res, next) {
    if (req.body.messages === "get-attributes-data") {
        // let parentColorAttribute = {};
        // let childColorAttributes = [];
        //   attributesModel.findOne({ is_delete : false, unique :true,},{_id : 1, name : 1}).then(async (data)=>{
        //     console.log("data is",data);
        //     if(data){
        //         parentColorAttribute = data;
        //         childColorAttributes = await attributesModel.find({is_delete : false, parent : data._id},{name : 1, parent : 1}).lean();
        //         console.log("childColorAttributes", childColorAttributes);
        //     }
        //   }).catch(error => {console.log("parentAributes find time", error)});
        // .then(async (data)=>{
        //     console.log("data is",data);
        //     if(data){
        //         parentColorAttribute = data;
        //         childColorAttributes = await attributesModel.find({is_delete : false, parent : data._id},{name : 1, parent : 1}).lean();
        //         console.log("childColorAttributes", childColorAttributes);
        //     }
        //   }).catch(error => {console.log("parentAributes find time", error)});

        let parentColorAttribute = await attributesModel.findOne({ is_delete: false, unique: true, }, { _id: 1, name: 1 }).lean();
        let childColorAttributes = await attributesModel.find({ is_delete: false, parent: parentColorAttribute ? parentColorAttribute._id : "" }, { name: 1, parent: 1, description: 1 }).lean();
        let parentAttributes = await attributesModel.find({ is_delete: false, unique: undefined, parent: undefined }, { name: 1 }).lean();
        let childAttributes = await attributesModel.find({ is_delete: false, parent: { $ne: null } }, { name: 1, parent: 1 }).lean();
        //   let otherAttributes = await  attributesModel.find({ is_delete : false, unique :undefined, parent : {$ne : null} }).populate("parent").lean()
        //   console.log("attributesModel data is",parentColorAttribute, parentColorAttribute, parentAttributes, childAttributes );
        res.status(200).json({ parentColorAttribute: parentColorAttribute, childColorAttributes: childColorAttributes, parentAttributes: parentAttributes, childAttributes: childAttributes, status: true })
    } else {
        console.log("invalid messages or slug in attributes");
    }
});

module.exports = router;