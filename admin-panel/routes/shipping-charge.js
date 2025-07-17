const express = require("express");
const router = express.Router();
const shippingModel = require("../models/shipping-charge");
let message = "";
// Display page with data
router.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const selectedState = req.query.state || "";
        const selectedCity = req.query.city || "";
        const page = parseInt(req.query.page) || 1;

        const regexSearch = new RegExp(searchQuery, "i");

        // Filtering conditions
        let filter = {
            is_delete: false,
            $or: [
                { city: regexSearch },
                { state: regexSearch },
                { pincode: regexSearch },
                { area: regexSearch }
            ]
        };

        if (selectedState) filter.state = selectedState;
        if (selectedCity) filter.city = selectedCity;

        // Pagination options
        const options = {
            sort: { _id: -1 },
            page: page,
            limit: 7
        };

        const result = await shippingModel.paginate(filter, options);

        // Unique states and cities for filter dropdowns
        const allData = await shippingModel.find({ is_delete: false });
        const states = [...new Set(allData.map(item => item.state))];
        const cities = [...new Set(allData.map(item => item.city))];

        res.render("shipping-charge", {
            shippingData: result,
            message: message,
            search: searchQuery,
            selectedState,
            selectedCity,
            states,
            cities
        });

        message = "";

    } catch (error) {
        console.log("Error fetching data:", error);
        res.render("shipping-charge", {
            shippingData: { docs: [] },
            message: "Error loading data",
            search: "",
            selectedState: "",
            selectedCity: "",
            states: [],
            cities: []
        });
    }
});


// Insert shipping charge
router.post("/", async (req, res) => {
    try {
        await shippingModel.create({ ...req.body, cod_available: req.body.cod_available === "true", is_active: req.body.is_active === "true" });
        res.redirect("/shipping-charge");
    } catch (error) {
        console.log("Insert Error:", error);
        res.redirect("/shipping-charge");
    }
});

// Get single record to edit
router.post("/edit", async (req, res) => {
    const record = await shippingModel.findById(req.body.id);
    res.send(record);
});

// Update shipping charge
router.post("/update/:id", async (req, res) => {
    try {
        await shippingModel.findByIdAndUpdate(req.params.id, { ...req.body, cod_available: req.body.cod_available === "true", is_active: req.body.is_active === "true" });
        res.redirect("/shipping-charge");
    } catch (err) {
        console.log("Update error", err);
        res.redirect("/shipping-charge");
    }
});

// Delete shipping charge (soft delete)
router.post("/delete", async (req, res) => {
    try {
        const updatedRecord = await shippingModel.findByIdAndUpdate(req.body.id, { is_delete: true }, { new: true });

        if (!updatedRecord) {
            return res.status(404).send({ success: false, message: "Record not found" });
        }

        res.send({ success: true, message: "Deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).send({ success: false, message: "Error deleting record" });
    }
});
router.post("/toggle", async (req, res) => {
    try {
      const { id, field, value } = req.body;
      if (!["is_active", "cod_available"].includes(field)) {
        return res.status(400).json({ success: false });
      }
      await shippingModel.findByIdAndUpdate(id, { [field]: value });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  });
  
module.exports = router;
