var express = require("express");
var router = express.Router();
var productsModel = require("../models/products.model");
var categoriesModel = require("../models/categories.model");
var attributesModel = require("../models/attributes.model");
var mongoose = require("mongoose");
const { ResultWithContext } = require("express-validator/src/chain");
router.post("/", async function (req, res) {
  const {
    title,
    short_description,
    full_description,
    assign_price,
    parent_categories,
    sub_categories,
    child_categories,
    parent_attributes,
    child_attributes,
    unassign_price,
    gst,
    slug,
    sku,
    status,
    shipping,
    cover_image,
    other_image,
    is_delete,
    new_arrivals,
    best_selling,
    hot_release,
    top_selling,
  } = req.body;

  try {
    // Check for existing product by SKU or slug (if applicable)
    const existingProduct = await productsModel.findOne({
      $or: [{ sku }, { slug }],
    });

    // If you want to ensure unique SKU or slug
    if (existingProduct) {
      return res.status(400).send({
        data: {},
        message: "Product with this SKU or slug already exists",
        success: false,
      });
    }

    // Create a new product
    const productDetails = await productsModel.create({
      title,
      short_description,
      full_description,
      assign_price,
      parent_categories,
      sub_categories,
      child_categories,
      parent_attributes,
      child_attributes,
      unassign_price,
      slug,
      sku,
      status,
      shipping,
      cover_image,
      other_image,
      best_selling,
    });

    // Send success response
    res.status(201).send({
      data: productDetails,
      message: "Product created successfully",
      success: true,
    });
  } catch (error) {
    // Handle errors
    console.error("Error creating product:", error);
    res
      .status(500)
      .send({ data: {}, message: "Internal Server Error", success: false });
  }
});

router.post("/single", async function (req, res, next) {
  if (req.body.slug) {
    let data = await productsModel
      .findOne({ slug: req.body.slug })
      .populate({ path: "child_attributes", match: { is_delete: false } })
      .populate({ path: "parent_attributes", match: { is_delete: false } })
      .lean();
    //    console.log("attributes is :",data);
    if (data) {
      let relatedPro = await productsModel
        .find({
          parent_categories: data.parent_categories
            ? data.parent_categories[0]
            : "",
          is_delete: false,
          _id: { $ne: data._id },
        })
        .sort({ _id: -1 })
        .limit(4)
        .lean();
      let newAdded = await productsModel
        .find({ is_delete: false, _id: { $ne: data._id } })
        .sort({ _id: -1 })
        .limit(3)
        .lean();
      let topSelling = await productsModel
        .find({ is_delete: false, top_selling: true, _id: { $ne: data._id } })
        .sort({ _id: -1 })
        .limit(3)
        .lean();
      res
        .status(200)
        .json({ data: data, relatedPro, newAdded, topSelling, status: true });
    } else {
      // console.log("slug is not there");
    }
    //    console.log("relatedPro",relatedPro)
    //    console.log("newAdded",newAdded)
    //    console.log("topSelling",topSelling);
  } else {
    // console.log("invalid messages or slug",req.body);
  }
});

router.post("/display", async (req, res) => {
  if (req.body.messages == "apicalling") {
    let newAdded = await productsModel
      .find({ is_delete: false })
      .sort({ _id: -1 })
      .limit(8)
      .lean();
    let data2 = await productsModel.aggregate([
      { $match: { is_delete: false } },
      { $sample: { size: 8 } },
    ]);
    let data3 = await productsModel.find({ is_delete: false }).limit(8).lean();
    res.json({ data1: newAdded, data2: data2, data3: data3, status: true });
  }
});

router.post("/best-sell-category", async (req, res) => {
  if (req.body.messages == "get-api-best-sell-category-data") {
    let categoryData = await categoriesModel.aggregate([
      { $match: { is_delete: false, parent: undefined } },
      { $sample: { size: 3 } },
    ]).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])
      ;
    // console.log("categoryData is the ",categoryData)
    res.json({ categoryData: categoryData, status: true });
  }
});

