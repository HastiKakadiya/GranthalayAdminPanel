const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Middleware: Check if logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.redirect("/admin");
}

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: "./public/assets/imgs/people/", // Image destination folder
    filename: (req, file, cb) => {
        // Always save as admin-profile.jpg (this will replace the old file every time)
        cb(null, "admin-profile.jpg");
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true); // Allow only image files
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

// GET: Show edit profile form
// GET: Show edit profile form
router.get("/edit", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.user.username });
        if (!user) return res.redirect("/home");

        // ✅ Extract & clear messages BEFORE rendering
        const success = req.session.success;
        const error = req.session.error;
        req.session.success = null;
        req.session.error = null;

        // ✅ Now render with cleared session messages
        res.render("edit-profile", {
            user,
            success,
            error
        });
    } catch (err) {
        console.error("🔥 GET /profile/edit error:", err);
        res.render("edit-profile", { user: null, success: null, error: "Something went wrong." });
    }
});


// POST: Handle profile update
router.post("/edit", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
        const { username, oldPassword, password } = req.body;

        const user = await User.findOne({ username: req.session.user.username });
        if (!user) {
            req.session.error = "User not found!";
            return res.redirect("/profile/edit");
        }

        const updateData = {};

        // ✅ Username update logic
        if (username && username.trim()) {
            updateData.username = username;
        } else if (username && !username.trim()) {
            req.session.error = "Username is required!";
            return res.redirect("/profile/edit");
        }

        // ✅ Password update logic
        if (oldPassword || password) {
            if (!oldPassword || !password) {
                req.session.error = "Both old and new passwords are required to change the password.";
                return res.redirect("/profile/edit");
            }

            if (password.length < 6) {
                req.session.error = "New password must be at least 6 characters long.";
                return res.redirect("/profile/edit");
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                req.session.error = "Old password is incorrect.";
                return res.redirect("/profile/edit");
            }

            updateData.password = await bcrypt.hash(password, 10);
        }

        // ✅ Image update logic (replacing the old image with admin-profile.jpg)
        if (req.file) {
            // No need to delete old image manually, because multer will overwrite it as admin-profile.jpg
        }

        // Update user document
        await User.findByIdAndUpdate(user._id, updateData);

        // Update session user
        req.session.user.username = updateData.username || req.session.user.username;

        // Set success message and clear error
        req.session.success = "Profile updated successfully!";
        req.session.error = null;

        // Redirect to the edit profile page
        return res.redirect("/profile/edit");

    } catch (err) {
        console.error("🔥 POST /profile/edit error:", err);
        req.session.error = "Something went wrong!";
        req.session.success = null; // Clear success message in case of error
        return res.redirect("/profile/edit");
    }
});

module.exports = router;
