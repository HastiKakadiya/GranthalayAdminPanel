var express = require('express');
var router = express.Router();
var attributesModel = require("../models/attributes.model");
var mongoose = require("mongoose");
var message = "";

// Route to get the attributes page
router.get('/', async function (req, res, next) {
  if (req.session.count === NaN || req.session.count >= 0) {
    let parentAttributes = await attributesModel.find({ parent: undefined, is_delete: false }, { name: 1 }).lean();

    // If you are editing an existing attribute, you would retrieve the existing attribute here
    let existingAttribute = null;
    if (req.query.editId) {  // Assuming you're using query parameter to identify the attribute to edit
      existingAttribute = await attributesModel.findById(req.query.editId).lean();
    }

    let option = {
      sort: { _id: -1 },
      populate: "parent",
      page: 1,
      limit: 7,
    };

    attributesModel.paginate({ is_delete: false }, option, (error, result) => {
      res.render("attributes", {
        message: message,
        parent: parentAttributes,
        attributesData: result,
        existingParentId: existingAttribute ? existingAttribute.parent : null  // Pass existing parent ID
      });
      message = "";
    });
  } else {
    res.redirect("/admin");
  }
});


// Route to handle add and update of attributes
router.post('/', async function (req, res, next) {
  if (req.session.count === NaN || req.session.count >= 0) {
    if (req.body.submit === "addAttributes") {
      const { name, slug, parent, subParent, description } = req.body;

      if (name) {
        // If parent is valid, use ObjectId, else null
        let parentValue = (mongoose.Types.ObjectId.isValid(parent) && parent !== 'select-parent') ? parent : undefined;

        // Handle specific attribute conditions (e.g., for 'color' attribute)
        if (name.toLowerCase() === "color" || name.toLowerCase() === "colors") {
          let check = await attributesModel.findOne({ is_delete: false, unique: true }).lean();
          if (!check) {
            attributesModel.create({ name: name, unique: true, description: description, is_delete: false }).then((data) => {
              message = "Attributes added successfully.";
              res.redirect("/attributes");
            }).catch(error => {
              console.log("Error in adding attributes", error);
              message = "Duplicate data.";
              res.redirect("/attributes");
            });
          } else {
            message = "Duplicate data.";
            res.redirect("/attributes");
          }
        } else {
          // Create new attribute, handling parent
          attributesModel.create({ name: name, parent: parentValue, description: description, is_delete: false }).then((data) => {
            message = "Attributes added successfully.";
            res.redirect("/attributes");
          }).catch(error => {
            console.log("Error in adding attributes", error);
            message = "Duplicate data.";
            res.redirect("/attributes");
          });
        }
      } else {
        message = "Invalid data.";
        res.redirect("/attributes");
      }
    }

    // Handling update functionality
    if (mongoose.Types.ObjectId.isValid(req.body.submit)) {
      const { name, description, parent } = req.body;
      let parentValue = (mongoose.Types.ObjectId.isValid(parent) && parent !== 'select-parent') ? parent : undefined;

      attributesModel.updateOne({ _id: req.body.submit }, { name, description, parent: parentValue }).then(data => {
        if (data.modifiedCount >= 1) {
          message = "Attributes updated successfully.";
          res.redirect("/attributes");
        } else {
          message = "No changes made.";
          res.redirect("/attributes");
        }
      }).catch(error => {
        console.log("Error in updating attributes", error);
        message = "Error updating attribute.";
        res.redirect("/attributes");
      });
    }
  } else {
    res.redirect("/admin");
  }
});

// Delete attribute route
router.post("/delete", async (req, res) => {
  if (req.session.count === NaN || req.session.count >= 0) {
    if (req.body.message === "delete-attributes" && req.body.id) {
      attributesModel.findByIdAndUpdate(req.body.id, { is_delete: true }).then(async (data) => {
        if (data.parent === "select-parent") {
          let update = await attributesModel.updateMany({ is_delete: false, parent: data.name }, { is_delete: true }).lean();
        }
        res.send("done");
      });
    }
  }
});

// Edit attribute route (for populating data into the form)
router.post("/edit", async (req, res) => {
  if (req.session.count === NaN || req.session.count >= 0) {
    if (req.body.message === "edit-attributes" && req.body.id) {
      attributesModel.findById(req.body.id).then((data) => {
        res.send(data);
      });
    }
  }
});

// Search functionality
router.post("/search", async (req, res) => {
  if (req.session.count === NaN || req.session.count >= 0) {
    if (req.body.message === "search-attributes" && req.body.text !== "") {
      const re = new RegExp("^" + req.body.text, "i");
      attributesModel.find({ name: { $regex: re }, is_delete: false }).then((data) => {
        res.send(data);
      }).catch(error => {
        console.log("Error", error);
      });
    }
  }
});

// Pagination functionality
router.post("/pagination", (req, res) => {
  if (req.session.count === NaN || req.session.count >= 0) {
    if (req.body.message === "paginations-attributes" && req.body.page) {
      let option = {
        sort: { _id: -1 },
        populate: "parent",
        page: req.body.page,
        limit: 7,
      };
      attributesModel.paginate({ is_delete: false }, option, (error, result) => {
        res.send(result);
      });
    }
  }
});

module.exports = router;