router.post("/best-sell-products", async (req, res) => {
  // if (req.body.messages == "get-api-best-sell-products-data") {
  // console.log("body is",req.body);
  // console.log("mongoose.Types.ObjectId.isValid(req.body.category1, req.body.category2, req.body.category3)",mongoose.Types.ObjectId.isValid(req.body.category1, req.body.category2, req.body.category3))
  let data1 = await productsModel
    .find({ best_selling: true, parent_categories: req.body.category1 }).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])
    .sort({ _id: -1 })
    .limit(5)
    .lean();
  let data2 = await productsModel
    .find({ best_selling: true, parent_categories: req.body.category2 })
    .sort({ _id: -1 })
    .limit(5)
    .lean();
  let data3 = await productsModel
    .find({ best_selling: true, parent_categories: req.body.category3 })
    .sort({ _id: -1 })
    .limit(5)
    .lean();
  // console.log("data1",data1)
  // console.log("data2",data2)
  // console.log("data3",data3)
  // let data2 = await productsModel.aggregate([{$match : {is_delete :false}},{$sample: { size: 8 } }]);
  // let data3 = await productsModel.find({is_delete : false}).limit(8).lean();
  res.json({ data1, data2, data3, status: true });
  // }
});

router.post("/new-arrivals", async (req, res) => {
  // if (req.body.messages == "get-api-new-arrivals-products-data") {
  let newArrivals = await productsModel
    .find({ is_delete: false, new_arrivals: true }).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])
    .sort({ _id: -1 })
    .limit(8)
    .lean();
  res.json({ newArrivals: newArrivals, status: true });
  // }
});

router.post("/last-tag", async (req, res) => {
  // if (req.body.messages == "get-api-last-tag-products-data") {
  let data1 = await productsModel.aggregate([
    { $match: { is_delete: false } },
    { $sample: { size: 5 } },
  ])
    ;
  let data2 = await productsModel
    .find({ is_delete: false, top_selling: true }).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])

    .sort({ updatedAt: -1 })
    .limit(3)
    .lean();
  let data3 = await productsModel
    .find({ is_delete: false, hot_release: true }).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])
    .sort({ updatedAt: -1 })
    .limit(3)
    .lean();
  res.json({ data1, data2, data3, status: true });
  // }
});

router.post("/by-category", async function (req, res, next) {
  if (
    req.body.messages === "get-api-categories-products-data" &&
    req.body.slug &&
    req.body.limit &&
    req.body.page
  ) {
    // console.log("................. req.body.slug .................... ",req.body.slug);
    let categoriesData = await categoriesModel
      .findOne({ is_delete: false, slug: req.body.slug }).populate([
        "parent_categories",
        "sub_categories",
        "child_categories",
        "parent_attributes",
      ])

      .lean();
    // console.log("categoriesData is :",categoriesData);

    let option = {
      // populate : { path : "parent_categories", match : {slug : req.body.slug} },
      populate: { path: "parent_categories", match: { is_delete: false } },
      page: req.body.page,
      limit: req.body.limit,
      sort: { _id: -1 },
    };
    if (categoriesData) {
      productsModel.paginate(
        { is_delete: false, parent_categories: categoriesData._id },
        option,
        (error, result) => {
          //  console.log("Products /by-category",result);
          let mainData = { docs: [] };
          if (error) {
            console.log("categories by  product find time", error);
          } else {
            res.status(200).json({ data: result, status: true });
          }
        }
      );
    } else {
      res.status(400).json({ status: false });
    }
    // productsModel.find({ is_delete : false, },{title : 1, parent_categories : 1, assign_price : 1, unassign_price : 1, slug : 1 }).populate({path : "parent_categories", match : {slug : req.body.slug}}).then((data)=>{
    //     console.log("product data is",data);
    //     res.status(200).json({data : data, status : true})
    // }).catch(error => {console.log("single product find time",error)})
  } else {
    console.log("invalid messages or slug");
  }
});

