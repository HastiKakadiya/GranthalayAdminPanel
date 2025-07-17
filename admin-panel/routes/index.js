var express = require("express");
var router = express.Router();
var userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const saltRounds = 10; // Define salt rounds
var app = express();

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
// Redirect logged-in users to home page
app.get('/admin/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('login');
});

// Prevent access to forget-password page after login
app.get('/admin/forget-password', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('forget-password');
});

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
      return res.redirect('/home');
  }
  next();
}

router.get("/", function (req, res, next) {
  res.redirect("/admin");
});

router.get("/admin", function (req, res, next) {
  if (req.session.user) {
    return res.send(`
      <script>
        history.replaceState(null, null, "/home");
        window.location.href = "/home";
      </script>
    `);
  }
  res.render("login", { message: "" });
});

router.post("/admin", async (req, res) => {
  const { username, password } = req.body;

  try {
      let user = await userModel.findOne({ username }).lean();
      if (!user) {
          return res.render("login", { message: "Invalid username or password" });
      }

      // ✅ Securely compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.render("login", { message: "Invalid username or password" });
      }

      // ✅ Store only necessary user data in session
      req.session.user = {
          _id: user._id,
          username: user.username,
      };

      req.session.count = 1; // Initialize session counter
      res.send(`
        <script>
          history.replaceState(null, null, "/home");
          window.location.href = "/home";
        </script>
      `);
  } catch (error) {
      console.error("🔥 Error in login route:", error);
      res.render("login", { message: "Something went wrong. Try again." });
  }
});
router.get("/admin/forget-password", (req, res) => {
  if (req.session.user) {
    return res.redirect("/home"); // If user is logged in, send them home
  }
  res.render("forget-password", { message: "" });
});

router.post("/admin/forget-password", async (req, res) => {
  const { email } = req.body;

  try {
    let user = await userModel.findOne({ email }).lean();
    if (!user) {
      return res.render("forget-password", { message: "Email not found!" });
    }

    // Generate unique reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1-hour expiry

    // Update user with reset token
    await userModel.updateOne({ _id: user._id }, { resetToken, resetTokenExpiry });

    // Send reset email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hastikakadiya09@gmail.com", // Replace with your email
        pass: "wwjf rwsr epem pnsk"   // Replace with your app password
      }
    });

    // console.log("BASE_URL:", process.env.BASE_URL); // Add this line for debugging
    // const resetURL = `${process.env.BASE_URL}/admin/reset-password/${resetToken}`;


    const baseUrl = process.env.BASE_URL || 'https://granthalayaadmin.onrender.com';
const resetURL = `${baseUrl}/admin/reset-password/${resetToken}`;

        // const mailOptions = {
    //   from: "hastikakadiya09@gmail.com",
    //   to: email,
    //   subject: "Password Reset Request",
    //   html: `<p>You requested a password reset. Click <a href="${resetURL}">here</a> to reset your password. The link is valid for 1 hour.</p>`
    // };



    // const mailOptions = {
    //   from: '"Granthalay Support" <hastikakadiya09@gmail.com>',
    //   to: email,
    //   subject: "Password Reset Request - Granthalay",
    //   headers: {
    //     "X-Priority": "1",
    //     "X-Mailer": "Nodemailer",
    //     "Content-Type": "text/html; charset=UTF-8"
    //   },
    //   html: `
    //     <p>Dear User,</p>
    //     <p>You requested a password reset for your Granthalay account.</p>
    //     <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
    //     <p><a href="${resetURL}" style="background: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    //     <p>If you didn’t request this, you can safely ignore this email.</p>
    //     <p>Best Regards, <br> Granthalay Team</p>
    //   `
    // };


    const mailOptions = {
      from: '"Granthalay Support" <hastikakadiya09@gmail.com>',
      to: email,
      subject: "🔑 Reset Your Granthalay Password",
      headers: {
        "X-Priority": "1",
        "X-Mailer": "Nodemailer",
        "Content-Type": "text/html; charset=UTF-8"
      },
      html: `
        <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="text-align: center; color: #333;">Reset Your Password</h2>
            <p style="color: #555; font-size: 16px;">Hello,</p>
            <p style="color: #555; font-size: 16px;">
                We received a request to reset your password for your <strong>Granthalay</strong> account.
            </p>
            <p style="color: #555; font-size: 16px;">
                Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
            </p>
    
            <div style="text-align: center; margin: 20px 0;">
                <a href="${resetURL}" style="background: #008CBA; color: white; padding: 12px 20px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
            </div>
    
            <p style="color: #555; font-size: 16px;">
                If you did not request this, please ignore this email or contact our support team.
            </p>
    
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    
            <p style="text-align: center; color: #777; font-size: 14px;">
                If the button doesn't work, copy and paste the link below into your browser:
            </p>
            <p style="text-align: center;">
                <a href="${resetURL}" style="color: #008CBA; font-size: 14px;">${resetURL}</a>
            </p>
    
            <p style="text-align: center; color: #777; font-size: 12px;">
                Need help? Contact us at <a href="mailto:support@granthalay.com" style="color: #008CBA;">support@granthalay.com</a>
            </p>
    
            <p style="text-align: center; color: #777; font-size: 12px;">
                © ${new Date().getFullYear()} Granthalay. All rights reserved.
            </p>
        </div>
      `
    };
    
    
    await transporter.sendMail(mailOptions);
    
    res.render("forget-password", { message: "Reset link sent to your email!" });
  } catch (error) {
    console.error("Error in forget-password route:", error);
    res.render("forget-password", { message: "Something went wrong. Try again." });
  }
});

router.get("/admin/reset-password/:token", function (req, res, next) {
  if (req.session.user) {
      return res.redirect("/home"); // Prevent logged-in users from accessing reset page
  }
  
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");

  const { token } = req.params;

  userModel.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } }).lean()
      .then(user => {
          if (!user) {
              return res.render("reset-password", { message: "Invalid or expired reset token!", token: null });
          }
          res.render("reset-password", { message: "", token });
      })
      .catch(error => {
          console.error("Error in reset-password route:", error);
          res.render("reset-password", { message: "Something went wrong.", token: null });
      });
});


router.post("/admin/reset-password", async (req, res) => {
   const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required." });
    }

    try {
        const user = await userModel.findOne({ resetToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        // ✅ Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetToken = null; // Remove the token after reset
        await userModel.updateOne({ _id: user._id }, { password: hashedPassword, resetToken: null });

        return res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("🔥 Error in reset-password route:", error);
        return res.status(500).json({ message: "Something went wrong." });
    }
});

module.exports = router;