router.post("/by-category-child", async function (req, res, next) {
  // console.log("................. req.body.slug .................... ",req.body.slug1, req.body.slug2, req.body);
  if (
    req.body.messages === "get-api-categories-child-products-data" &&
    req.body.slug1 &&
    req.body.slug2 &&
    req.body.limit &&
    req.body.page
  ) {
    let categoriesData = await categoriesModel
      .findOne({ is_delete: false, slug: req.body.slug1 })
      .lean();
    // console.log("categoriesData is :",categoriesData);
    if (categoriesData) {
      let categoriesChildData = await categoriesModel
        .findOne({
          is_delete: false,
          parent: categoriesData._id,
          slug: req.body.slug2,
        })
        .lean();
      // console.log("categoriesChildData is :",categoriesChildData);
      let option = {
        // populate : { path : "parent_categories", match : {slug : req.body.slug} },
        populate: { path: "parent_categories", match: { is_delete: false } },
        page: req.body.page,
        limit: req.body.limit,
        sort: { _id: -1 },
      };
      if (categoriesChildData) {
        productsModel.paginate(
          { is_delete: false, child_categories: categoriesChildData._id },
          option,
          (error, result) => {
            //  console.log("Products /by-category",result);
            let mainData = { docs: [] };
            if (error) {
              console.log("categories by  product find time", error);
            } else {
              res.status(200).json({ data: result, status: true });
            }
          }
        );
      } else {
        res.status(400).json({ status: false });
      }
    } else {
      console.log("invalid messages or slug  ");
      res.status(400).json({ status: false });
    }
    // productsModel.find({ is_delete : false, },{title : 1, parent_categories : 1, assign_price : 1, unassign_price : 1, slug : 1 }).populate({path : "parent_categories", match : {slug : req.body.slug}}).then((data)=>{
    //     console.log("product data is",data);
    //     res.status(200).json({data : data, status : true})
    // }).catch(error => {console.log("single product find time",error)})
  } else {
    console.log("invalid messages or slug in first");
  }
});

router.post("/all", async function (req, res, next) {
  // if (req.body.messages === "get-api-all-products-data") {

  productsModel
    .find({ is_delete: false })
    .sort({ _id: -1 })
    .populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])

    .then((data) => {
      res.status(200).json({ data: data, status: true });
    })
    .catch((error) => {
      res.status(200).json({ data: {}, status: false });
      console.log("categories by  product find time", error);
    });

  // productsModel.find({ is_delete : false, },{title : 1, parent_categories : 1, assign_price : 1, unassign_price : 1, slug : 1 }).populate({path : "parent_categories", match : {slug : req.body.slug}}).then((data)=>{
  //     console.log("product data is",data);
  //     res.status(200).json({data : data, status : true})
  // }).catch(error => {console.log("single product find time",error)})
  // } else {
  //     console.log("invalid messages or slug for all products");
  // }
});

router.post("/new-top", async function (req, res, next) {
  // if (req.body.messages === "get-api-new-top-products-data") {
  let newAdded = await productsModel
    .find({ is_delete: false }).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])

    .sort({ _id: -1 })
    .limit(3)
    .lean();
  let topSelling = await productsModel
    .find({ is_delete: false, top_selling: true }).populate([
      "parent_categories",
      "sub_categories",
      "child_categories",
      "parent_attributes",
    ])

    .sort({ _id: -1 })
    .limit(3)
    .lean();
  res.status(200).json({ newAdded, topSelling, status: true });
  // } else {
  //     console.log("invalid messages");
  // }
});
router.post("/search", async function (req, res, next) {
  if (req.body.search) {
    const re = new RegExp("^" + req.body.search, "i");
    // console.log("text is",re)
    let searchProduct = await productsModel
      .find(
        { is_delete: false, title: { $regex: re } },
        {
          title: 1,
          assign_price: 1,
          unassign_price: 1,
          slug: 1,
          cover_image: 1,
        }
      )
      .limit(6)
      .lean();
    // console.log("console.log is :",searchProduct)
    res.status(200).json({ data, status: true });
  } else {
    console.log("invalid messages");
  }
});
router.post("/by-id", async function (req, res, next) {
  console.log("ids is :,,,,,,,,,,,,,,,,,,,,,,,", req.body);
  if (req?.body?.ids) {
    if (req.body.ids.length > 0) {
      // var allIds = []
      // for(let i = 0; i < req.body.ids.length; i++){
      //     allIds[i] = req.body.ids[i].value
      // }
      let data = await productsModel
        .find(
          { _id: req.body.ids },
          {
            title: 1,
            assign_price: 1,
            unassign_price: 1,
            slug: 1,
            cover_image: 1,
            short_description: 1,
            other_image: 1,
          }
        )
        .lean();
      // console.log("console.log is :",data)
      res.status(200).json({ data, status: true });
    } else {
      console.log("invalid messages in by-id");
    }
  } else {
    console.log("Error");
  }
});
// router.post('/by-id', async function (req, res, next) {
//     console.log("Received request body:", req.body);

//     if (Array.isArray(req.body.ids) && req.body.ids.length > 0) {
//         try {
//             // Ensure the 'ids' are of valid type (either strings or numbers)
//             const ids = req.body.ids.map(id => id.toString());  // Convert ids to string (if not already)

//             // Query the database for products by the provided IDs
//             let data = await productsModel.find({ id: { $in: ids } },
//                 { title: 1, assign_price: 1, unassign_price: 1, slug: 1, cover_image: 1, short_description: 1 }).lean();

//             if (data.length > 0) {
//                 return res.status(200).json({ data, status: true });
//             } else {
//                 return res.status(404).json({ message: 'No products found for the provided IDs', status: false });
//             }
//         } catch (error) {
//             console.error("Error fetching products:", error);
//             return res.status(500).json({ message: 'Internal server error', status: false });
//         }
//     } else {
//         return res.status(400).json({ message: 'Invalid or empty ids array', status: false });
//     }
// });

router.post("/by-id-cart", async function (req, res, next) {
  console.log("ids is :,,,,,,,,,,,,,,,,,,,,,,,", req.body);
  if (req.body.ids) {
    if (req.body.ids.length > 0) {
      var allIds = [];
      var idsReact = [];
      var qtysReact = [];
      for (let i = 0; i < req.body.ids.length; i++) {
        // let temp = i;
        let data = await productsModel
          .findOne(
            { is_delete: false, _id: req.body.ids[i] },
            {
              title: 1,
              assign_price: 1,
              unassign_price: 1,
              slug: 1,
              cover_image: 1,
              short_description: 1,
            }
          )
          .lean();
        // console.log("data",data);
        if (data) {
          allIds.push(data);
          idsReact.push(req.body.ids[i]);
          qtysReact.push(req.body.qty[i]);
          // console.log("attr",attr,"INDEX",i);
        } else {
        }
      }
      // console.log("fAttr", fAttr);
      // console.log("console.log is :",allIds)
      const response = {
        data: allIds,
        status: true,
        qtysReact: qtysReact,
        idsReact: idsReact,
      };
      console.log("response", response);
      res.status(200).json(response);
    } else {
      console.log("invalid messages in by-id");
    }
  } else {
    console.log("invalid messages in by-id");
  }
});
router.post("/by-filter", async function (req, res, next) {
  // if(req.body.messages === "get-api-filets-products-data" && req.body.ids.length >= 1 && req.body.price && req.body.page && req.body.limit) {
  if (
    req.body.messages === "get-api-filets-products-data" &&
    req.body.page &&
    req.body.limit
  ) {
    var query = { is_delete: false };
    const mainPrice = Number(req.body.price);
    // console.log("mainPrice is : *******************",mainPrice);
    if (req.body.ids.length >= 1 && Number(req.body.price) > 0) {
      // console.log("this is length and price condition ******************")
      query = {
        is_delete: false,
        child_attributes: { $all: req.body.ids },
        assign_price: { $lt: Number(req.body.price) + 0.1 },
      };
    }
    if (req.body.price > 0 && req.body.ids.length <= 0) {
      // console.log("this is price condition ******************")
      query = {
        is_delete: false,
        assign_price: { $lt: Number(req.body.price) + 0.1 },
      };
    }
    if (
      (req.body.price === undefined || req.body.price <= 0) &&
      req.body.ids.length >= 1
    ) {
      // console.log("this is length condition ******************")
      query = { is_delete: false, child_attributes: { $all: req.body.ids } };
    }

    // console.log("req.body is in by filter is:",req.body)
    let option = {
      page: req.body.page,
      limit: req.body.limit,
      sort: { _id: -1 },
    };
    //   console.log("last query is ",query);
    let filterProduct = await productsModel.paginate(
      query,
      option,
      (error, result) => {
        if (error) {
          console.log("categories by  product find time", error);
        } else {
          // console.log("in find paginate, ",result)
          return result;
        }
      }
    );
    // console.log("console.log is :",filterProduct);
    res.status(200).json({ data: filterProduct, status: true });
  } else {
    console.log(
      "invalid messages OR req.body.ids.length >= 1 OR req.body.price OR req.body.page OR req.body.limit"
    );
  }
});

module.exports = router;
